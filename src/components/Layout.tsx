import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BookOpen, UserPlus, Users, Mail, Award, Lock, Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/colleges", label: "بوابة الكليات", icon: Building2 },
  { to: "/library", label: "المكتبة الرقمية", icon: BookOpen },
  { to: "/register", label: "تسجيل العضوية", icon: UserPlus },
  { to: "/members", label: "أعضاء اللجنة", icon: Users },
  { to: "/contact", label: "تواصل معنا", icon: Mail },
  { to: "/certificate", label: "الشهادات", icon: Award },
  { to: "/admin", label: "بوابة المشرفين", icon: Lock },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-brand-purple-deep/95 backdrop-blur-md border-b border-brand-gold/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div translate="no" className="notranslate w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold font-extrabold text-brand-purple-deep text-lg">
              USF
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-white font-bold leading-tight text-sm md:text-base">اللجنة العلمية المركزية</div>
              <div className="text-brand-gold text-xs">ملتقى الطالب الجامعي</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                  isActive
                    ? "bg-gradient-gold text-brand-purple-deep shadow-gold"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                )}>
                <l.icon className="w-4 h-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          <button onClick={() => setOpen(!open)} className="lg:hidden text-white p-2" aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <nav className="lg:hidden bg-brand-purple-deep border-t border-brand-gold/20 px-4 py-3 grid grid-cols-2 gap-2">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold",
                  isActive ? "bg-gradient-gold text-brand-purple-deep" : "text-white/85 bg-white/5"
                )}>
                <l.icon className="w-4 h-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1" key={location.pathname}>
        <Outlet />
      </main>

      <footer className="bg-brand-purple-deep text-white/80 py-6 mt-12 border-t border-brand-gold/20">
        <div className="container mx-auto px-4 text-center text-sm">
          جميع الحقوق محفوظة للجنة العلمية المركزية - ملتقى الطالب الجامعي - جامعة 21 سبتمبر
        </div>
      </footer>
    </div>
  );
}
