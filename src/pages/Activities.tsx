import { useEffect, useMemo, useState } from "react";
import { Megaphone, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COLLEGES } from "@/lib/colleges";

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

export default function Activities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("activities").select("*").order("created_at", { ascending: false });
      setItems((data as Activity[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => items.filter(a => {
    if (college && a.college !== college) return false;
    if (q) {
      const s = q.trim().toLowerCase();
      if (!(
        a.title.toLowerCase().includes(s) ||
        (a.description || "").toLowerCase().includes(s) ||
        (a.activity_type || "").toLowerCase().includes(s)
      )) return false;
    }
    return true;
  }), [items, college, q]);

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Megaphone className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">إعلانات أنشطة اللجنة العلمية</h1>
          <p className="text-white/85">تابع آخر أنشطة وفعاليات اللجنة العلمية في كل الكليات</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft mb-6 grid md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث في الأنشطة..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-border bg-background" />
          </div>
          <select value={college} onChange={e => setCollege(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background">
            <option value="">جميع الكليات</option>
            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Megaphone className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-1">لا توجد أنشطة</h3>
            <p className="text-muted-foreground">لم يتم نشر أي أنشطة لهذه الكلية بعد</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all">
                {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover" loading="lazy" />}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-foreground text-lg flex items-start gap-2">
                    <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {a.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{a.college}</span>
                    {a.level && <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{a.level}</span>}
                    {a.activity_type && <span className="bg-brand-gold/20 text-brand-purple-deep px-2 py-0.5 rounded-full">{a.activity_type}</span>}
                  </div>
                  {a.description && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.description}</p>}
                  <div className="text-xs text-muted-foreground pt-1">{new Date(a.created_at).toLocaleString("ar")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
