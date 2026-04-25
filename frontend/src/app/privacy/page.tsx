import { InfoPageLayout } from "@/components/info-page-layout";

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Your profile, listing, and booking information is handled with care and used to keep local rentals secure and reliable."
      sections={[
        {
          title: "Data we collect",
          body: "We collect information you provide directly, such as your profile details, listing content, rental requests, and conversations needed to complete transactions.",
        },
        {
          title: "How we use data",
          body: "Data is used to match renters and owners, improve search quality, reduce fraud, and support customer service. We do not use private rental conversations for public display.",
        },
        {
          title: "Your controls",
          body: "You can update profile information, manage listing details, and request support for account-related concerns. We retain only what is necessary for platform operations and safety.",
        },
      ]}
    />
  );
}
