import { listingImageCatalog, listingTemplates } from "./seedData";

const UNSPLASH_TRANSFORM = "auto=format&fit=crop&w=1400&q=80";

function normalizeUnsplashPhoto(photoBaseUrl: string): string {
  return `${photoBaseUrl}?${UNSPLASH_TRANSFORM}`;
}

function extractUnsplashPhotoBases(html: string): string[] {
  const matches = html.match(/https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9_-]+/g) || [];
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    if (!seen.has(match)) {
      seen.add(match);
      deduped.push(match);
    }
  }
  return deduped;
}

async function fetchCandidates(query: string): Promise<string[]> {
  const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "rentora-image-curation-script/1.0",
    },
  });
  if (!response.ok) {
    return [];
  }
  const html = await response.text();
  return extractUnsplashPhotoBases(html).slice(0, 12).map(normalizeUnsplashPhoto);
}

async function run() {
  const output: Record<
    string,
    {
      imageQuery: string;
      currentPhotos: string[];
      suggestedCandidates: string[];
    }
  > = {};

  for (const template of listingTemplates) {
    const current = listingImageCatalog[template.title];
    const imageQuery = template.imageQuery || current?.imageQuery || template.title;
    const suggestedCandidates = await fetchCandidates(imageQuery);
    output[template.title] = {
      imageQuery,
      currentPhotos: current?.photos || [],
      suggestedCandidates,
    };
  }

  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error("Failed to curate image candidates:", error);
  process.exit(1);
});
