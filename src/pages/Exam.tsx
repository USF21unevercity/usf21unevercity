import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, KeyRound, Play, ChevronLeft, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MCQ } from "@/lib/parseQuestions";
import { normalizeArabicName } from "@/lib/normalizeName";

type Exam = {
  id: string;
  title: string;
  college: string;
  duration_minutes: number;
  questions: MCQ[];
};

type Phase = "entry" | "intro" | "running" | "finished";

export default function ExamPage() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{ correct: number; wrong: number; pct: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number | null>(null);

  async function startEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { toast.error("الاسم ورمز الاختبار مطلوبان"); return; }
    setLoading(true);
    const { data, error } = await (supabase as any).from("exams").select("*")
      .eq("access_code", code.trim()).eq("is_active", true).maybeSingle();
    if (error || !data) { setLoading(false); toast.error("رمز الاختبار غير صحيح أو الاختبار غير متاح"); return; }
    // Check duplicate attempt by normalized name for this exam
    const normalized = normalizeArabicName(name.trim());
    const { data: prev } = await (supabase as any).from("exam_attempts")
      .select("id").eq("exam_id", data.id).eq("student_name_normalized", normalized).limit(1);
    setLoading(false);
    if (prev && prev.length > 0) {
      toast.error("عزيزي الطالب/ة، لا يمكنك الاختبار مرة أخرى لأنك قمت بالإجابة سابقاً. شكراً لك");
      return;
    }
    const ex: Exam = {
      id: data.id, title: data.title, college: data.college,
      duration_minutes: data.duration_minutes,
      questions: Array.isArray(data.questions) ? data.questions : [],
    };
    if (ex.questions.length === 0) { toast.error("الاختبار لا يحتوي أسئلة"); return; }
    setExam(ex);
    setAnswers(new Array(ex.questions.length).fill(-1));
    setPhase("intro");
  }

  async function beginExam() {
    if (!exam) return;
    // Generate the attempt id client-side so we don't need SELECT permission after INSERT (RLS-safe).
    const newId = (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { error } = await (supabase as any).from("exam_attempts").insert({
      id: newId,
      exam_id: exam.id, student_name: name.trim(), college: exam.college,
      total_questions: exam.questions.length,
    });
    if (error) { toast.error("تعذر بدء الاختبار: " + error.message); return; }
    setAttemptId(newId);
    setSecondsLeft(exam.duration_minutes * 60);
    setPhase("running");
  }

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { window.clearInterval(timerRef.current!); finish(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [phase]);

  async function finish() {
    if (!exam || !attemptId) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    let correct = 0;
    for (let i = 0; i < exam.questions.length; i++) {
      if (answers[i] === exam.questions[i].correctIndex) correct++;
    }
    const wrong = exam.questions.length - correct;
    const pct = Math.round((correct / exam.questions.length) * 10000) / 100;
    await (supabase as any).from("exam_attempts").update({
      finished_at: new Date().toISOString(),
      correct_count: correct, wrong_count: wrong,
      total_questions: exam.questions.length,
      percentage: pct, answers, feedback: feedback.trim() || null,
    }).eq("id", attemptId);
    setResult({ correct, wrong, pct });
    setPhase("finished");
  }

  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <div>
      <section className="bg-hero text-white py-10 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <ClipboardList className="w-12 h-12 text-brand-gold mx-auto mb-2" />
          <h1 className="text-3xl md:text-4xl font-bold">الاختبار الإلكتروني</h1>
          <p className="text-white/85 mt-1">اختبارات اللجنة العلمية المركزية</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-2xl">
        {phase === "entry" && (
          <form onSubmit={startEntry} className="bg-card rounded-3xl border border-border shadow-card-elev p-6 md:p-8 space-y-4">
            <div>
              <label className="block font-bold text-sm mb-2">الاسم الرباعي</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="ادخل اسمك الرباعي"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
            </div>
            <div>
              <label className="block font-bold text-sm mb-2 flex items-center gap-2"><KeyRound className="w-4 h-4" /> رمز الاختبار</label>
              <input value={code} onChange={e => setCode(e.target.value)} required dir="ltr"
                placeholder="أدخل رمز الاختبار"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background tracking-widest text-center font-bold" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-purple text-white font-bold py-3 rounded-xl shadow-glow disabled:opacity-50">
              {loading ? "جارٍ التحقق..." : "الدخول للاختبار"}
            </button>
          </form>
        )}

        {phase === "intro" && exam && (
          <div className="bg-card rounded-3xl border border-border shadow-card-elev p-8 text-center space-y-5">
            <div className="text-2xl font-bold text-foreground">{exam.title}</div>
            <p className="text-muted-foreground">عزيزي الطالب/ة، زمن الاختبار <span className="font-bold text-primary">{exam.duration_minutes}</span> دقيقة، وعدد الأسئلة <span className="font-bold text-primary">{exam.questions.length}</span>.</p>
            <p className="text-sm text-muted-foreground">عند الضغط على "بدء الاختبار" يبدأ العداد ولا يمكن إيقافه.</p>
            <button onClick={beginExam} className="bg-gradient-gold text-brand-purple-deep font-extrabold px-8 py-3 rounded-xl shadow-gold inline-flex items-center gap-2">
              <Play className="w-5 h-5" /> بدء الاختبار
            </button>
          </div>
        )}

        {phase === "running" && exam && (
          <RunningView exam={exam} answers={answers} setAnswers={setAnswers}
            current={current} setCurrent={setCurrent} secondsLeft={secondsLeft} fmtTime={fmtTime} onFinish={finish}
            feedback={feedback} setFeedback={setFeedback} />
        )}

        {phase === "finished" && exam && result && (
          <div className="bg-card rounded-3xl border border-border shadow-card-elev p-8 text-center space-y-3">
            <div className="text-2xl font-bold">انتهى الاختبار</div>
            <div className="text-foreground">الاسم: <span className="font-bold">{name}</span></div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-extrabold text-green-700">{result.correct}</div>
                <div className="text-xs text-muted-foreground">إجابات صحيحة</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-2xl font-extrabold text-red-700">{result.wrong}</div>
                <div className="text-xs text-muted-foreground">إجابات خاطئة</div>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <div className="text-2xl font-extrabold text-primary">{result.pct}%</div>
                <div className="text-xs text-muted-foreground">النسبة المئوية</div>
              </div>
            </div>
            <button onClick={() => { setPhase("entry"); setName(""); setCode(""); setExam(null); setResult(null); setAttemptId(null); setCurrent(0); setFeedback(""); }}
              className="mt-4 bg-secondary text-secondary-foreground font-bold px-6 py-2.5 rounded-xl">العودة</button>
          </div>
        )}
      </section>
    </div>
  );
}

function RunningView({ exam, answers, setAnswers, current, setCurrent, secondsLeft, fmtTime, onFinish, feedback, setFeedback }: any) {
  const q: MCQ = exam.questions[current];
  const isLast = current === exam.questions.length - 1;
  const allAnswered = useMemo(() => answers.every((a: number) => a >= 0), [answers]);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center justify-between">
        <div className="text-sm font-bold text-foreground">السؤال {current + 1} / {exam.questions.length}</div>
        <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-xl ${secondsLeft < 60 ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"}`}>
          <Clock className="w-4 h-4" /> {fmtTime(secondsLeft)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-card-elev">
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt: string, i: number) => {
            const selected = answers[current] === i;
            return (
              <button key={i} onClick={() => { const next = [...answers]; next[current] = i; setAnswers(next); }}
                className={`w-full text-right px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background hover:border-primary/40"
                }`}>
                <span className="inline-block w-7 h-7 rounded-full bg-secondary text-secondary-foreground font-bold text-sm leading-7 text-center ml-2">
                  {["أ","ب","ج","د","هـ"][i] || (i+1)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {isLast && (
        <div className="bg-card border border-border rounded-3xl p-5 shadow-card-elev">
          <label className="block font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            عزيزي الطالب/ة، ما رأيك في العمل التطوعي الذي يقوم به ملتقى الطالب الجامعي لخدمة الطلاب؟
          </label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
            placeholder="اكتب رأيك هنا (اختياري)..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button disabled={current === 0} onClick={() => setCurrent(current - 1)}
          className="bg-secondary text-secondary-foreground font-bold px-5 py-2.5 rounded-xl disabled:opacity-40">
          السابق
        </button>
        {!isLast ? (
          <button disabled={answers[current] < 0} onClick={() => setCurrent(current + 1)}
            className="bg-gradient-purple text-white font-bold px-6 py-2.5 rounded-xl shadow-glow disabled:opacity-50 inline-flex items-center gap-2">
            التالي <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => { if (!allAnswered && !confirm("لم تجب على جميع الأسئلة. هل تريد الإنهاء؟")) return; onFinish(); }}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-glow">
            إنهاء الاختبار
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center pt-2">
        {exam.questions.map((_: any, i: number) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold ${
              i === current ? "bg-gradient-gold text-brand-purple-deep" :
              answers[i] >= 0 ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
            }`}>{i+1}</button>
        ))}
      </div>
    </div>
  );
}
