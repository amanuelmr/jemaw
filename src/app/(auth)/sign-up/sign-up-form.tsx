"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { GoogleIcon } from "@/components/google-icon";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="border-t-2 border-[#f15b3a] pt-8">
          <Mail className="size-5" />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">Check your inbox</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to
          </p>
          <p className="mt-1 font-mono text-sm font-medium">{email}</p>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Click the link in the email to activate your account. Didn&apos;t get it? Check your spam folder.
          </p>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold tracking-[-0.045em]">Create your account</h1>
      <p className="mb-8 mt-2 text-sm leading-6 text-muted-foreground">Start a group, invite the people involved, and keep the shared record in one place.</p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-white text-sm font-semibold transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p role="alert" className="border-l-2 border-destructive bg-[#fff2ef] px-3 py-2.5 text-sm text-[#912f23]">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
