import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";
import { getSafeRedirect } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign Up — Jemaw",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <SignUpForm redirectTo={getSafeRedirect(redirect)} />;
}
