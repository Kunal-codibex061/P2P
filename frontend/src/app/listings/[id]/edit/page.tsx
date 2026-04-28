import { Suspense } from "react";
import CreateListingPageClient from "@/app/listings/new/create-listing-page-client";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <CreateListingPageClient mode="edit" listingId={id} />
    </Suspense>
  );
}
