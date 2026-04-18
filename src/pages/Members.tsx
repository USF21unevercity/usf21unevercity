import { useEffect, useMemo, useState } from "react";
import { Users, Search, Phone, GraduationCap, Briefcase, User as UserIcon } from "lucide-react";
import { COLLEGES, LEVELS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  id: string;
  full_name: string;
  college: string;
  level: string;
  specialty: string | null;
  gender: "male" | "female";
  phone: string | null;
  committee_role: string | null;
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [college, setCollege] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("members")
        .select("id, full_name, college, level, specialty, gender, phone, committee_role")
        .order("created_at", { ascending: false });
      setMembers((data as Member[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (college && m.college !== college) return false;
      if (level && m.level !== level) return false;
      if (q) {
        const s = q.trim().toLowerCase();
        if (!(
          m.full_name.toLowerCase().includes(s) ||
          (m.specialty || "").toLowerCase().includes(s) ||
          (m.committee_role || "").toLowerCase().includes(s)
        )) return false;
      }
      return true;
    });
  }, [members, q, college, level]);

  const stats = {
    total: members.length,
    colleges: new Set(members.map(m => m.college)).size,
    males: members.filter(m => m.gender === "male").length,
    females: members.filter(m => m.gender === "female").length,
  };

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Users className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">أعضاء اللجنة العلمية</h1>
          <p className="text-white/85">تعرف على أعضاء فريق العمل</p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الأعضاء", val: stats.total },
            { label: "عدد الكليات", val: stats.colleges },
            { label: "أعضاء ذكور", val: stats.males },
            { label: "أعضاء إناث", val: stats.females },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center shadow-soft">
              <div className="text-3xl font-extrabold text-primary">{s.val}</div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft mb-6 grid md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو التخصص..."
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

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-1">لا يوجد أعضاء</h3>
            <p className="text-muted-foreground">لا يوجد أعضاء مطابقين للبحث</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-glow transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${m.gender === "male" ? "bg-gradient-purple" : "bg-gradient-soft"}`}>
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{m.full_name}</h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${m.gender === "male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                      {m.gender === "male" ? "ذكر" : "أنثى"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary shrink-0" /><span className="truncate">{m.college}</span></div>
                  <div className="flex items-center gap-2"><span className="font-bold text-primary">{m.level}</span>{m.specialty && <span>· {m.specialty}</span>}</div>
                  {m.committee_role && (
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-accent shrink-0" /><span className="truncate">{m.committee_role}</span></div>
                  )}
                  {m.gender === "male" && m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-primary font-semibold mt-2 hover:underline">
                      <Phone className="w-4 h-4" /> {m.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
