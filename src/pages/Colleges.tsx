import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, ExternalLink, Search, Plus, X, AlertTriangle } from "lucide-react";
import channelsData from "@/data/channels.json";
import { COLLEGES, normalizeCollege, normalizeLevel, LEVELS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Channel = { url: string; name: string; officialName: string; university: string; college: string; specialty: string; level: string };

const baseChannels: Channel[] = (channelsData as Channel[]).map(c => ({
  ...c,
  college: normalizeCollege(c.college),
  level: normalizeLevel(c.level),
}));

export default function Colleges() {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [suggestType, setSuggestType] = useState<"new" | "wrong" | null>(null);
  const [dbChannels, setDbChannels] = useState<Channel[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("channels").select("*");
      const mapped: Channel[] = (data || []).map((c: any) => ({
        url: c.channel_url,
        name: c.channel_name,
        officialName: c.channel_name,
        university: "",
        college: c.college,
        specialty: c.specialty || c.subject || "",
        level: c.level || "",
      }));
      setDbChannels(mapped);
    })();
  }, []);

  const channels = useMemo(() => [...baseChannels, ...dbChannels], [dbChannels]);

  const grouped = useMemo(() => {
    const map: Record<string, Channel[]> = {};
    for (const col of COLLEGES) map[col] = [];
    for (const ch of channels) if (map[ch.college]) map[ch.college].push(ch);
    const lvlOrder: Record<string, number> = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (lvlOrder[a.level] ?? 99) - (lvlOrder[b.level] ?? 99));
    }
    return map;
  }, [channels]);

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Building2 className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">بوابة الكليات</h1>
          <p className="text-white/85">اختر الكلية للوصول إلى القنوات العلمية</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto mb-8 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن قناة..."
            className="w-full pr-12 pl-4 py-3 rounded-2xl border border-border bg-card shadow-soft" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLLEGES.map(col => {
            const list = grouped[col].filter(c =>
              !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.officialName.toLowerCase().includes(q.toLowerCase())
            );
            const isOpen = open === col;
            return (
              <div key={col} className="bg-gradient-purple text-white rounded-3xl shadow-glow overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : col)}
                  className="w-full flex items-center justify-between gap-3 p-5 hover:bg-white/5 transition-colors">
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  <div className="flex-1 text-right">
                    <span className="bg-white/15 text-brand-gold-light text-xs px-2 py-1 rounded-full mr-2">{grouped[col].length} قناة</span>
                    <h3 className="font-bold text-base inline">{col}</h3>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-gold/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-brand-gold" />
                  </div>
                </button>
                {isOpen && (
                  <div className="bg-brand-purple-deep/40 p-3 space-y-2 max-h-96 overflow-y-auto">
                    {list.length === 0 ? (
                      <div className="text-center text-white/60 py-6 text-sm">لا توجد قنوات</div>
                    ) : list.map((ch, i) => (
                      <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-white/5 hover:bg-brand-gold/20 border border-white/10 hover:border-brand-gold/40 rounded-xl p-3 transition-all group">
                        <ExternalLink className="w-4 h-4 text-brand-gold shrink-0" />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="font-semibold text-sm truncate">{ch.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {ch.specialty && <span>{ch.specialty} · </span>}
                            <span className="text-brand-gold">{ch.level}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">ساهم في تطوير القنوات</h2>
            <p className="text-muted-foreground text-sm">إذا وجدت قناة مفقودة أو في غير مكانها الصحيح، أبلغنا ليتم تحديثها</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <button onClick={() => setSuggestType("new")}
              className="bg-card border border-border rounded-2xl p-5 text-right hover:shadow-glow transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6 text-brand-purple-deep" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">إضافة قناة جديدة</h3>
                <p className="text-xs text-muted-foreground mt-1">إذا وجدت قناة علمية مفقودة</p>
              </div>
            </button>
            <button onClick={() => setSuggestType("wrong")}
              className="bg-card border border-border rounded-2xl p-5 text-right hover:shadow-glow transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">قناة في غير مكانها</h3>
                <p className="text-xs text-muted-foreground mt-1">إذا وجدت قناة في كلية غير صحيحة</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {suggestType && <SuggestModal type={suggestType} onClose={() => setSuggestType(null)} />}
    </div>
  );
}

function SuggestModal({ type, onClose }: { type: "new" | "wrong"; onClose: () => void }) {
  const [form, setForm] = useState({ channel_name: "", channel_url: "", college: "", level: "", specialty: "", suggester_name: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.channel_name || !form.channel_url || !form.college) {
      toast.error("يرجى تعبئة الحقول المطلوبة"); return;
    }
    setBusy(true);
    const { error } = await supabase.from("channel_suggestions").insert({
      suggestion_type: type,
      channel_name: form.channel_name,
      channel_url: form.channel_url,
      college: form.college,
      level: form.level || null,
      specialty: form.specialty || null,
      suggester_name: form.suggester_name || null,
      notes: form.notes || null,
    });
    setBusy(false);
    if (error) { toast.error("تعذر إرسال الاقتراح"); return; }
    toast.success("تم إرسال الاقتراح، شكراً لمساهمتك");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-glow space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{type === "new" ? "إضافة قناة جديدة" : "الإبلاغ عن قناة في غير مكانها"}</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <input required placeholder="اسم القناة *" value={form.channel_name} onChange={e => setForm({ ...form, channel_name: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <input required placeholder="رابط القناة *" value={form.channel_url} onChange={e => setForm({ ...form, channel_url: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" dir="ltr" />
        <select required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background">
          <option value="">اختر الكلية *</option>
          {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background">
          <option value="">المستوى (اختياري)</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input placeholder="التخصص (اختياري)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <input placeholder="اسمك (اختياري)" value={form.suggester_name} onChange={e => setForm({ ...form, suggester_name: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />
        <textarea rows={2} placeholder="ملاحظات إضافية" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background resize-none" />
        <button type="submit" disabled={busy}
          className="w-full bg-gradient-gold text-brand-purple-deep font-bold py-3 rounded-xl shadow-gold disabled:opacity-50">
          {busy ? "جارٍ الإرسال..." : "إرسال الاقتراح"}
        </button>
      </form>
    </div>
  );
}
