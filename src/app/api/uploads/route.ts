import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  ALLOWED_UPLOAD_FOLDERS,
  getCloudinaryConfig,
  isTrustedCloudinaryImageUrl,
  type UploadFolder,
} from "@/lib/uploads";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function isUploadFolder(value: string): value is UploadFolder {
  return (ALLOWED_UPLOAD_FOLDERS as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return error("You must sign in before uploading an image", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error("Invalid upload request", 400);
  }

  const file = formData.get("file");
  const folder = formData.get("folder");
  if (
    !(file instanceof File) ||
    typeof folder !== "string" ||
    !isUploadFolder(folder)
  ) {
    return error("A valid image and upload destination are required", 400);
  }

  const maxBytes = folder === "avatars" ? MAX_AVATAR_BYTES : MAX_UPLOAD_BYTES;
  if (file.size === 0 || file.size > maxBytes) {
    return error(`Image must be smaller than ${maxBytes / 1024 / 1024}MB`, 413);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return error("Only JPEG, PNG, and WebP images are supported", 415);
  }

  const signatureBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasValidImageSignature(signatureBytes, file.type)) {
    return error("The uploaded file does not match its image type", 415);
  }

  const { cloudName, uploadPreset, apiKey, apiSecret } = getCloudinaryConfig();
  if (!cloudName || (!uploadPreset && !(apiKey && apiSecret))) {
    return error("Image uploads are not configured", 503);
  }

  const cloudinaryFolder = `jemaw/${folder}`;
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("folder", cloudinaryFolder);

  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = `folder=${cloudinaryFolder}&timestamp=${timestamp}${apiSecret}`;
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", timestamp);
    uploadData.append("signature", createHash("sha1").update(toSign).digest("hex"));
  } else {
    uploadData.append("upload_preset", uploadPreset!);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body: uploadData }
  );
  const result = (await response.json().catch(() => null)) as
    | { secure_url?: string; resource_type?: string; error?: { message?: string } }
    | null;

  if (
    !response.ok ||
    result?.resource_type !== "image" ||
    !result.secure_url ||
    !isTrustedCloudinaryImageUrl(result.secure_url, folder)
  ) {
    console.error(
      "Cloudinary upload failed",
      response.status,
      result?.error?.message
    );
    return error("Failed to store the image", 502);
  }

  return NextResponse.json({ url: result.secure_url });
}
