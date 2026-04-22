import { useEffect, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Send, Shield, X, ThumbsUp, ThumbsDown, Eye, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Post = {
  id: string;
  title: string;
  target_audience: string | null;
  message: string;
  image_urls: string[];
  created_at: string;
};

type Stat = { likes: number; dislikes: number; views: number; comments: number };
type Comment = { id: string; post_id: string; author_name: string | null; comment: string; created_at: string };

export default function AwarenessTab() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [openComments, setOpenComments] = useState<Record<string, Comment[] | null>>({});
  const [form, setForm] = useState({ title: "", target_audience: "", message: "" });

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("awareness_posts")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data as Post[]) || [];
    setItems(list);
    setLoading(false);

    const ids = list.map(p => p.id);
    if (ids.length === 0) { setStats({}); return; }
    const [r, v, c] = await Promise.all([
      (supabase as any).from("awareness_post_reactions").select("post_id, reaction").in("post_id", ids),
      (supabase as any).from("awareness_post_views").select("post_id, visitor_key").in("post_id", ids),
      (supabase as any).from("awareness_post_comments").select("post_id").in("post_id", ids),
    ]);
    const s: Record<string, Stat> = {};
    for (const id of ids) s[id] = { likes: 0, dislikes: 0, views: 0, comments: 0 };
    for (const x of (r.data || [])) {
      if (x.reaction === "like") s[x.post_id].likes++;
      else if (x.reaction === "dislike") s[x.post_id].dislikes++;
    }
    const seen = new Set<string>();
    for (const x of (v.data || [])) {
      const k = x.post_id + "|" + x.visitor_key;
      if (!seen.has(k)) { seen.add(k); s[x.post_id].views++; }
    }
    for (const x of (c.data || [])) s[x.post_id].comments++;
    setStats(s);
  }

  useEffect(() => { load(); }, []);

  function addImageFiles(files: FileList | null) {
    if (!files) return;
    setImageFiles(prev => [...prev, ...Array.from(files)]);
  }
  function removeImageAt(i: number) {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { toast.error("العنوان والرسالة مطلوبان"); return; }
    setSubmitting(true);
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `awareness/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("activities").upload(path, file, { upsert: false });
      if (upErr) { setSubmitting(false); toast.error("فشل رفع الصورة: " + upErr.message); return; }
      const { data: pub } = supabase.storage.from("activities").getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }
    const { error } = await (supabase as any).from("awareness_posts").insert({
      title: form.title.trim(),
      target_audience: form.target_audience.trim() || null,
      message: form.message.trim(),
      image_urls: uploadedUrls,
    });
    setSubmitting(false);
    if (error) { toast.error("فشل الإرسال: " + error.message); return; }
    toast.success("تم نشر المنشور بنجاح");
    setForm({ title: "", target_audience: "", message: "" });
    setImageFiles([]);
    load();
  }

  async function del(id: string) {
    if (!confirm("حذف المنشور؟")) return;
    await (supabase as any).from("awareness_posts").delete().eq("id", id);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("تم الحذف");
  }

  async function toggleComments(id: string) {
    if (openComments[id]) {
      setOpenComments(prev => ({ ...prev, [id]: null }));
      return;
    }
    const { data } = await (supabase as any)
      .from("awareness_post_comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setOpenComments(prev => ({ ...prev, [id]: (data as Comment[]) || [] }));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold mb-1">
          <Plus className="w-4 h-4" /> إضافة منشور توعوي جديد
        </div>
        <input required placeholder="عنوان المنشور *" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <input placeholder="المستهدفون (اختياري) — مثال: طلاب الكليات الطبية" value={form.target_audience}
          onChange={e => setForm({ ...form, target_audience: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />

        <label className="px-4 py-2.5 rounded-xl border border-border bg-background flex items-center gap-2 cursor-pointer">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-sm truncate">إضافة صور للمنشور (اختياري — يمكن اختيار عدة صور)</span>
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => addImageFiles(e.target.files)} />
        </label>

        {imageFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageFiles.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt={f.name}
                  className="w-20 h-20 object-cover rounded-xl border border-border" />
                <button type="button" onClick={() => removeImageAt(i)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="text-xs text-muted-foreground self-center">عدد الصور: {imageFiles.length}</div>
          </div>
        )}

        <textarea required placeholder="نص الرسالة / المنشور *" value={form.message} rows={5}
          onChange={e => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background resize-none" />

        <button type="submit" disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-glow disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="w-4 h-4" /> {submitting ? "جارٍ النشر..." : "إرسال ونشر"}
        </button>
      </form>

      <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
        <div className="text-sm text-muted-foreground">عدد المنشورات: <span className="font-bold text-foreground">{items.length}</span></div>
      </div>

      {loading ? <div className="text-center py-10 text-muted-foreground">جارٍ التحميل...</div> :
        items.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground">لا توجد منشورات بعد</div> : (
        <div className="space-y-4">
          {items.map(p => {
            const st = stats[p.id] || { likes: 0, dislikes: 0, views: 0, comments: 0 };
            const cmts = openComments[p.id];
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary shrink-0" />{p.title}</h3>
                    <button onClick={() => del(p.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {p.target_audience && <div className="text-xs text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-full">المستهدفون: {p.target_audience}</div>}
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{p.message}</p>
                  {p.image_urls?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {p.image_urls.map((u, i) => <img key={i} src={u} className="w-24 h-24 object-cover rounded-lg border border-border shrink-0" loading="lazy" />)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("ar")}</div>
                </div>
                <div className="px-4 py-3 border-t border-border bg-secondary/30 flex items-center gap-3 flex-wrap text-sm">
                  <span className="flex items-center gap-1 text-green-700 font-bold"><ThumbsUp className="w-4 h-4" /> {st.likes}</span>
                  <span className="flex items-center gap-1 text-red-700 font-bold"><ThumbsDown className="w-4 h-4" /> {st.dislikes}</span>
                  <span className="flex items-center gap-1 text-foreground/70 font-bold"><Eye className="w-4 h-4" /> {st.views} مشاهدة</span>
                  <button onClick={() => toggleComments(p.id)}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20">
                    <MessageCircle className="w-4 h-4" /> التعليقات ({st.comments})
                  </button>
                </div>
                {cmts && (
                  <div className="border-t border-border bg-background p-4 space-y-2">
                    {cmts.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-3">لا توجد تعليقات بعد</div>
                    ) : cmts.map(c => (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-sm text-foreground">{c.author_name || "زائر"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString("ar")}</span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
