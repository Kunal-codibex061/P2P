export interface ListingResponseHandoffParams {
  respondToItemRequestId: string;
  responseMessage: string;
}

interface SearchParamReader {
  get: (name: string) => string | null;
}

export function buildListingResponseHandoffHref({
  respondToItemRequestId,
  responseMessage,
}: ListingResponseHandoffParams): string {
  const params = new URLSearchParams({
    respondToItemRequestId: respondToItemRequestId.trim(),
    responseMessage: responseMessage.trim(),
  });
  return `/listings/new?${params.toString()}`;
}

export function readListingResponseHandoffParams(
  searchParams: SearchParamReader,
): ListingResponseHandoffParams | null {
  const respondToItemRequestId = (searchParams.get("respondToItemRequestId") || "").trim();
  if (!respondToItemRequestId) return null;

  return {
    respondToItemRequestId,
    responseMessage: (searchParams.get("responseMessage") || "").trim(),
  };
}
