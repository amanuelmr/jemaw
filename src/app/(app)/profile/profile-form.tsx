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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex min-h-[480px]">
        {/* Left identity panel */}
        <div className="w-64 shrink-0 border-r border-slate-200 px-8 py-8 flex flex-col">
          <div className="relative self-start">
            <Avatar className="w-20 h-20">
              {avatarPreview && <AvatarImage src={avatarPreview} alt={user.name} />}
              <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700 font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">{user.name}</p>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{user.email}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 hover:underline text-left cursor-pointer"
          >
            Change photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Right settings panel */}
        <div className="flex-1 min-w-0">
          {/* Section 1: Personal information */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal information</span>
          </div>
          <form onSubmit={handleProfileSave} className="px-8 py-6 space-y-5 border-b border-slate-100">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-slate-700">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Email</Label>
              <Input value={user.email} disabled className="h-9 bg-slate-50 text-slate-400" />
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>
            <div className="pt-1">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={isLoading}>
                {uploading ? "Uploading…" : isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>

          {/* Section 2: Security */}
          <button
            type="button"
            onClick={() => setPasswordOpen((v) => !v)}
            className="w-full flex items-center justify-between px-8 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-left"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security</span>
            <span className="text-xs text-indigo-600 flex items-center gap-1">
              {passwordOpen ? "Hide" : "Change password"}
              {passwordOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>
          {passwordOpen && (
            <form onSubmit={handlePasswordChange} className="px-8 py-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw" className="text-xs font-medium text-slate-700">Current password</Label>
                <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw" className="text-xs font-medium text-slate-700">New password</Label>
                <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw" className="text-xs font-medium text-slate-700">Confirm new password</Label>
                <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-9" />
              </div>
              <div className="pt-1">
                <Button type="submit" size="sm" className="h-8 text-xs" disabled={passwordPending}>
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
