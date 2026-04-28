import { env } from "../config/env";

const FIREBASE_LOOKUP_ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

interface FirebaseProviderInfo {
  providerId?: string;
}

interface FirebaseLookupUser {
  localId?: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoUrl?: string;
  providerUserInfo?: FirebaseProviderInfo[];
}

interface FirebaseLookupResponse {
  users?: FirebaseLookupUser[];
  error?: {
    message?: string;
  };
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoUrl: string | null;
  providers: string[];
}

function parseFirebaseAuthError(payload: FirebaseLookupResponse | null) {
  const code = payload?.error?.message;
  if (!code) return "Unable to verify Firebase login right now.";
  if (code === "INVALID_ID_TOKEN") return "Your login session expired. Please login again.";
  if (code === "USER_DISABLED") return "This Firebase account has been disabled.";
  return "Unable to verify Firebase login right now.";
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const apiKey = env.FIREBASE_WEB_API_KEY;
  const response = await fetch(`${FIREBASE_LOOKUP_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const payload = (await response.json().catch(() => null)) as FirebaseLookupResponse | null;

  if (!response.ok) {
    throw new Error(parseFirebaseAuthError(payload));
  }

  const user = payload?.users?.[0];
  if (!user?.localId) {
    throw new Error("Firebase login verification failed.");
  }

  return {
    uid: user.localId,
    email: user.email?.toLowerCase().trim() || null,
    phoneNumber: user.phoneNumber?.trim() || null,
    displayName: user.displayName?.trim() || null,
    photoUrl: user.photoUrl?.trim() || null,
    providers: (user.providerUserInfo || [])
      .map((provider) => provider.providerId?.trim())
      .filter((providerId): providerId is string => Boolean(providerId)),
  };
}
