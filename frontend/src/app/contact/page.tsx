import { InfoPageLayout } from "@/components/info-page-layout";

export default function ContactPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Contact Us"
      subtitle="We’re here to help with account setup, listings, and booking flows so you can rent with confidence."
      primaryAction={{ label: "Open Search", href: "/search" }}
      sections={[
        {
          title: "General support",
          body: "For onboarding and product questions, use the in-app chat and include screenshots or listing IDs for quicker resolution.",
        },
        {
          title: "Listing assistance",
          body: "Need help improving visibility? We can guide you on title quality, photo coverage, pricing structure, and delivery preferences.",
        },
        {
          title: "Policy and legal questions",
          body: "For privacy or terms clarifications, include your account email and concern summary so we can route your request appropriately.",
        },
      ]}
    />
  );
}
