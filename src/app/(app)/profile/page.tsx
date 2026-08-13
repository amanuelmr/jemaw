import { getProfile } from "@/actions/profile";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — Jemaw" };

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Account"
        description="Manage the name and photo people see in your groups, plus your sign-in security."
        className="mb-8"
      />
      <ProfileForm user={user} />
    </div>
  );
}
