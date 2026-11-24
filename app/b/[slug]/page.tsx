import { notFound } from "next/navigation";
import { BRANDS, getBrand } from "@/lib/brands";
import Dashboard from "@/components/Dashboard";

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();
  return <Dashboard brand={brand} />;
}
