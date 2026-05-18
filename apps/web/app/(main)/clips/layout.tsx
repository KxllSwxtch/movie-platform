import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Видео | MoviePlatform",
  description: "Раздел видео на MoviePlatform.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LegacyClipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
