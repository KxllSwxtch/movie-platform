import { redirect } from "next/navigation";

export default async function LegacyClipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/videos/${slug}`);
}
