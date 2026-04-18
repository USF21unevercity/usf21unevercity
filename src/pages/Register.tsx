import { useState } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { COLLEGES, LEVELS, JOIN_YEARS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(3, "الاسم قصير جداً").max(120),
  college: z.string().min(1, "اختر الكلية"),
  level: z.string().min(1, "اختر المستوى"),
  specialty: z.string().trim().max(120).optional().or(z.literal("")),
  join_year: z.string().min(1, "اختر العام"),
  gender: z.enum(["male", "female"], { errorMap: () => ({ message: "اختر الجنس" }) }),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  committee_role: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export default function Register() {
  const [form, setForm] = useState({
    full_name: "", college: "", level: "", specialty: "",
    join_year: "", gender: "" as "male" | "female" | "",
    phone: "", committee_role: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (form.gender === "male" && !form.phone?.trim()) {
      toast.error("رقم الهاتف مطلوب للذكور");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("members").insert({
      full_name: parsed.data.full_name,
      college: parsed.data.college,
      level: parsed.data.level,
      specialty: parsed.data.specialty || null,
      join_year: parsed.data.join_year,
      gender: parsed.data.gender,
      phone: parsed.data.phone || null,
      committee_role: parsed.data.committee_role || null,
      notes: parsed.data.notes || null,
    });
    setLoading(false);
    if (error) { toast.error("حدث خطأ: " + error.message); return; }
    setDone(true);
    toast.success("تم تسجيلك بنجاح في اللجنة العلمية 🎉");
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-card-elev">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-float" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">تم التسجيل بنجاح</h2>
          <p className="text-muted-foreground mb-6">مرحباً بك في عائلة اللجنة العلمية المركزية</p>
          <button onClick={() => { setDone(false); setForm({ full_name: "", college: "", level: "", specialty: "", join_year: "", gender: "", phone: "", committee_role: "", notes: "" }); }}
            className="bg-gradient-purple text-white font-bold px-6 py-3 rounded-xl shadow-glow">
            تسجيل عضو آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-soft text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">تسجيل العضوية</h1>
          <p className="text-white/85">انضم إلى عائلة اللجنة العلمية المركزية</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={onSubmit} className="bg-card rounded-3xl shadow-card-elev border border-border overflow-hidden">
            <div className="bg-gradient-soft p-6 text-white">
              <h2 className="text-2xl font-bold">نموذج التسجيل</h2>
              <p className="text-white/85 text-sm">الرجاء ملء جميع البيانات المطلوبة</p>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <Field label="الاسم الرباعي *">
                <input required value={form.full_name} onChange={e => update("full_name", e.target.value)}
                  className="input-base" placeholder="أدخل اسمك الرباعي" />
              </Field>

              <div className="grid md:grid-cols-2 gap-5">
                <Field label="الكلية *">
                  <select required value={form.college} onChange={e => update("college", e.target.value)} className="input-base">
                    <option value="">اختر الكلية</option>
                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="المستوى *">
                  <select required value={form.level} onChange={e => update("level", e.target.value)} className="input-base">
                    <option value="">اختر المستوى</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <Field label="التخصص">
                  <input value={form.specialty} onChange={e => update("specialty", e.target.value)} className="input-base" placeholder="مثال: طب بشري" />
                </Field>
                <Field label="عام الانضمام *">
                  <select required value={form.join_year} onChange={e => update("join_year", e.target.value)} className="input-base">
                    <option value="">اختر العام</option>
                    {JOIN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="الجنس *">
                <div className="flex gap-4">
                  {[{v:"male",l:"ذكر"},{v:"female",l:"أنثى"}].map(g => (
                    <label key={g.v} className={`flex-1 cursor-pointer border-2 rounded-xl p-3 text-center font-semibold transition-all ${form.gender === g.v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      <input type="radio" name="gender" value={g.v} checked={form.gender === g.v} onChange={e => update("gender", e.target.value)} className="sr-only" />
                      {g.l}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label={`رقم الهاتف ${form.gender === "male" ? "*" : "(اختياري)"}`}>
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className="input-base" placeholder="مثال: 7xxxxxxxx" />
                {form.gender === "female" && (
                  <p className="text-xs text-muted-foreground mt-1">ملاحظة: لن يظهر رقم الهاتف للطلاب الآخرين، فقط للمشرف</p>
                )}
              </Field>

              <Field label="العمل الحالي في اللجنة العلمية">
                <input value={form.committee_role} onChange={e => update("committee_role", e.target.value)} className="input-base" placeholder="مثال: مسؤول قسم التشريح" />
              </Field>

              <Field label="ملاحظات لتطوير اللجنة العلمية">
                <textarea rows={3} value={form.notes} onChange={e => update("notes", e.target.value)} className="input-base resize-none" placeholder="اكتب ملاحظاتك..." />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-purple text-white font-bold py-4 rounded-2xl shadow-glow hover:scale-[1.01] transition-transform disabled:opacity-50">
                {loading ? "جارٍ التسجيل..." : "تسجيل"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <style>{`
        .input-base {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .input-base:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}
