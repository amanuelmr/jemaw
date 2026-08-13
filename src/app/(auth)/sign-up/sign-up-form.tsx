"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  );
}

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
      <div className="w-full max-w-md">
        <div className="mb-10 lg:hidden"><Brand href="/sign-in" /></div>
        <div className="text-center">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-[22px] bg-[#dce9df]">
            <Mail className="size-6 text-primary" />
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">One last step</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d]">Check your inbox.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to
          </p>
          <p className="mt-1 font-money text-sm font-semibold text-[#20231d]">{email}</p>
          <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Click the link in the email to activate your account. Didn&apos;t get it? Check your spam folder.
          </p>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/sign-in" className="font-extrabold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 lg:hidden"><Brand href="/sign-in" /></div>

      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Come join the circle</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d]">Make shared money easy.</h1>
      <p className="mb-8 mt-2 text-sm leading-relaxed text-muted-foreground">Create your account, then start a group for the people and plans that matter.</p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d2cabc] bg-card/70 text-sm font-extrabold text-[#494d45] transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d9d2c5]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">or use email</span>
        <div className="h-px flex-1 bg-[#d9d2c5]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-xl bg-[#f5dfd9] px-3 py-2.5 text-sm font-semibold text-[#a64235]">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" type="text" placeholder="Amanuel Tesfaye" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
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
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-extrabold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
