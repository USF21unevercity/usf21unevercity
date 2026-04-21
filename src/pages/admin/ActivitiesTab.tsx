import { useEffect, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Send, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COLLEGES, LEVELS } from "@/lib/colleges";

type Activity = {
  id: string;
  college: string;
  level: string | null;
  specialty: string | null;
  activity_type: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export default function ActivitiesTab({ collegeFilter }: { collegeFilter: string | null }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    college: collegeFilter || "",
    level: "",
    specialty: "",
    activity_type: "",
    title: "",
    description: "",
  });

  async function load() {
    setLoading(true);
    let q: any = (supabase as any).from("activities").select("*").order("created_at", { ascending: false });
    if (collegeFilter) q = q.eq("college", collegeFilter);
    const { data } = await q;
    setItems((data as Activity[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [collegeFilter]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.college || !form.title) { toast.error("الكلية وعنوان النشاط مطلوبان"); return; }
    setSubmitting(true);
    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("activities").upload(path, imageFile, { upsert: false });
      if (upErr) { setSubmitting(false); toast.error("فشل رفع الصورة: " + upErr.message); return; }
      const { data: pub } = supabase.storage.from("activities").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
    const { error } = await (supabase as any).from("activities").insert({
      college: form.college,
      level: form.level || null,
      specialty: form.specialty.trim() || null,
      activity_type: form.activity_type.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url,
    });
    setSubmitting(false);
    if (error) { toast.error("فشل الإرسال: " + error.message); return; }
    toast.success("تم إرسال النشاط بنجاح");
    setForm({ college: collegeFilter || "", level: "", specialty: "", activity_type: "", title: "", description: "" });
    setImageFile(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("حذف النشاط؟")) return;
    await (supabase as any).from("activities").delete().eq("id", id);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("تم الحذف");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold mb-1">
          <Plus className="w-4 h-4" /> إضافة إعلان نشاط جديد
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input required placeholder="عنوان النشاط *" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
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
          <input placeholder="نوع النشاط (اختياري)" value={form.activity_type}
            onChange={e => setForm({ ...form, activity_type: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-border bg-background" />
          <label className="px-4 py-2.5 rounded-xl border border-border bg-background flex items-center gap-2 cursor-pointer">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-sm truncate">{imageFile ? imageFile.name : "اختر صورة النشاط (اختياري)"}</span>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => setImageFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <textarea placeholder="وصف النشاط (اختياري)" value={form.description} rows={3}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background resize-none" />
        <button type="submit" disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-glow disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="w-4 h-4" /> {submitting ? "جارٍ الإرسال..." : "إرسال"}
        </button>
      </form>

      <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
        <div className="text-sm text-muted-foreground">عدد الأنشطة: <span className="font-bold text-foreground">{items.length}</span></div>
      </div>

      {loading ? <div className="text-center py-10 text-muted-foreground">جارٍ التحميل...</div> :
       items.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">لا توجد أنشطة بعد</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" loading="lazy" />}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground flex items-center gap-1"><Megaphone className="w-4 h-4 text-primary shrink-0" />{a.title}</h3>
                  <button onClick={() => del(a.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="text-xs text-muted-foreground">{a.college}{a.level && ` · ${a.level}`}{a.activity_type && ` · ${a.activity_type}`}</div>
                {a.description && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.description}</p>}
                <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ar")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
