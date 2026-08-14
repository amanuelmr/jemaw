import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";
import { getSafeRedirect } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign In — Jemaw",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <SignInForm redirectTo={getSafeRedirect(redirect)} />;
}
