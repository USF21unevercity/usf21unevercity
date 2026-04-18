import { useEffect, useMemo, useState } from "react";
import { Lock, LogOut, Trash2, Download, Search, Phone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

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
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" });
          setIsAdmin(!!data);
          setChecking(false);
        }, 0);
      } else {
        setIsAdmin(false);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (checking) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">جارٍ التحقق...</div>;
  if (!session) return <LoginForm />;
  if (!isAdmin) return <NotAuthorized />;
  return <Dashboard />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("هذا الإيميل غير مصرح له بالدخول");
      return;
    }
    setLoading(true);
    let { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error && /invalid login credentials/i.test(error.message)) {
      // First-time: create the admin account
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

function Dashboard() {
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
    if (!confirm(`هل تريد بالتأكيد حذف العضو "${name}"؟`)) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) { toast.error("فشل الحذف: " + error.message); return; }
    toast.success("تم حذف العضو");
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  function exportExcel() {
    if (members.length === 0) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["الاسم","الكلية","المستوى","التخصص","الجنس","رقم الهاتف","العمل في اللجنة","عام الانضمام","الملاحظات","تاريخ التسجيل"];
    const rows = members.map(m => [
      m.full_name, m.college, m.level, m.specialty || "",
      m.gender === "male" ? "ذكر" : "أنثى",
      m.phone || "", m.committee_role || "", m.join_year || "",
      m.notes || "", new Date(m.created_at).toLocaleString("ar"),
    ]);
    // CSV with UTF-8 BOM for Excel Arabic support
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `أعضاء_اللجنة_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل الملف");
  }

  return (
    <div>
      <section className="bg-hero text-white py-10 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 flex items-center justify-between gap-3 flex-wrap relative">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-brand-gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">لوحة المشرفين</h1>
              <p className="text-white/80 text-sm">إجمالي الأعضاء: {members.length}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-gradient-gold text-brand-purple-deep font-bold px-4 py-2.5 rounded-xl shadow-gold flex items-center gap-2">
              <Download className="w-4 h-4" /> تصدير Excel
            </button>
            <button onClick={() => supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
              <LogOut className="w-4 h-4" /> خروج
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-2xl p-3 mb-4 shadow-soft">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الكلية..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-border bg-background" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">لا يوجد أعضاء مسجلين</div>
        ) : (
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
                  <th className="p-3 text-right">العام</th>
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
                    <td className="p-3">
                      {m.phone ? <a href={`tel:${m.phone}`} className="text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</a> : "-"}
                    </td>
                    <td className="p-3">{m.committee_role || "-"}</td>
                    <td className="p-3">{m.join_year || "-"}</td>
                    <td className="p-3">
                      <button onClick={() => onDelete(m.id, m.full_name)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
