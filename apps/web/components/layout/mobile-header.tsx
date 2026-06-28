"use client";

import { List, MagnifyingGlass, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";

const landingLinks = [
  { label: "Сериалы", href: "/series" },
  { label: "Обучение", href: "/tutorials" },
  { label: "Тарифы", href: "/pricing" },
  { label: "Партнёрам", href: "/partner" },
];

interface MobileHeaderProps {
  mode?: "app" | "auth" | "landing";
  className?: string;
}

export function MobileHeader({ mode = "app", className }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(mode !== "landing");
  const { setMobileMenuOpen, setSearchOpen } = useUIStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const pathname = usePathname();

  useEffect(() => {
    if (mode !== "landing") {
      setCompact(true);
      return undefined;
    }

    const updateCompact = () => {
      setCompact(window.scrollY > 48);
    };

    updateCompact();
    window.addEventListener("scroll", updateCompact, { passive: true });
    return () => window.removeEventListener("scroll", updateCompact);
  }, [mode]);

  useEffect(() => {
    if (mode !== "landing") return undefined;

    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, mode]);

  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, setMobileMenuOpen, setSearchOpen]);

  const isLanding = mode === "landing";
  const isApp = mode === "app";
  const isAuth = mode === "auth";

  return (
    <>
      <header
        className={cn(
          "sesh-mobile-header md:hidden",
          `sesh-mobile-header-${mode}`,
          compact && "sesh-mobile-header-compact",
          isLanding && !compact && "sesh-mobile-header-expanded",
          className,
        )}
      >
        <div className="sesh-mobile-header-inner">
          {(isApp || isAuth) && (
            <div className="sesh-mobile-header-leading">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="sesh-mobile-header-icon"
                aria-label="Открыть меню"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          )}

          {isLanding ? (
            <Link href="/" className="sesh-mobile-header-logo" aria-label="СЕШ">
              <Image
                src="/logo.png"
                alt="СЕШ"
                width={220}
                height={72}
                priority
                className="sesh-mobile-header-logo-full"
              />
              <Image
                src="/logo-mobile.png"
                alt="СЕШ"
                width={72}
                height={72}
                priority
                className="sesh-mobile-header-logo-icon"
              />
            </Link>
          ) : (
            <Link href="/" className="sesh-mobile-header-logo" aria-label="СЕШ">
              <Image
                src="/logo-mobile.png"
                alt="СЕШ"
                width={72}
                height={72}
                priority
                className="sesh-mobile-header-logo-icon-only"
              />
            </Link>
          )}

          <div className="sesh-mobile-header-actions">
            {isApp && (
              <>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="sesh-mobile-header-icon"
                  aria-label="Поиск"
                >
                  <MagnifyingGlass className="h-5 w-5" />
                </button>
                <NotificationBell />
                <ProfileDropdown />
              </>
            )}

            {isLanding && (
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="sesh-mobile-header-icon"
                aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              >
                {menuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <List className="h-6 w-6" />
                )}
              </button>
            )}

            {isAuth && (
              <span className="sesh-mobile-header-spacer" aria-hidden="true" />
            )}
          </div>
        </div>
      </header>

      {isLanding && menuOpen && (
        <div className="sesh-mobile-menu-layer fixed inset-0 z-[65] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/42 backdrop-blur-sm"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <div className="sesh-mobile-menu-panel">
            <nav className="flex flex-col gap-1">
              {landingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-white/88 transition-colors active:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-7 flex flex-col gap-3">
              {isHydrated && isAuthenticated ? (
                <Button
                  variant="gradient"
                  className="sesh-landing-primary h-12 w-full justify-center"
                  asChild
                >
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    Личный кабинет
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="sesh-landing-secondary h-12 w-full justify-center"
                    asChild
                  >
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      Войти
                    </Link>
                  </Button>
                  <Button
                    variant="gradient"
                    className="sesh-landing-primary h-12 w-full justify-center"
                    asChild
                  >
                    <Link href="/register" onClick={() => setMenuOpen(false)}>
                      Начать
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
