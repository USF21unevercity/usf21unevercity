import { Award } from "lucide-react";

export default function Certificate() {
  return (
    <div>
      <section className="bg-hero text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-50" />
        <div className="container mx-auto px-4 text-center relative">
          <Award className="w-14 h-14 text-brand-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">الشهادات الإلكترونية</h1>
          <p className="text-white/85">شهادات التقدير لأعضاء اللجنة العلمية</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-card border border-border rounded-3xl p-10 shadow-soft">
          <Award className="w-16 h-16 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">قريباً</h3>
          <p className="text-muted-foreground">سيتم إطلاق نظام الشهادات الإلكترونية قريباً</p>
        </div>
      </section>
    </div>
  );
}
