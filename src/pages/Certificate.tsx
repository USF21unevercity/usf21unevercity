import { useState } from "react";
import { Award, Send, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { COLLEGES, LEVELS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TYPES = [
  "شهادة عضوية اللجنة العلمية",
  "شهادة مشاركة تطوعية",
  "شهادة حضور تدريب",
  "شهادة تقدير",
  "شهادة عمل في اللجنة",
];

export default function Certificate() {
  const [form, setForm] = useState({ full_name: "", college: "", level: "", specialty: "", email: "", phone: "", certificate_type: "", reason: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.college || !form.level || !form.email || !form.certificate_type || !form.reason) {
      toast.error("يرجى تعبئة الحقول المطلوبة"); return;
    }
    setSending(true);
    const { error } = await supabase.from("certificate_requests").insert({
      full_name: form.full_name, college: form.college, level: form.level,
      specialty: form.specialty || null, email: form.email, phone: form.phone || null,
      certificate_type: form.certificate_type, reason: form.reason,
    });
    setSending(false);
    if (error) { toast.error("تعذر إرسال الطلب"); return; }
    toast.success("تم إرسال طلب الشهادة بنجاح");
    setForm({ full_name: "", college: "", level: "", specialty: "", email: "", phone: "", certificate_type: "", reason: "" });
  };

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Award className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">طلب شهادة إلكترونية</h1>
          <p className="text-white/85">يمكنك الآن طلب الشهادات الإلكترونية بسهولة</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
          <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="الاسم الرباعي الكامل *" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })}
              className="px-4 py-3 rounded-xl border border-border bg-background">
              <option value="">اختر الكلية *</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select required value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
              className="px-4 py-3 rounded-xl border border-border bg-background">
              <option value="">اختر المستوى *</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
            placeholder="التخصص (اختياري)" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="البريد الإلكتروني *" className="px-4 py-3 rounded-xl border border-border bg-background" dir="ltr" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="رقم الهاتف (اختياري)" className="px-4 py-3 rounded-xl border border-border bg-background" />
          </div>
          <select required value={form.certificate_type} onChange={e => setForm({ ...form, certificate_type: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background">
            <option value="">اختر نوع الشهادة *</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea required rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
            placeholder="سبب طلب الشهادة *" className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none" />
          <button type="submit" disabled={sending}
            className="w-full bg-gradient-gold text-brand-purple-deep font-bold py-3 rounded-xl shadow-gold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? "جارٍ الإرسال..." : "إرسال طلب الشهادة"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2 text-amber-700"><Info className="w-5 h-5" /><h3 className="font-bold">تنبيه</h3></div>
            <p className="text-sm text-amber-800">هذا النموذج متاح فقط للأعضاء المسجلين. إذا لم تكن مسجلاً، <Link to="/register" className="underline font-bold">يرجى التسجيل أولاً</Link>.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2 text-blue-700"><Info className="w-5 h-5" /><h3 className="font-bold">ملاحظة مهمة</h3></div>
            <p className="text-sm text-blue-800">سيتم إرسال الشهادة بصيغة PDF إلى بريدك الإلكتروني خلال 24-48 ساعة من مراجعة الطلب. تأكد من صحة بريدك الإلكتروني.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
