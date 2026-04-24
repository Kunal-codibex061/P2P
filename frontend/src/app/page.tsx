import { Suspense } from "react";
import { HomePageContent } from "@/components/home-page-content";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8" />}>
      <HomePageContent />
    </Suspense>
  );
}
