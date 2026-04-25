import { Suspense } from "react";
import { CategoryPageContent } from "@/components/category-page-content";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-8" />}>
      <CategoryPageContent slug={slug} />
    </Suspense>
  );
}
