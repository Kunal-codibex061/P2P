import { InfoPageLayout } from "@/components/info-page-layout";

export default function TermsPage() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Terms of Use"
      subtitle="These terms describe responsibilities for renters and owners while using RENTeasy."
      sections={[
        {
          title: "Account responsibility",
          body: "Users are expected to provide accurate profile information, maintain account security, and communicate honestly during rental interactions.",
        },
        {
          title: "Listings and requests",
          body: "Owners should list items truthfully with clear pricing and conditions. Renters should request only when genuinely interested and follow approved usage terms.",
        },
        {
          title: "Trust and safety",
          body: "Any misuse, fraud attempts, or policy violations may lead to request cancellation or account restrictions to protect the community.",
        },
      ]}
    />
  );
}
