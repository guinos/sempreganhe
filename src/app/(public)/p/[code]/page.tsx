import PublicScratchCard from "./public-scratch-card";

export default async function PublicPromotionPage({ params }: { params: Promise<{ code: string }> }) {
  return <PublicScratchCard code={(await params).code} />;
}
