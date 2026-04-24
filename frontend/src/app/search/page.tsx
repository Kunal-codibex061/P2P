import { Suspense } from "react";
import { SearchPageContent } from "@/components/search-page-content";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8" />}>
      <SearchPageContent />
    </Suspense>
  );
}

