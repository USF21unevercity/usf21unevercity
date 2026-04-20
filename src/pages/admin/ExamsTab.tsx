import { useEffect, useState } from "react";
import { Plus, Trash2, Download, FileText, Eye, EyeOff, Upload, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COLLEGES } from "@/lib/colleges";
import { parseQuestionsText, extractPdfText, type MCQ } from "@/lib/parseQuestions";

type Exam = {
  id: string;
  title: string;
  college: string;
  duration_minutes: number;
  access_code: string;
  questions: MCQ[];
  is_active: boolean;
  created_at: string;
};

export default function ExamsTab({ isOwner, collegeFilter }: { isOwner: boolean; collegeFilter: string | null }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Exam | null>(null);
  const [resultsFor, setResultsFor] = useState<Exam | null>(null);

  async function load() {
    setLoading(true);
    let q: any = supabase.from("exams").select("*").order("created_at", { ascending: false });
    if (collegeFilter) q = q.eq("college", collegeFilter);
    const { data } = await q;
    setExams((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [collegeFilter]);

  async function del(ex: Exam) {
    if (!confirm(`حذف اختبار "${ex.title}"؟ سيتم حذف نتائج الطلاب المرتبطة به.`)) return;
    const { error } = await supabase.from("exams").delete().eq("id", ex.id);
    if (error) { toast.error("فشل الحذف: " + error.message); return; }
    toast.success("تم الحذف");
    load();
  }
  async function toggle(ex: Exam) {
    const { error } = await supabase.from("exams").update({ is_active: !ex.is_active }).eq("id", ex.id);
    if (error) { toast.error("فشل التحديث"); return; }
    load();
  }

  if (resultsFor) return <ExamResults exam={resultsFor} onBack={() => setResultsFor(null)} />;
  if (viewing) return <ExamPreview exam={viewing} onBack={() => setViewing(null)} />;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-3 shadow-soft flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">عدد الاختبارات: <span className="font-bold text-foreground">{exams.length}</span></div>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-gradient-purple text-white font-bold px-5 py-2.5 rounded-xl shadow-glow inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? "إخفاء النموذج" : "إضافة اختبار جديد"}
        </button>
      </div>

      {showForm && <ExamForm defaultCollege={collegeFilter || ""} onCreated={() => { setShowForm(false); load(); }} />}

      {loading ? <div className="text-center py-10 text-muted-foreground">جارٍ التحميل...</div> :
       exams.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">لا توجد اختبارات</div> : (
        <div className="grid gap-3">
          {exams.map(ex => (
            <div key={ex.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-foreground">{ex.title}</h3>
                    {!ex.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">موقوف</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{ex.college} · المدة: {ex.duration_minutes} دقيقة · {ex.questions?.length || 0} أسئلة</div>
                  <div className="mt-2 inline-flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-1.5 text-sm">
                    <span className="text-muted-foreground">رمز الدخول:</span>
                    <span className="font-mono font-bold text-primary tracking-wider" dir="ltr">{ex.access_code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setResultsFor(ex)} className="bg-gradient-gold text-brand-purple-deep font-bold px-3 py-2 rounded-xl text-sm inline-flex items-center gap-1">
                    <Download className="w-4 h-4" /> النتائج
                  </button>
                  <button onClick={() => setViewing(ex)} className="bg-secondary text-secondary-foreground font-bold px-3 py-2 rounded-xl text-sm inline-flex items-center gap-1">
                    <Eye className="w-4 h-4" /> الأسئلة
                  </button>
                  <button onClick={() => toggle(ex)} className="bg-secondary text-secondary-foreground font-bold p-2 rounded-xl" title={ex.is_active ? "إيقاف" : "تفعيل"}>
                    {ex.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => del(ex)} className="text-destructive hover:bg-destructive/10 p-2 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function ExamForm({ defaultCollege, onCreated }: { defaultCollege: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [college, setCollege] = useState(defaultCollege || "");
  const [collegeFree, setCollegeFree] = useState(false);
  const [duration, setDuration] = useState("30");
  const [code, setCode] = useState(genCode());
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<MCQ[]>([]);
  const [saving, setSaving] = useState(false);

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const t = await extractPdfText(file);
      setText(t);
      const qs = parseQuestionsText(t);
      setParsed(qs);
      toast.success(`تم استخراج ${qs.length} سؤال من الملف`);
    } catch (err: any) {
      toast.error("فشل قراءة PDF: " + err.message);
    } finally { setParsing(false); e.target.value = ""; }
  }

  function onParseText() {
    const qs = parseQuestionsText(text);
    setParsed(qs);
    if (qs.length === 0) toast.error("لم يتم اكتشاف أي أسئلة. تأكد من الصيغة.");
    else toast.success(`تم اكتشاف ${qs.length} سؤال`);
  }

  async function save() {
    if (!title.trim()) { toast.error("اكتب عنوان الاختبار"); return; }
    if (!college.trim()) { toast.error("اكتب اسم الكلية"); return; }
    if (!code.trim()) { toast.error("اكتب رمز الاختبار"); return; }
    const dur = parseInt(duration); if (!dur || dur < 1) { toast.error("مدة غير صحيحة"); return; }
    if (parsed.length === 0) { toast.error("لا توجد أسئلة. اكتب الأسئلة ثم اضغط 'تحويل لاختيارات'"); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("exams").insert({
      title: title.trim(), college: college.trim(), duration_minutes: dur,
      access_code: code.trim(), questions: parsed, is_active: true,
    });
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success("تم إنشاء الاختبار");
    onCreated();
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> اختبار جديد</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الاختبار *"
          className="px-4 py-2.5 rounded-xl border border-border bg-background" />
        <div className="flex gap-2">
          {collegeFree ? (
            <input value={college} onChange={e => setCollege(e.target.value)} placeholder="اسم الكلية يدوياً *"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background" />
          ) : (
            <select value={college} onChange={e => setCollege(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background">
              <option value="">اختر الكلية *</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button type="button" onClick={() => setCollegeFree(!collegeFree)}
            className="px-3 rounded-xl bg-secondary text-xs font-bold">{collegeFree ? "قائمة" : "يدوي"}</button>
        </div>
        <input type="number" min={1} value={duration} onChange={e => setDuration(e.target.value)} placeholder="المدة بالدقائق *"
          className="px-4 py-2.5 rounded-xl border border-border bg-background" />
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="رمز الاختبار *" dir="ltr"
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background font-mono tracking-wider text-center font-bold" />
          <button type="button" onClick={() => setCode(genCode())} className="px-3 rounded-xl bg-secondary text-xs font-bold">عشوائي</button>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
        <div className="text-sm font-bold text-foreground">الأسئلة (يدوي أو من PDF)</div>
        <div className="text-xs text-muted-foreground">
          الصيغة: ضع كل سؤال في فقرة، ثم 4 خيارات بأحرف (أ/ب/ج/د) أو أرقام، ثم سطر "الإجابة: ب".
          افصل بين الأسئلة بسطر فارغ.
        </div>
        <pre className="text-xs bg-background border border-border rounded-lg p-2 whitespace-pre-wrap leading-6" dir="rtl">
{`1) ما عاصمة فرنسا؟
أ) برلين
ب) باريس
ج) لندن
د) روما
الإجابة: ب`}
        </pre>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2 rounded-xl shadow-gold inline-flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> {parsing ? "جارٍ القراءة..." : "رفع PDF"}
            <input type="file" accept="application/pdf" onChange={onPdf} className="hidden" />
          </label>
          <button type="button" onClick={onParseText}
            className="bg-gradient-purple text-white font-bold px-4 py-2 rounded-xl shadow-glow inline-flex items-center gap-2">
            <FileText className="w-4 h-4" /> تحويل لاختيارات
          </button>
          {parsed.length > 0 && <span className="text-sm font-bold text-primary">تم اكتشاف {parsed.length} سؤال ✓</span>}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
          placeholder="اكتب الأسئلة هنا..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm leading-7" dir="rtl" />
      </div>

      {parsed.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-3 max-h-64 overflow-auto space-y-2">
          {parsed.map((q, i) => (
            <div key={i} className="bg-background rounded-lg p-2 text-sm">
              <div className="font-bold mb-1">{i+1}. {q.question}</div>
              <ol className="text-xs space-y-0.5 mr-4">
                {q.options.map((o, j) => (
                  <li key={j} className={j === q.correctIndex ? "text-green-700 font-bold" : "text-muted-foreground"}>
                    {["أ","ب","ج","د","هـ"][j]}) {o} {j === q.correctIndex && "✓"}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full bg-gradient-purple text-white font-bold py-3 rounded-xl shadow-glow disabled:opacity-50">
        {saving ? "جارٍ الحفظ..." : "حفظ الاختبار"}
      </button>
    </div>
  );
}

function ExamPreview({ exam, onBack }: { exam: Exam; onBack: () => void }) {
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="bg-secondary text-secondary-foreground font-bold px-4 py-2 rounded-xl">← رجوع</button>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <div className="font-bold text-lg mb-3">{exam.title}</div>
        <div className="text-sm text-muted-foreground mb-4">{exam.college} · {exam.duration_minutes} دقيقة · رمز: <span className="font-mono font-bold" dir="ltr">{exam.access_code}</span></div>
        <div className="space-y-3">
          {exam.questions.map((q, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-3">
              <div className="font-bold mb-2">{i+1}. {q.question}</div>
              <ol className="space-y-1 mr-4 text-sm">
                {q.options.map((o, j) => (
                  <li key={j} className={j === q.correctIndex ? "text-green-700 font-bold" : ""}>
                    {["أ","ب","ج","د","هـ"][j]}) {o} {j === q.correctIndex && "✓"}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamResults({ exam, onBack }: { exam: Exam; onBack: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any).from("exam_attempts").select("*")
      .eq("exam_id", exam.id).order("started_at", { ascending: false });
    setItems(data || []); setLoading(false);
  }
  useEffect(() => { load(); }, [exam.id]);

  async function del(id: string) {
    if (!confirm("حذف هذه النتيجة؟")) return;
    await (supabase as any).from("exam_attempts").delete().eq("id", id);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("تم الحذف");
  }

  function exportCsv() {
    if (items.length === 0) { toast.error("لا توجد نتائج"); return; }
    const headers = ["الاسم الرباعي","وقت الاختبار","عدد الأسئلة","صحيح","خطأ","النسبة %","التعليق"];
    const rows = items.map(i => [
      i.student_name,
      new Date(i.started_at).toLocaleString("ar"),
      i.total_questions, i.correct_count, i.wrong_count, i.percentage,
      i.feedback || "",
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `نتائج_${exam.title}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("تم تنزيل ملف Excel");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="bg-secondary text-secondary-foreground font-bold px-4 py-2 rounded-xl">← رجوع</button>
        <button onClick={exportCsv} disabled={items.length === 0}
          className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2 rounded-xl shadow-gold inline-flex items-center gap-2 disabled:opacity-50">
          <Download className="w-4 h-4" /> تصدير Excel ({items.length})
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
        <div className="font-bold text-foreground">{exam.title}</div>
        <div className="text-xs text-muted-foreground">{exam.college} · {exam.questions.length} أسئلة</div>
      </div>
      {loading ? <div className="text-center py-10 text-muted-foreground">جارٍ التحميل...</div> :
       items.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">لا توجد نتائج بعد</div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">الوقت</th>
              <th className="p-3 text-right">صحيح</th>
              <th className="p-3 text-right">خطأ</th>
              <th className="p-3 text-right">النسبة</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-bold">{i.student_name}</td>
                <td className="p-3 text-xs">{new Date(i.started_at).toLocaleString("ar")}</td>
                <td className="p-3 text-green-700 font-bold">{i.correct_count}</td>
                <td className="p-3 text-red-700 font-bold">{i.wrong_count}</td>
                <td className="p-3 font-bold text-primary">{i.percentage}%</td>
                <td className="p-3"><button onClick={() => del(i.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
