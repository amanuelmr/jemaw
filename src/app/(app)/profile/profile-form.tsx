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
    <div className="overflow-hidden rounded-[28px] border border-[#d8d1c4] bg-[#fffdf7] shadow-[0_20px_60px_rgba(54,52,43,0.08)]">
      <div className="flex min-h-[520px] flex-col md:flex-row">
        <div className="paper-grid flex w-full shrink-0 flex-col bg-[#1d4f3f] px-6 py-8 text-[#fffaf0] sm:px-8 md:w-72 md:py-10">
          <div className="relative self-start">
            <Avatar className="w-20 h-20">
              {avatarPreview && <AvatarImage src={avatarPreview} alt={user.name} />}
              <AvatarFallback className="bg-[#f3c767] text-xl font-extrabold text-[#20231d]">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-[#f3c767] text-[#20231d] shadow-md transition-transform hover:scale-105"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-5 text-lg font-extrabold">{user.name}</p>
          <p className="mt-1 truncate text-xs text-[#bad0c5]">{user.email}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 cursor-pointer text-left text-xs font-extrabold text-[#f3c767] hover:underline"
          >
            Change photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-[#e1dacd] px-5 py-5 sm:px-8">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">What friends see</span>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-5 border-b border-[#e1dacd] px-5 py-7 sm:px-8">
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
          </form>

          <button
            type="button"
            onClick={() => setPasswordOpen((v) => !v)}
            className="flex w-full items-center justify-between border-b border-[#e1dacd] px-5 py-5 text-left transition-colors hover:bg-[#f8f4eb] sm:px-8"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#85877f]">Password & security</span>
            <span className="flex items-center gap-1 text-xs font-extrabold text-primary">
              {passwordOpen ? "Hide" : "Change password"}
              {passwordOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          {passwordOpen && (
            <form onSubmit={handlePasswordChange} className="space-y-5 px-5 py-7 sm:px-8">
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
