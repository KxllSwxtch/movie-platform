"use client";

import { SeshLogo } from "@/components/common/sesh-logo";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sesh-auth-shell relative min-h-screen overflow-hidden bg-[#05020b] text-white">
      <MobileHeader mode="auth" />
      <AppSidebar className="md:hidden" />

      <div
        aria-hidden="true"
        className="sesh-auth-bg fixed inset-0 z-0 bg-[url('/images/mainbackground.png')] bg-cover bg-center bg-no-repeat"
      />

      <div
        aria-hidden="true"
        className="sesh-auth-vignette fixed inset-0 z-[1] bg-black/[0.08]"
      />

      <header className="relative z-10 px-[26px] pt-[27px] max-md:hidden">
        <SeshLogo
          href="/"
          className="sesh-auth-logo"
          imageClassName="h-12 w-auto"
          priority
        />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-164px)] items-center justify-center px-6 pb-10 pt-9">
        <div className="w-full max-w-[570px]">{children}</div>
      </main>

      <footer className="absolute bottom-[47px] left-0 right-0 z-10 text-center">
        <p
          className="text-[15px] font-medium text-[#8f96ad]"
          suppressHydrationWarning
        >
          &copy; {new Date().getFullYear()} СЕШ. Все права защищены.
        </p>
      </footer>
    </div>
  );
}
