'use client';

import {
  LandingNav,
  LandingHero,
  LandingStats,
  LandingFeatures,
  LandingPricing,
  LandingCTA,
  LandingFooter,
} from '@/components/home';

/**
 * Public landing page — immersive cinematic streaming experience
 * Full-bleed imagery, glassmorphism, gradient accents, animated depth
 */
export default function LandingPageClient() {
  return (
    <div className="sesh-landing min-h-screen overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
