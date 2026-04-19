import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Heart, Lightbulb, Sparkles, Award } from "lucide-react";

const verses = [
  {
    text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ● خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ● اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ● الَّذِي عَلَّمَ بِالْقَلَمِ ● عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ",
    ref: "سورة العلق - الآيات 1-5",
    big: true,
  },
  { text: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ", ref: "سورة الزمر - الآية 9" },
  { text: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ", ref: "سورة المجادلة - الآية 11" },
];

const goals = [
  { icon: Heart, title: "إحياء روح التعاون", desc: "بناء بيئة تعاونية بين طلاب الجامعة" },
  { icon: Lightbulb, title: "إيصال المعلومة بوضوح", desc: "تبسيط المحتوى العلمي للطلاب" },
  { icon: BookOpen, title: "توسيع مدارك الطالب", desc: "إثراء الجانب العلمي والمعرفي" },
  { icon: Sparkles, title: "مواكبة التطور التكنولوجي", desc: "استخدام أحدث الوسائل الرقمية" },
];

const steps = [
  { n: "1", title: "العمل التطوعي الخيري", desc: "أن يكون الانضمام عملاً تطوعياً خيرياً" },
  { n: "2", title: "الاستشعار بالأمانة", desc: "استشعار الأمانة في تقديم المساعدة وكتابة الملخصات" },
  { n: "3", title: "التواجد في المحاضرات", desc: "التواجد في المحاضرات الدراسية" },
  { n: "4", title: "الامتلاك للرغبة", desc: "امتلاك الرغبة والنشاط والتعاون" },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-hero overflow-hidden text-white">
        <div className="absolute inset-0 star-bg opacity-60" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-sm border border-brand-gold/30 rounded-3xl p-6 mb-10 flex items-center gap-4 justify-center shadow-glow">
            <div translate="no" className="notranslate w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center font-extrabold text-brand-purple-deep text-xl shrink-0">
              USF
            </div>
            <div className="text-right">
              <div className="font-bold text-lg md:text-xl">اللجنة العلمية المركزية</div>
              <div className="text-brand-gold text-sm">جامعة 21 سبتمبر للعلوم الطبية والتطبيقية</div>
            </div>
          </div>

          <h1 translate="no" className="notranslate text-center text-5xl md:text-7xl font-extrabold mb-12 tracking-tight">العلم نور</h1>

          {/* Verses */}
          <div className="max-w-4xl mx-auto bg-brand-purple/30 backdrop-blur border border-brand-gold/40 rounded-3xl p-6 md:p-10 shadow-glow mb-6">
            <div className="text-center text-brand-gold mb-6 text-lg">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <p className="font-quran text-2xl md:text-4xl leading-loose text-center text-brand-gold-light mb-6">
              ﴿{verses[0].text}﴾
            </p>
            <div className="flex justify-center">
              <span className="bg-brand-purple-deep border border-brand-gold/40 text-brand-gold px-5 py-2 rounded-full text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {verses[0].ref}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {verses.slice(1).map((v, i) => (
              <div key={i} className="bg-brand-purple/30 backdrop-blur border border-brand-gold/30 rounded-2xl p-6 text-center">
                <p className="font-quran text-xl md:text-2xl leading-loose text-brand-gold-light mb-4">﴿{v.text}﴾</p>
                <div className="text-brand-gold text-sm">{v.ref}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Users className="w-4 h-4" /> من نحن
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">كيان طلابي علمي تطوعي</h2>
            <p className="text-lg text-muted-foreground leading-loose mb-8">
              نحن طلاب جامعة 21 سبتمبر للعلوم الطبية والتطبيقية، نعمل بكل جد وإخلاص لخدمة زملائنا الطلاب
              وتوفير المحتوى العلمي الذي يساعدهم في مسيرتهم الأكاديمية
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-gold text-brand-purple-deep font-bold px-8 py-4 rounded-2xl shadow-gold hover:scale-105 transition-transform">
              سجّل الآن <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-soft">
              <h3 className="text-xl font-bold mb-3 text-primary">رؤيتنا</h3>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">وعي • تعلم • بناء • تطوير • تأهيل • تحفيز</span>
              </p>
            </div>
            <div className="bg-gradient-purple text-white rounded-3xl p-8 shadow-glow">
              <h3 className="text-xl font-bold mb-3 text-brand-gold">رسالتنا</h3>
              <p className="leading-relaxed">بالتكافل والوعي والبصيرة تنشأ الكوادر ذو الكفاءة والفاعلية في بناء الأمة</p>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8 shadow-soft">
              <h3 className="text-xl font-bold mb-3 text-primary">أهدافنا</h3>
              <ul className="space-y-2 text-muted-foreground">
                {goals.map((g, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>{g.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to join */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">كيف تنضم إلينا؟</h2>
            <p className="text-muted-foreground">اتبع الخطوات التالية للانضمام إلى اللجنة العلمية</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="bg-card rounded-3xl p-6 shadow-soft border border-border relative overflow-hidden group hover:shadow-glow transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center font-extrabold text-2xl mb-4 shadow-glow">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-purple text-white font-bold px-8 py-4 rounded-2xl shadow-glow hover:scale-105 transition-transform">
              <UserPlusIcon /> سجّل الآن في العضوية
            </Link>
          </div>
        </div>
      </section>

      {/* Certificate CTA */}
      <section className="py-16 bg-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 star-bg opacity-40" />
        <div className="container mx-auto px-4 text-center relative">
          <Award className="w-16 h-16 text-brand-gold mx-auto mb-4 animate-float" />
          <h2 className="text-3xl md:text-4xl font-bold mb-3">احصل على شهادتك الإلكترونية</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">سجّل بياناتك للحصول على شهادة التقدير المقدمة من ملتقى الطالب الجامعي</p>
          <Link to="/certificate" className="inline-flex items-center gap-2 bg-gradient-gold text-brand-purple-deep font-bold px-8 py-4 rounded-2xl shadow-gold hover:scale-105 transition-transform">
            تسجيل للحصول على الشهادة <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function UserPlusIcon() {
  return <Users className="w-5 h-5" />;
}
