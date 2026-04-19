import { useEffect, useMemo, useState } from "react";
import { Lock, LogOut, Trash2, Download, Search, Phone, Users, Mail, Award, Radio, BookOpen, Shield, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { COLLEGES, LEVELS } from "@/lib/colleges";

const ADMIN_EMAIL = "Wjhb29ytsbvk.wo@gmail.com";

type Member = {
  id: string;
  full_name: string;
  college: string;
  level: string;
  specialty: string | null;
  gender: "male" | "female";
  phone: string | null;
  committee_role: string | null;
  notes: string | null;
  join_year: string | null;
  created_at: string;
};

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collegeAdmin, setCollegeAdmin] = useState<{ college: string; level: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const refresh = async (s: Session | null) => {
      setSession(s);
      if (s?.user) {
        const [{ data: roleData }, { data: caData }] = await Promise.all([
          supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" }),
          (supabase as any).from("college_admins").select("college, level").eq("user_id", s.user.id).maybeSingle(),
        ]);
        setIsAdmin(!!roleData);
        setCollegeAdmin(caData ? { college: caData.college, level: caData.level } : null);
      } else {
        setIsAdmin(false);
        setCollegeAdmin(null);
      }
      setChecking(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => refresh(s), 0);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) setChecking(false); else refresh(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (checking) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">جارٍ التحقق...</div>;
  if (!session) return <LoginForm />;
  if (!isAdmin && !collegeAdmin) return <NotAuthorized />;
  return <Dashboard isOwner={isAdmin} collegeFilter={!isAdmin && collegeAdmin ? collegeAdmin.college : null} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    let { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error && /invalid login credentials/i.test(error.message)) {
      const emailLc = email.trim().toLowerCase();
      const isOwnerEmail = emailLc === ADMIN_EMAIL.toLowerCase();
      const { data: invite } = await (supabase as any)
        .from("college_admin_invites").select("id").ilike("email", emailLc).maybeSingle();
      if (!invite && !isOwnerEmail) {
        setLoading(false);
        toast.error("هذا البريد غير مصرح له بالدخول");
        return;
      }
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (signUpErr) { setLoading(false); toast.error(signUpErr.message); return; }
      // Try to login again immediately (auto-confirm may be enabled or not)
      const r = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      error = r.error;
    }
    setLoading(false);
    if (error) { toast.error("فشل الدخول: " + error.message); return; }
    toast.success("مرحباً بك في لوحة المشرفين");
  }

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Lock className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">بوابة المشرفين</h1>
          <p className="text-white/85">دخول مخصص لإدارة اللجنة العلمية</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-md">
        <form onSubmit={onSubmit} className="bg-card rounded-3xl border border-border shadow-card-elev p-8 space-y-4">
          <div>
            <label className="block font-bold text-sm mb-2">البريد الإلكتروني</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background" placeholder="example@gmail.com" dir="ltr" />
          </div>
          <div>
            <label className="block font-bold text-sm mb-2">كلمة المرور</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background" placeholder="••••••••" dir="ltr" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-purple text-white font-bold py-3 rounded-xl shadow-glow disabled:opacity-50">
            {loading ? "جارٍ الدخول..." : "دخول المشرف"}
          </button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            الوصول مسموح فقط للإيميل المعتمد للمشرف
          </p>
        </form>
      </section>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <div className="bg-card border border-destructive/30 rounded-3xl p-10 shadow-soft">
        <Lock className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">غير مصرح بالدخول</h2>
        <p className="text-muted-foreground mb-4">
          حسابك ليس لديه صلاحيات المشرف. سيتم تفعيل صلاحياتك تلقائياً عند تسجيل الدخول الأول بالإيميل المعتمد.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="bg-secondary text-secondary-foreground px-6 py-2 rounded-xl font-bold">
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

type Counts = { messages: number; certs: number; suggestions: number; library: number };

function Dashboard({ isOwner, collegeFilter }: { isOwner: boolean; collegeFilter: string | null }) {
  type TabId = "members" | "messages" | "certs" | "suggestions" | "library" | "admins";
  const [tab, setTab] = useState<TabId>("members");
  const [counts, setCounts] = useState<Counts>({ messages: 0, certs: 0, suggestions: 0, library: 0 });

  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      const [m, c, s, l] = await Promise.all([
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("certificate_requests").select("id", { count: "exact", head: true }),
        supabase.from("channel_suggestions").select("id", { count: "exact", head: true }),
        supabase.from("library_files").select("id", { count: "exact", head: true }),
      ]);
      setCounts({ messages: m.count || 0, certs: c.count || 0, suggestions: s.count || 0, library: l.count || 0 });
    })();
  }, [tab, isOwner]);

  const allTabs = [
    { id: "members" as const, label: "الأعضاء", icon: Users, count: null, owner: false },
    { id: "messages" as const, label: "الرسائل", icon: Mail, count: counts.messages, owner: true },
    { id: "certs" as const, label: "طلبات الشهادات", icon: Award, count: counts.certs, owner: true },
    { id: "suggestions" as const, label: "اقتراحات قنوات", icon: Radio, count: counts.suggestions, owner: true },
    { id: "library" as const, label: "المكتبة", icon: BookOpen, count: counts.library, owner: true },
    { id: "admins" as const, label: "مشرفو الكليات", icon: Shield, count: null, owner: true },
  ];
  const tabs = allTabs.filter(t => isOwner || !t.owner);

  return (
    <div>
      <section className="bg-hero text-white py-8 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 flex items-center justify-between gap-3 flex-wrap relative">
          <div className="flex items-center gap-3">
            <Lock className="w-9 h-9 text-brand-gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{isOwner ? "لوحة مالك الموقع" : `لوحة مشرف كلية: ${collegeFilter}`}</h1>
              <p className="text-white/80 text-sm">{isOwner ? "إدارة جميع بيانات الموقع" : "تظهر لك بيانات كليتك فقط"}</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-2xl p-2 mb-4 shadow-soft flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id ? "bg-gradient-purple text-white shadow-glow" : "text-foreground hover:bg-secondary"
              }`}>
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.id ? "bg-brand-gold text-brand-purple-deep" : "bg-primary/10 text-primary"}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "members" && <MembersTab isOwner={isOwner} collegeFilter={collegeFilter} />}
        {tab === "messages" && isOwner && <MessagesTab />}
        {tab === "certs" && isOwner && <CertsTab />}
        {tab === "suggestions" && isOwner && <SuggestionsTab />}
        {tab === "library" && isOwner && <LibraryTab />}
        {tab === "admins" && isOwner && <CollegeAdminsTab />}
      </section>
    </div>
  );
}
  const [counts, setCounts] = useState<Counts>({ messages: 0, certs: 0, suggestions: 0, library: 0 });

  useEffect(() => {
    (async () => {
      const [m, c, s, l] = await Promise.all([
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("certificate_requests").select("id", { count: "exact", head: true }),
        supabase.from("channel_suggestions").select("id", { count: "exact", head: true }),
        supabase.from("library_files").select("id", { count: "exact", head: true }),
      ]);
      setCounts({ messages: m.count || 0, certs: c.count || 0, suggestions: s.count || 0, library: l.count || 0 });
    })();
  }, [tab]);

  const tabs = [
    { id: "members", label: "الأعضاء", icon: Users, count: null },
    { id: "messages", label: "الرسائل", icon: Mail, count: counts.messages },
    { id: "certs", label: "طلبات الشهادات", icon: Award, count: counts.certs },
    { id: "suggestions", label: "اقتراحات قنوات", icon: Radio, count: counts.suggestions },
    { id: "library", label: "المكتبة", icon: BookOpen, count: counts.library },
  ] as const;

  return (
    <div>
      <section className="bg-hero text-white py-8 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 flex items-center justify-between gap-3 flex-wrap relative">
          <div className="flex items-center gap-3">
            <Lock className="w-9 h-9 text-brand-gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">لوحة المشرفين</h1>
              <p className="text-white/80 text-sm">إدارة جميع بيانات الموقع</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-2xl p-2 mb-4 shadow-soft flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id ? "bg-gradient-purple text-white shadow-glow" : "text-foreground hover:bg-secondary"
              }`}>
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.id ? "bg-brand-gold text-brand-purple-deep" : "bg-primary/10 text-primary"}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "members" && <MembersTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "certs" && <CertsTab />}
        {tab === "suggestions" && <SuggestionsTab />}
        {tab === "library" && <LibraryTab />}
      </section>
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setMembers((data as Member[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    members.filter(m => !q || m.full_name.toLowerCase().includes(q.toLowerCase()) || m.college.includes(q))
  , [members, q]);

  async function onDelete(id: string, name: string) {
    if (!confirm(`هل تريد حذف العضو "${name}"؟`)) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast.error("فشل الحذف"); return; }
    toast.success("تم حذف العضو");
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  function exportExcel() {
    if (members.length === 0) { toast.error("لا توجد بيانات"); return; }
    const headers = ["الاسم","الكلية","المستوى","التخصص","الجنس","رقم الهاتف","العمل في اللجنة","عام الانضمام","الملاحظات","تاريخ التسجيل"];
    const rows = members.map(m => [
      m.full_name, m.college, m.level, m.specialty || "",
      m.gender === "male" ? "ذكر" : "أنثى",
      m.phone || "", m.committee_role || "", m.join_year || "",
      m.notes || "", new Date(m.created_at).toLocaleString("ar"),
    ]);
    downloadCsv("أعضاء_اللجنة", headers, rows);
  }

  return (
    <div>
      <div className="bg-card border border-border rounded-2xl p-3 mb-4 shadow-soft flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الكلية..."
            className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-border bg-background" />
        </div>
        <button onClick={exportExcel} className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2.5 rounded-xl shadow-gold flex items-center gap-2">
          <Download className="w-4 h-4" /> تصدير Excel ({members.length})
        </button>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty text="لا يوجد أعضاء" /> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الكلية</th>
                <th className="p-3 text-right">المستوى</th>
                <th className="p-3 text-right">التخصص</th>
                <th className="p-3 text-right">الجنس</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">العمل</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3 font-bold">{m.full_name}</td>
                  <td className="p-3">{m.college}</td>
                  <td className="p-3">{m.level}</td>
                  <td className="p-3">{m.specialty || "-"}</td>
                  <td className="p-3">{m.gender === "male" ? "ذكر" : "أنثى"}</td>
                  <td className="p-3">{m.phone ? <a href={`tel:${m.phone}`} className="text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</a> : "-"}</td>
                  <td className="p-3">{m.committee_role || "-"}</td>
                  <td className="p-3"><DeleteBtn onClick={() => onDelete(m.id, m.full_name)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => { if (!confirm("حذف الرسالة؟")) return; await supabase.from("contact_messages").delete().eq("id", id); toast.success("تم الحذف"); setItems(p => p.filter(x => x.id !== id)); };
  const exp = () => downloadCsv("الرسائل", ["الاسم","الكلية","المستوى","التخصص","الهاتف","الرسالة","التاريخ"], items.map(i => [i.full_name, i.college, i.level, i.specialty||"", i.phone||"", i.message, new Date(i.created_at).toLocaleString("ar")]));
  return (
    <div>
      <ExportBar count={items.length} onExport={exp} />
      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد رسائل" /> : (
        <div className="space-y-3">
          {items.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-foreground">{m.full_name}</h3>
                  <div className="text-xs text-muted-foreground">{m.college} · {m.level} {m.specialty && `· ${m.specialty}`}</div>
                </div>
                <DeleteBtn onClick={() => del(m.id)} />
              </div>
              <p className="text-sm text-foreground bg-secondary/50 rounded-xl p-3 my-2 whitespace-pre-wrap">{m.message}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {m.phone ? <a href={`tel:${m.phone}`} className="text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</a> : <span />}
                <span>{new Date(m.created_at).toLocaleString("ar")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CertsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const { data } = await supabase.from("certificate_requests").select("*").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => { if (!confirm("حذف الطلب؟")) return; await supabase.from("certificate_requests").delete().eq("id", id); toast.success("تم الحذف"); setItems(p => p.filter(x => x.id !== id)); };
  const exp = () => downloadCsv("طلبات_الشهادات", ["الاسم","الكلية","المستوى","التخصص","البريد","الهاتف","نوع الشهادة","السبب","التاريخ"], items.map(i => [i.full_name, i.college, i.level, i.specialty||"", i.email, i.phone||"", i.certificate_type, i.reason, new Date(i.created_at).toLocaleString("ar")]));
  return (
    <div>
      <ExportBar count={items.length} onExport={exp} />
      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد طلبات شهادات" /> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الكلية</th><th className="p-3 text-right">المستوى</th>
              <th className="p-3 text-right">البريد</th><th className="p-3 text-right">نوع الشهادة</th><th className="p-3 text-right">السبب</th><th className="p-3"></th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-bold">{i.full_name}</td><td className="p-3">{i.college}</td><td className="p-3">{i.level}</td>
                <td className="p-3" dir="ltr">{i.email}</td><td className="p-3">{i.certificate_type}</td>
                <td className="p-3 max-w-xs truncate" title={i.reason}>{i.reason}</td>
                <td className="p-3"><DeleteBtn onClick={() => del(i.id)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SuggestionsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const { data } = await supabase.from("channel_suggestions").select("*").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const del = async (id: string) => { if (!confirm("حذف الاقتراح؟")) return; await supabase.from("channel_suggestions").delete().eq("id", id); toast.success("تم الحذف"); setItems(p => p.filter(x => x.id !== id)); };
  const exp = () => downloadCsv("اقتراحات_القنوات", ["النوع","اسم القناة","الرابط","الكلية","المستوى","التخصص","المقترح","ملاحظات","التاريخ"], items.map(i => [i.suggestion_type === "new" ? "إضافة" : "تصحيح", i.channel_name, i.channel_url, i.college, i.level||"", i.specialty||"", i.suggester_name||"", i.notes||"", new Date(i.created_at).toLocaleString("ar")]));
  return (
    <div>
      <ExportBar count={items.length} onExport={exp} />
      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد اقتراحات" /> : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${i.suggestion_type === "new" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {i.suggestion_type === "new" ? "إضافة قناة" : "تصحيح مكان"}
                    </span>
                    <h3 className="font-bold text-foreground truncate">{i.channel_name}</h3>
                  </div>
                  <a href={i.channel_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary break-all hover:underline" dir="ltr">{i.channel_url}</a>
                  <div className="text-xs text-muted-foreground mt-1">{i.college} {i.level && `· ${i.level}`} {i.specialty && `· ${i.specialty}`}</div>
                  {i.suggester_name && <div className="text-xs text-muted-foreground mt-1">المقترح: {i.suggester_name}</div>}
                  {i.notes && <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-2 mt-2">{i.notes}</p>}
                </div>
                <DeleteBtn onClick={() => del(i.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const { data } = await supabase.from("library_files").select("*").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);
  const del = async (i: any) => {
    if (!confirm(`حذف "${i.title}"؟`)) return;
    if (i.file_path) await supabase.storage.from("library").remove([i.file_path]);
    await supabase.from("library_files").delete().eq("id", i.id);
    toast.success("تم الحذف"); setItems(p => p.filter(x => x.id !== i.id));
  };
  const exp = () => downloadCsv("ملفات_المكتبة", ["العنوان","الوصف","الكلية","المستوى","النوع","الرابط","الرافع","التاريخ"], items.map(i => [i.title, i.description||"", i.college, i.level, i.file_type||"", i.file_url, i.uploader_name||"", new Date(i.created_at).toLocaleString("ar")]));
  return (
    <div>
      <ExportBar count={items.length} onExport={exp} />
      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد ملفات في المكتبة" /> : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="p-3 text-right">العنوان</th><th className="p-3 text-right">الكلية</th><th className="p-3 text-right">المستوى</th>
              <th className="p-3 text-right">الرافع</th><th className="p-3 text-right">رابط</th><th className="p-3"></th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-bold">{i.title}</td><td className="p-3">{i.college}</td><td className="p-3">{i.level}</td>
                <td className="p-3">{i.uploader_name || "-"}</td>
                <td className="p-3"><a href={i.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">فتح</a></td>
                <td className="p-3"><DeleteBtn onClick={() => del(i)} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ExportBar({ count, onExport }: { count: number; onExport: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-4 shadow-soft flex items-center justify-between flex-wrap gap-2">
      <div className="text-sm text-muted-foreground">الإجمالي: <span className="font-bold text-foreground">{count}</span></div>
      <button onClick={onExport} disabled={count === 0}
        className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2 rounded-xl shadow-gold flex items-center gap-2 disabled:opacity-50">
        <Download className="w-4 h-4" /> تصدير Excel
      </button>
    </div>
  );
}
function DeleteBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg" title="حذف"><Trash2 className="w-4 h-4" /></button>;
}
function Loading() { return <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>; }
function Empty({ text }: { text: string }) {
  return <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">{text}</div>;
}
function downloadCsv(name: string, headers: string[], rows: any[][]) {
  if (rows.length === 0) { toast.error("لا توجد بيانات"); return; }
  const csv = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("تم تنزيل الملف");
}
