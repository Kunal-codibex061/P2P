import { Suspense } from "react";
import CreateListingPageClient from "./create-listing-page-client";

export default function CreateListingPage() {
  return (
    <Suspense fallback={null}>
      <CreateListingPageClient />
    </Suspense>
  );
}
