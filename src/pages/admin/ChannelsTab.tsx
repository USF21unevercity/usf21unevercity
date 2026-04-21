import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Radio, FileSpreadsheet, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COLLEGES, LEVELS } from "@/lib/colleges";
import * as XLSX from "xlsx";

type Channel = {
  id: string;
  channel_name: string;
  channel_url: string;
  college: string;
  level: string | null;
  specialty: string | null;
  subject: string | null;
  created_at: string;
};

export default function ChannelsTab({ collegeFilter }: { collegeFilter: string | null }) {
  const [items, setItems] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ channel_name: "", channel_url: "", college: collegeFilter || "", level: "", specialty: "", subject: "" });
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Channel>>({});

  async function load() {
    setLoading(true);
    let q: any = (supabase as any).from("channels").select("*").order("created_at", { ascending: false });
    if (collegeFilter) q = q.eq("college", collegeFilter);
    const { data } = await q;
    setItems((data as Channel[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [collegeFilter]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channel_name || !form.channel_url || !form.college) { toast.error("اسم القناة والرابط والكلية مطلوبة"); return; }
    setAdding(true);
    const { error } = await (supabase as any).from("channels").insert({
      channel_name: form.channel_name.trim(),
      channel_url: form.channel_url.trim(),
      college: form.college,
      level: form.level || null,
      specialty: form.specialty.trim() || null,
      subject: form.subject.trim() || null,
    });
    setAdding(false);
    if (error) { toast.error("فشل: " + error.message); return; }
    toast.success("تمت إضافة القناة وستظهر في بوابة الكليات");
    setForm({ channel_name: "", channel_url: "", college: collegeFilter || "", level: "", specialty: "", subject: "" });
    load();
  }

  async function del(id: string) {
    if (!confirm("حذف القناة؟")) return;
    await (supabase as any).from("channels").delete().eq("id", id);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("تم الحذف");
  }

  function startEdit(c: Channel) {
    setEditingId(c.id);
    setEditForm({ channel_name: c.channel_name, channel_url: c.channel_url, college: c.college, level: c.level, specialty: c.specialty, subject: c.subject });
  }
  async function saveEdit(id: string) {
    if (!editForm.channel_name || !editForm.channel_url || !editForm.college) { toast.error("الاسم والرابط والكلية مطلوبة"); return; }
    const { error } = await (supabase as any).from("channels").update({
      channel_name: (editForm.channel_name as string).trim(),
      channel_url: (editForm.channel_url as string).trim(),
      college: editForm.college,
      level: editForm.level || null,
      specialty: ((editForm.specialty as string) || "").trim() || null,
      subject: ((editForm.subject as string) || "").trim() || null,
    }).eq("id", id);
    if (error) { toast.error("فشل التعديل: " + error.message); return; }
    toast.success("تم حفظ التعديلات");
    setEditingId(null); setEditForm({});
    load();
  }

  async function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
      const records = rows.map(r => {
        const get = (keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(r).find(kk => kk.trim() === k);
            if (found && r[found]) return String(r[found]).trim();
          }
          return "";
        };
        return {
          channel_name: get(["اسم القناة","channel_name","name"]),
          channel_url: get(["الرابط","channel_url","url"]),
          college: get(["الكلية","college"]),
          level: get(["المستوى","level"]) || null,
          specialty: get(["التخصص","specialty"]) || null,
          subject: get(["المادة","subject"]) || null,
        };
      }).filter(r => r.channel_name && r.channel_url && r.college);

      if (records.length === 0) { toast.error("لم يتم العثور على بيانات صالحة. تأكد من رؤوس الأعمدة: اسم القناة، الرابط، الكلية"); return; }
      if (collegeFilter) {
        for (const r of records) if (r.college !== collegeFilter) r.college = collegeFilter;
      }
      const { error } = await (supabase as any).from("channels").insert(records);
      if (error) { toast.error("فشل الاستيراد: " + error.message); return; }
      toast.success(`تم استيراد ${records.length} قناة`);
      load();
    } catch (err: any) {
      toast.error("فشل قراءة الملف: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold mb-1">
          <Plus className="w-4 h-4" /> إضافة قناة جديدة
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input required placeholder="اسم القناة *" value={form.channel_name}
            onChange={e => setForm({ ...form, channel_name: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background" />
          <input required placeholder="رابط القناة *" dir="ltr" value={form.channel_url}
            onChange={e => setForm({ ...form, channel_url: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background" />
          <select required value={form.college} disabled={!!collegeFilter}
            onChange={e => setForm({ ...form, college: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background">
            <option value="">اختر الكلية *</option>
            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background">
            <option value="">المستوى (اختياري)</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input placeholder="التخصص (اختياري)" value={form.specialty}
            onChange={e => setForm({ ...form, specialty: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background" />
          <input placeholder="المادة (اختياري)" value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={adding}
            className="bg-gradient-purple text-white font-bold px-6 py-2.5 rounded-xl shadow-glow disabled:opacity-50">
            {adding ? "جارٍ الإضافة..." : "إضافة"}
          </button>
          <label className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2.5 rounded-xl shadow-gold inline-flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> {importing ? "جارٍ الاستيراد..." : "استيراد من Excel"}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={onExcel} className="hidden" />
          </label>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> الأعمدة: اسم القناة، الرابط، الكلية، المستوى، التخصص، المادة
          </span>
        </div>
      </form>

      <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
        <div className="text-sm text-muted-foreground">عدد القنوات المضافة: <span className="font-bold text-foreground">{items.length}</span></div>
      </div>

      {loading ? <div className="text-center py-10 text-muted-foreground">جارٍ التحميل...</div> :
       items.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">لا توجد قنوات مضافة بعد</div> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="p-3 text-right">اسم القناة</th>
              <th className="p-3 text-right">الكلية</th>
              <th className="p-3 text-right">المستوى</th>
              <th className="p-3 text-right">التخصص</th>
              <th className="p-3 text-right">المادة</th>
              <th className="p-3 text-right">الرابط</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>{items.map(c => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-bold flex items-center gap-2"><Radio className="w-3 h-3 text-primary" />{c.channel_name}</td>
                <td className="p-3">{c.college}</td>
                <td className="p-3">{c.level || "-"}</td>
                <td className="p-3">{c.specialty || "-"}</td>
                <td className="p-3">{c.subject || "-"}</td>
                <td className="p-3"><a href={c.channel_url} target="_blank" rel="noopener noreferrer" className="text-primary underline" dir="ltr">فتح</a></td>
                <td className="p-3">
                  <button onClick={() => del(c.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
