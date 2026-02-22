'use client';

import {
  LandingNav,
  LandingHero,
  LandingStats,
  LandingContentPreview,
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
    <div className="min-h-screen bg-[#05060A]">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingContentPreview />
      <LandingFeatures />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
