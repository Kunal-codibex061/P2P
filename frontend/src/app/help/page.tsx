import { InfoPageLayout } from "@/components/info-page-layout";

export default function HelpPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Help Center"
      subtitle="Find quick answers for listing, searching, booking, and handling trust and safety on RENTeasy."
      primaryAction={{ label: "Explore Rentals", href: "/explore" }}
      sections={[
        {
          title: "How rentals work",
          body: "Search by item name, city, or category, compare pricing options, then request the listing that fits your timeline. Owners approve requests, and both sides coordinate details over in-app chat.",
        },
        {
          title: "Listing your item",
          body: "Use clear photos from multiple angles, set flexible rent options, and define deposit and usage rules. Better listing quality leads to faster matches and more trust from renters.",
        },
        {
          title: "Need quick assistance?",
          body: "For account or booking issues, use the chat feature from your dashboard and include your request details so we can resolve faster.",
        },
      ]}
    />
  );
}
