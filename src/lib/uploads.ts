import "server-only";

export const ALLOWED_UPLOAD_FOLDERS = [
  "payment-proofs",
  "receipts",
  "avatars",
] as const;

export type UploadFolder = (typeof ALLOWED_UPLOAD_FOLDERS)[number];

export function getCloudinaryConfig() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET ??
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return {
    cloudName,
    uploadPreset,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function isTrustedCloudinaryImageUrl(
  value: string,
  folder?: UploadFolder
) {
  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) return false;

  try {
    const url = new URL(value);
    const isCloudinaryImage =
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`);

    return (
      isCloudinaryImage &&
      (!folder || url.pathname.includes(`/jemaw/${folder}/`))
    );
  } catch {
    return false;
  }
}
