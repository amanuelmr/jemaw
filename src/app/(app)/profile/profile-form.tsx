"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { authClient } from "@/lib/auth-client";
import { uploadAvatar } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Please select a JPEG, PNG, or WebP image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    let imageUrl: string | undefined;
    if (avatarFile) {
      setUploading(true);
      try {
        imageUrl = await uploadAvatar(avatarFile);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    startTransition(async () => {
      try {
        const result = await updateProfile({ name, image: imageUrl ?? (user.image || undefined) });
        toast.success(result.message);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update profile");
      }
    });
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPasswordPending(true);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword });
      if (result.error) throw new Error(result.error.message);
      toast.success("Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordPending(false);
    }
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isLoading = uploading || isPending;

  return (
    <div className="border-t">
      <section className="grid gap-5 border-b py-7 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10">
        <div>
          <h2 className="text-sm font-semibold">Profile photo</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Shown beside your expenses, payments, and comments.</p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border bg-card">
            {avatarPreview && <AvatarImage src={avatarPreview} alt={user.name} />}
            <AvatarFallback className="bg-secondary text-base font-semibold text-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Camera className="size-3.5" />
              Choose photo
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, or WebP. Maximum 5 MB.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
        </div>
      </section>

      <form onSubmit={handleProfileSave} className="grid gap-5 border-b py-7 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10">
        <div>
          <h2 className="text-sm font-semibold">Public details</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Your display name is visible to everyone in your groups.</p>
        </div>
        <div className="max-w-lg space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-[10px] text-muted-foreground">Your email stays private and cannot be changed here.</p>
            </div>
            <div className="pt-1">
              <Button type="submit" disabled={isLoading}>
                {uploading ? "Uploading…" : isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
        </div>
      </form>

      <section className="border-b">
          <button
            type="button"
            onClick={() => setPasswordOpen((v) => !v)}
            className="grid w-full gap-3 py-6 text-left transition-colors hover:text-foreground sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10"
          >
            <span className="text-sm font-semibold">Password</span>
            <span className="flex items-center justify-between text-sm text-muted-foreground">
              Use a unique password with at least eight characters.
              <span className="ml-4 flex shrink-0 items-center gap-1 font-medium text-foreground">
                {passwordOpen ? "Close" : "Change"}
                {passwordOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </span>
            </span>
          </button>
          {passwordOpen && (
            <form onSubmit={handlePasswordChange} className="grid gap-5 border-t py-7 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10">
              <div />
              <div className="max-w-lg space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">Current password</Label>
                <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw">New password</Label>
                <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw">Confirm new password</Label>
                <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <div className="pt-1">
                <Button type="submit" disabled={passwordPending}>
                  {passwordPending ? "Changing…" : "Change password"}
                </Button>
              </div>
              </div>
            </form>
          )}
      </section>
    </div>
  );
}
