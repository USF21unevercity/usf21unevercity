import { Mail, Phone, MessageCircle } from "lucide-react";

export default function Contact() {
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

      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <a href="tel:+967774665526" className="bg-gradient-purple text-white rounded-2xl p-6 shadow-glow flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Phone className="w-7 h-7 text-brand-gold" />
            </div>
            <div>
              <div className="text-brand-gold font-bold">للإنضمام والتواصل</div>
              <div className="text-lg font-bold mt-1" dir="ltr">+967 774665526</div>
              <div className="text-white/70 text-xs mt-1">إدارة اللجنة العلمية المركزية</div>
            </div>
          </a>

          <a href="mailto:usf21unevercity@gmail.com" className="bg-gradient-soft text-white rounded-2xl p-6 shadow-glow flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold">البريد الإلكتروني</div>
              <div className="font-semibold mt-1 break-all text-sm" dir="ltr">usf21unevercity@gmail.com</div>
            </div>
          </a>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-soft">
          <MessageCircle className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-foreground mb-2">نرحب باستفساراتكم</h2>
          <p className="text-muted-foreground">للتواصل المباشر يمكنك الاتصال أو إرسال رسالة عبر البريد الإلكتروني، وسنرد في أقرب وقت ممكن.</p>
        </div>
      </section>
    </div>
  );
}
