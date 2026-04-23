import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BookOpen, UserPlus, Users, Mail, Award, Lock, Building2, Menu, X, ClipboardList, Megaphone, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/colleges", label: "بوابة الكليات", icon: Building2 },
  { to: "/library", label: "المكتبة الرقمية", icon: BookOpen },
  { to: "/awareness", label: "الحرب الناعمة", icon: Shield },
  { to: "/activities", label: "إعلانات الأنشطة", icon: Megaphone },
  { to: "/exam", label: "الاختبار الإلكتروني", icon: ClipboardList },
  { to: "/register", label: "تسجيل العضوية", icon: UserPlus },
  { to: "/members", label: "أعضاء اللجنة", icon: Users },
  { to: "/contact", label: "تواصل معنا", icon: Mail },
  { to: "/certificate", label: "الشهادات", icon: Award },
  { to: "/admin", label: "بوابة المشرفين", icon: Lock },
];

const ACT_VISIT_KEY = "activities_last_visit";
const AWARE_VISIT_KEY = "awareness_last_visit";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadAware, setUnreadAware] = useState(0);
  const location = useLocation();

  // Log a site visit per route change (with a per-tab dedupe to avoid spam)
  useEffect(() => {
    let visitorKey = localStorage.getItem("visitor_key");
    if (!visitorKey) {
      visitorKey = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + "-" + Date.now();
      localStorage.setItem("visitor_key", visitorKey);
    }
    const dedupeKey = `visit_logged_${location.pathname}`;
    const last = Number(sessionStorage.getItem(dedupeKey) || 0);
    const now = Date.now();
    // Log at most once every 5 minutes per path per tab
    if (now - last > 5 * 60 * 1000) {
      sessionStorage.setItem(dedupeKey, String(now));
      (supabase as any).from("site_visits").insert({
        visitor_key: visitorKey,
        path: location.pathname,
        user_agent: navigator.userAgent.slice(0, 300),
      }).then(() => {});
    }
  }, [location.pathname]);

  // Compute unread counts vs last visits
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const lastAct = localStorage.getItem(ACT_VISIT_KEY) || new Date(0).toISOString();
      const lastAware = localStorage.getItem(AWARE_VISIT_KEY) || new Date(0).toISOString();
      const [actRes, awareRes] = await Promise.all([
        (supabase as any).from("activities").select("id", { count: "exact", head: true }).gt("created_at", lastAct),
        (supabase as any).from("awareness_posts").select("id", { count: "exact", head: true }).gt("created_at", lastAware),
      ]);
      if (!cancelled) {
        setUnread(actRes.count || 0);
        setUnreadAware(awareRes.count || 0);
      }
    }
    load();
    const t = window.setInterval(load, 60000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [location.pathname]);

  // Mark as visited when entering these pages
  useEffect(() => {
    if (location.pathname === "/activities") {
      localStorage.setItem(ACT_VISIT_KEY, new Date().toISOString());
      setUnread(0);
    }
    if (location.pathname === "/awareness") {
      localStorage.setItem(AWARE_VISIT_KEY, new Date().toISOString());
      setUnreadAware(0);
    }
  }, [location.pathname]);

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
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                  isActive
                    ? "bg-gradient-gold text-brand-purple-deep shadow-gold"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                )}>
                <l.icon className="w-4 h-4" />
                <span>{l.label}</span>
                {((l.to === "/activities" && unread > 0) || (l.to === "/awareness" && unreadAware > 0)) && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                    {(() => { const n = l.to === "/activities" ? unread : unreadAware; return n > 99 ? "99+" : n; })()}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <button onClick={() => setOpen(!open)} className="lg:hidden text-white p-2 relative" aria-label="القائمة">
            {open ? <X /> : <Menu />}
            {!open && (unread + unreadAware) > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                {(unread + unreadAware) > 99 ? "99+" : (unread + unreadAware)}
              </span>
            )}
          </button>
        </div>

        {open && (
          <nav className="lg:hidden bg-brand-purple-deep border-t border-brand-gold/20 px-4 py-3 grid grid-cols-2 gap-2">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "relative flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold",
                  isActive ? "bg-gradient-gold text-brand-purple-deep" : "text-white/85 bg-white/5"
                )}>
                <l.icon className="w-4 h-4" />
                <span>{l.label}</span>
                {((l.to === "/activities" && unread > 0) || (l.to === "/awareness" && unreadAware > 0)) && (
                  <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {(() => { const n = l.to === "/activities" ? unread : unreadAware; return n > 99 ? "99+" : n; })()}
                  </span>
                )}
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
