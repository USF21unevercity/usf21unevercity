import { useState } from "react";
import { Mail, Phone, Send, MessageSquare } from "lucide-react";
import { COLLEGES, LEVELS } from "@/lib/colleges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ full_name: "", college: "", level: "", specialty: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.college || !form.level || !form.message) {
      toast.error("يرجى تعبئة الحقول المطلوبة"); return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: form.full_name, college: form.college, level: form.level,
      specialty: form.specialty || null, phone: form.phone || null, message: form.message,
    });
    setSending(false);
    if (error) { toast.error("تعذر إرسال الرسالة"); return; }
    toast.success("تم إرسال رسالتك بنجاح");
    setForm({ full_name: "", college: "", level: "", specialty: "", phone: "", message: "" });
  };

  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Mail className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">تواصل معنا</h1>
          <p className="text-white/85">نحن هنا للمساعدة والاستفسارات</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        <div className="bg-gradient-purple text-white rounded-3xl p-6 shadow-glow space-y-4 h-fit">
          <h3 className="text-xl font-bold">للإنضمام والتواصل</h3>
          <a href="tel:+967774665526" className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 hover:bg-white/20 transition-colors">
            <Phone className="w-5 h-5 text-brand-gold shrink-0" />
            <div className="text-right min-w-0">
              <div className="font-bold" dir="ltr">+967 774665526</div>
              <div className="text-xs text-white/70">إدارة اللجنة العلمية المركزية</div>
            </div>
          </a>
          <a href="mailto:usf21unevercity@gmail.com" className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 hover:bg-white/20 transition-colors">
            <Mail className="w-5 h-5 text-brand-gold shrink-0" />
            <div className="text-right min-w-0">
              <div className="text-xs text-white/70">البريد الإلكتروني</div>
              <div className="font-bold text-sm break-all" dir="ltr">usf21unevercity@gmail.com</div>
            </div>
          </a>
        </div>

        <form onSubmit={submit} className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">أرسل رسالتك</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">نرد على جميع الاستفسارات في أقرب وقت</p>

          <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="الاسم الرباعي *" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />

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

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
              placeholder="التخصص" className="px-4 py-3 rounded-xl border border-border bg-background" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="رقم الهاتف (اختياري)" className="px-4 py-3 rounded-xl border border-border bg-background" />
          </div>

          <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="الرسالة *" className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none" />

          <button type="submit" disabled={sending}
            className="w-full bg-gradient-gold text-brand-purple-deep font-bold py-3 rounded-xl shadow-gold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
          </button>
        </form>
      </section>
    </div>
  );
}
