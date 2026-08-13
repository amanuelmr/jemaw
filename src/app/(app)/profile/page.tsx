import { getProfile } from "@/actions/profile";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — Jemaw" };

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Your corner</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#20231d] sm:text-4xl">You</h1>
        <p className="mt-2 text-sm text-muted-foreground">How friends see you, and how you keep your account secure.</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
