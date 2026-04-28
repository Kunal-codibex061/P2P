"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { Loader2, LogIn, MessageSquareText, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { firebaseAuth, googleAuthProvider } from "@/lib/firebase";

function getReadableError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to login right now.";
  if (
    message.includes("auth/billing-not-enabled") ||
    message.includes("BILLING_NOT_ENABLED")
  ) {
    return "Phone OTP is not enabled yet for this Firebase project. Link a Cloud Billing account (Blaze) in Firebase, then try again. You can use Google login right now.";
  }
  if (message.includes("popup-closed-by-user")) return "Google login was closed before completion.";
  if (message.includes("popup-blocked")) return "Popup was blocked. Allow popups and try again.";
  if (message.includes("auth/invalid-phone-number")) return "Use a valid phone number like +919876543210.";
  if (message.includes("auth/invalid-verification-code")) return "The OTP is invalid. Please recheck it.";
  if (message.includes("auth/code-expired")) return "This OTP has expired. Please request a new OTP.";
  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a bit and try again.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithFirebaseToken } = useAuth();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  useEffect(
    () => () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    },
    [],
  );

  function getRecaptchaVerifier() {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = new RecaptchaVerifier(firebaseAuth, "phone-recaptcha", {
      size: "invisible",
    });
    recaptchaRef.current = verifier;
    return verifier;
  }

  async function onGoogleLogin() {
    setError("");
    setStatusMessage("");
    setIsGoogleSubmitting(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      await loginWithFirebaseToken(idToken);
      router.push("/");
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function onSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    const normalizedPhone = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Enter phone number in international format (example: +919876543210).");
      return;
    }
    setIsOtpSending(true);
    try {
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, verifier);
      setConfirmationResult(confirmation);
      setStatusMessage(`OTP sent to ${normalizedPhone}. Enter it below to continue.`);
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setIsOtpSending(false);
    }
  }

  async function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    if (!confirmationResult) {
      setError("Request OTP first.");
      return;
    }
    if (!otp.trim()) {
      setError("Enter the OTP sent to your phone.");
      return;
    }
    setIsOtpVerifying(true);
    try {
      const credential = await confirmationResult.confirm(otp.trim());
      const idToken = await credential.user.getIdToken();
      await loginWithFirebaseToken(idToken);
      router.push("/");
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setIsOtpVerifying(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <section className="rounded-3xl border accent-border-soft bg-white p-7 shadow-sm md:p-8">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">RentEasy</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Login to your account</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Continue securely using Google or OTP verification on your phone number.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            disabled={isGoogleSubmitting}
            onClick={() => void onGoogleLogin()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGoogleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {isGoogleSubmitting ? "Connecting Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="space-y-4" onSubmit={onSendOtp}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Phone number</span>
              <span className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-blue-400 focus-within:bg-white">
                <Phone className="h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  required
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="+919876543210"
                />
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Use full country code with <span className="font-semibold">+</span>.
              </p>
            </label>

            <button
              type="submit"
              disabled={isOtpSending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-black !text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isOtpSending ? <Loader2 className="h-4 w-4 animate-spin !text-white" /> : <MessageSquareText className="h-4 w-4 !text-white" />}
              {isOtpSending ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          {confirmationResult ? (
            <form className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4" onSubmit={onVerifyOtp}>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Enter OTP</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400"
                  placeholder="6-digit code"
                />
              </label>
              <button
                type="submit"
                disabled={isOtpVerifying}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black !text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isOtpVerifying ? <Loader2 className="h-4 w-4 animate-spin !text-white" /> : <ShieldCheck className="h-4 w-4 !text-white" />}
                {isOtpVerifying ? "Verifying..." : "Verify OTP and Continue"}
              </button>
            </form>
          ) : null}
        </div>

        <div id="phone-recaptcha" className="sr-only" />

        {statusMessage ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {statusMessage}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
