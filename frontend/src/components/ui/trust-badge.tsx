import { BadgeCheck, CircleCheck, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  type: "phone" | "identity" | "trusted" | "delivery" | "deposit";
}

const config = {
  phone: {
    label: "Phone Verified",
    icon: CircleCheck,
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
  identity: {
    label: "Identity Verified",
    icon: BadgeCheck,
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
  trusted: {
    label: "Trusted Lender",
    icon: ShieldCheck,
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
  delivery: {
    label: "Delivery Available",
    icon: Truck,
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
  deposit: {
    label: "Deposit Required",
    icon: ShieldCheck,
    classes: "bg-blue-50 text-blue-700 border-blue-100",
  },
} as const;

export function TrustBadge({ type }: TrustBadgeProps) {
  const item = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        item.classes,
      )}
    >
      <item.icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
}
