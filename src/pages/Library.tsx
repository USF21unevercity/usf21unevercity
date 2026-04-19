import { useEffect, useMemo, useState } from "react";
import { BookOpen, Upload, Search, FileText, Download, Trash2, X } from "lucide-react";
import { COLLEGES, LEVELS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LibFile = {
  id: string; title: string; description: string | null; college: string; level: string;
  file_type: string | null; file_url: string; file_path: string | null; uploader_name: string | null;
  downloads: number; created_at: string;
};

export default function Library() {
  const [files, setFiles] = useState<LibFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState("");
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("library_files").select("*").order("created_at", { ascending: false });
    setFiles((data as LibFile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        setIsAdmin(!!data);
      }
    })();
  }, []);

  const filtered = useMemo(() => files.filter(f =>
    (!college || f.college === college) && (!level || f.level === level) &&
    (!q || f.title.toLowerCase().includes(q.toLowerCase()) || (f.description || "").toLowerCase().includes(q.toLowerCase()))
  ), [files, college, level, q]);

  const remove = async (f: LibFile) => {
    if (!confirm(`حذف "${f.title}"؟`)) return;
    if (f.file_path) await supabase.storage.from("library").remove([f.file_path]);
    await supabase.from("library_files").delete().eq("id", f.id);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <BookOpen className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">المكتبة الرقمية</h1>
          <p className="text-white/85">شارك المحتوى العلمي مع زملائك الطلاب</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">المحتوى العلمي المتاح</h2>
              <p className="text-sm text-muted-foreground">{files.length} ملف متاح</p>
            </div>
            <button onClick={() => setShowUpload(true)}
              className="bg-gradient-gold text-brand-purple-deep font-bold px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 hover:opacity-90">
              <Upload className="w-4 h-4" /> رفع محتوى جديد
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-border bg-background" />
            </div>
            <select value={college} onChange={e => setCollege(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background">
              <option value="">جميع الكليات</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={level} onChange={e => setLevel(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background">
              <option value="">جميع المستويات</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <FileText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-1">لا توجد ملفات</h3>
            <p className="text-muted-foreground">كن أول من يرفع محتوى علمي</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(f => (
              <div key={f.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-glow transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{f.title}</h3>
                    <div className="text-xs text-muted-foreground mt-1">{f.college} · <span className="text-primary font-bold">{f.level}</span></div>
                  </div>
                </div>
                {f.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{f.description}</p>}
                {f.uploader_name && <div className="text-xs text-muted-foreground mb-3">رفعه: {f.uploader_name}</div>}
                <div className="flex gap-2">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-gradient-gold text-brand-purple-deep font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:opacity-90">
                    <Download className="w-4 h-4" /> تنزيل
                  </a>
                  {isAdmin && (
                    <button onClick={() => remove(f)} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={load} />}
    </div>
  );
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", college: "", level: "", uploader_name: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.college || !form.level || !file) {
      toast.error("يرجى تعبئة الحقول واختيار ملف"); return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("library").upload(path, file);
    if (upErr) { toast.error("فشل رفع الملف"); setBusy(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("library").getPublicUrl(path);
    const { error } = await supabase.from("library_files").insert({
      title: form.title, description: form.description || null,
      college: form.college, level: form.level,
      file_type: ext.toUpperCase(), file_url: publicUrl, file_path: path,
      uploader_name: form.uploader_name || null,
    });
    setBusy(false);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم رفع الملف بنجاح");
    onDone(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-glow space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">رفع محتوى جديد</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <input required placeholder="عنوان الملف *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <textarea rows={2} placeholder="وصف الملف" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background resize-none" />
        <select required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background">
          <option value="">اختر الكلية *</option>
          {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select required value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background">
          <option value="">اختر المستوى *</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input placeholder="اسم الرافع (اختياري)" value={form.uploader_name} onChange={e => setForm({ ...form, uploader_name: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <input required type="file" onChange={e => setFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <button type="submit" disabled={busy}
          className="w-full bg-gradient-gold text-brand-purple-deep font-bold py-3 rounded-xl shadow-gold disabled:opacity-50">
          {busy ? "جارٍ الرفع..." : "رفع الملف"}
        </button>
      </form>
    </div>
  );
}
