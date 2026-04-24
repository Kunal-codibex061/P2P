import { AlertTriangle } from "lucide-react";

export function SafetyBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Keep communication inside the app. Never share OTPs or make suspicious
          payments outside the platform.
        </p>
      </div>
    </div>
  );
}
