import { useMemo, useState } from "react";
import { Building2, ChevronDown, ExternalLink, Search } from "lucide-react";
import channelsData from "@/data/channels.json";
import { COLLEGES, normalizeCollege, normalizeLevel, LEVELS } from "@/lib/colleges";

type Channel = { url: string; name: string; officialName: string; university: string; college: string; specialty: string; level: string };

const channels: Channel[] = (channelsData as Channel[]).map(c => ({
  ...c,
  college: normalizeCollege(c.college),
  level: normalizeLevel(c.level),
}));

export default function Colleges() {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const map: Record<string, Channel[]> = {};
    for (const col of COLLEGES) map[col] = [];
    for (const ch of channels) if (map[ch.college]) map[ch.college].push(ch);
    // sort each by level
    const lvlOrder: Record<string, number> = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (lvlOrder[a.level] ?? 99) - (lvlOrder[b.level] ?? 99));
    }
    return map;
  }, []);

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
      </section>
    </div>
  );
}
