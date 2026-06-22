import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Видео | SESH",
  description: "Раздел видео на SESH.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LegacyClipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
