import { useEffect, useMemo, useState } from "react";
import { Shield, ThumbsUp, ThumbsDown, Eye, MessageCircle, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Post = {
  id: string;
  title: string;
  message: string;
  target_audience: string | null;
  image_urls: string[];
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  author_name: string | null;
  comment: string;
  created_at: string;
};

const VISIT_KEY = "awareness_last_visit";

function getVisitorKey(): string {
  let k = localStorage.getItem("visitor_key");
  if (!k) {
    k = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + "-" + Date.now();
    localStorage.setItem("visitor_key", k);
  }
  return k;
}

export default function Awareness() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, { likes: number; dislikes: number; views: number; comments: number; my?: "like" | "dislike" | null }>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [galleryIdx, setGalleryIdx] = useState<Record<string, number>>({});
  const visitor = useMemo(() => getVisitorKey(), []);

  useEffect(() => {
    localStorage.setItem(VISIT_KEY, new Date().toISOString());
  }, []);

  async function loadAll() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("awareness_posts")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data as Post[]) || [];
    setPosts(list);
    setLoading(false);

    // Aggregate stats per post
    const ids = list.map(p => p.id);
    if (ids.length === 0) return;
    const [reactionsRes, viewsRes, commentsRes] = await Promise.all([
      (supabase as any).from("awareness_post_reactions").select("post_id, reaction, visitor_key").in("post_id", ids),
      (supabase as any).from("awareness_post_views").select("post_id, visitor_key").in("post_id", ids),
      (supabase as any).from("awareness_post_comments").select("*").in("post_id", ids).order("created_at", { ascending: true }),
    ]);
    const s: typeof stats = {};
    for (const id of ids) s[id] = { likes: 0, dislikes: 0, views: 0, comments: 0, my: null };
    for (const r of (reactionsRes.data || [])) {
      if (r.reaction === "like") s[r.post_id].likes++;
      else if (r.reaction === "dislike") s[r.post_id].dislikes++;
      if (r.visitor_key === visitor) s[r.post_id].my = r.reaction;
    }
    const seenViews = new Set<string>();
    for (const v of (viewsRes.data || [])) {
      const key = v.post_id + "|" + v.visitor_key;
      if (!seenViews.has(key)) { seenViews.add(key); s[v.post_id].views++; }
    }
    const cMap: Record<string, Comment[]> = {};
    for (const c of (commentsRes.data || []) as Comment[]) {
      (cMap[c.post_id] ||= []).push(c);
      s[c.post_id].comments++;
    }
    setStats(s);
    setComments(cMap);

    // Register a unique view for this visitor (idempotent via dedupe attempt)
    for (const id of ids) {
      const already = (viewsRes.data || []).some((v: any) => v.post_id === id && v.visitor_key === visitor);
      if (!already) {
        await (supabase as any).from("awareness_post_views").insert({ post_id: id, visitor_key: visitor });
      }
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function react(postId: string, reaction: "like" | "dislike") {
    const cur = stats[postId]?.my;
    if (cur === reaction) {
      // toggle off → delete via update to opposite (we can't delete due to RLS), so set to opposite then back?
      // Simpler: do nothing if same.
      return;
    }
    // Try update first; if no row, insert
    const { data: existing } = await (supabase as any)
      .from("awareness_post_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("visitor_key", visitor)
      .maybeSingle();
    if (existing?.id) {
      await (supabase as any).from("awareness_post_reactions").update({ reaction }).eq("id", existing.id);
    } else {
      await (supabase as any).from("awareness_post_reactions").insert({ post_id: postId, visitor_key: visitor, reaction });
    }
    setStats(prev => {
      const cp = { ...prev };
      const st = { ...cp[postId] };
      if (cur === "like") st.likes = Math.max(0, st.likes - 1);
      if (cur === "dislike") st.dislikes = Math.max(0, st.dislikes - 1);
      if (reaction === "like") st.likes++;
      else st.dislikes++;
      st.my = reaction;
      cp[postId] = st;
      return cp;
    });
  }

  async function addComment(postId: string, name: string, text: string, reset: () => void) {
    if (!text.trim()) { toast.error("اكتب تعليقك أولاً"); return; }
    const { data, error } = await (supabase as any)
      .from("awareness_post_comments")
      .insert({ post_id: postId, visitor_key: visitor, author_name: name.trim() || null, comment: text.trim() })
      .select()
      .single();
    if (error) { toast.error("فشل إرسال التعليق"); return; }
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data as Comment] }));
    setStats(prev => ({ ...prev, [postId]: { ...prev[postId], comments: (prev[postId]?.comments || 0) + 1 } }));
    toast.success("تم إرسال تعليقك");
    reset();
  }

  function changeGallery(postId: string, dir: -1 | 1, len: number) {
    setGalleryIdx(prev => {
      const cur = prev[postId] || 0;
      const next = (cur + dir + len) % len;
      return { ...prev, [postId]: next };
    });
  }

  return (
    <div>
      <section className="bg-hero text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Shield className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-3xl md:text-5xl font-bold mb-2">الحرب الناعمة أخطر من الحرب العسكرية</h1>
          <p className="text-white/85 max-w-2xl mx-auto">منشورات توعوية من اللجنة العلمية لحماية شبابنا وطلابنا من تأثيرات الحرب الناعمة</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            لا توجد منشورات بعد
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(p => {
              const st = stats[p.id] || { likes: 0, dislikes: 0, views: 0, comments: 0, my: null };
              const idx = galleryIdx[p.id] || 0;
              const imgs = p.image_urls || [];
              return (
                <article key={p.id} className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h2 className="text-xl font-extrabold text-foreground">{p.title}</h2>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("ar")}</span>
                    </div>
                    {p.target_audience && (
                      <div className="inline-block text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
                        المستهدفون: {p.target_audience}
                      </div>
                    )}
                    <p className="text-foreground/90 whitespace-pre-wrap leading-loose">{p.message}</p>
                  </div>

                  {imgs.length > 0 && (
                    <div className="relative bg-black/5">
                      <img src={imgs[idx]} alt={p.title} className="w-full max-h-[480px] object-contain" loading="lazy" />
                      {imgs.length > 1 && (
                        <>
                          <button onClick={() => changeGallery(p.id, -1, imgs.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={() => changeGallery(p.id, 1, imgs.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                            {idx + 1} / {imgs.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-border flex items-center gap-2 flex-wrap">
                    <button onClick={() => react(p.id, "like")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${st.my === "like" ? "bg-green-600 text-white" : "bg-secondary text-foreground hover:bg-green-600/10"}`}>
                      <ThumbsUp className="w-4 h-4" /> إعجاب <span>{st.likes}</span>
                    </button>
                    <button onClick={() => react(p.id, "dislike")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${st.my === "dislike" ? "bg-red-600 text-white" : "bg-secondary text-foreground hover:bg-red-600/10"}`}>
                      <ThumbsDown className="w-4 h-4" /> عدم إعجاب <span>{st.dislikes}</span>
                    </button>
                    <button onClick={() => setOpenComments(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-secondary text-foreground hover:bg-primary/10">
                      <MessageCircle className="w-4 h-4" /> تعليقات <span>{st.comments}</span>
                    </button>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="w-4 h-4" /> {st.views} مشاهدة
                    </span>
                  </div>

                  {openComments[p.id] && (
                    <CommentsSection
                      list={comments[p.id] || []}
                      onSubmit={(name, text, reset) => addComment(p.id, name, text, reset)}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CommentsSection({ list, onSubmit }: { list: Comment[]; onSubmit: (name: string, text: string, reset: () => void) => void }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  return (
    <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {list.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">لا توجد تعليقات بعد. كن أول من يعلق</div>
        ) : list.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-sm text-foreground">{c.author_name || "زائر"}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString("ar")}</span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.comment}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك (اختياري)"
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="اكتب تعليقك..."
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />
        <button onClick={() => onSubmit(name, text, () => { setText(""); })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl inline-flex items-center justify-center gap-2 self-end">
          <Send className="w-4 h-4" /> إرسال التعليق
        </button>
      </div>
    </div>
  );
}
