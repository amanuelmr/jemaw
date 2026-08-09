type UploadFolder = "payment-proofs" | "receipts" | "avatars";

export async function uploadImage(
  file: File,
  folder: UploadFolder = "payment-proofs"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = (await res.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || "Failed to upload image. Please try again.");
  }

  return data.url;
}

export const uploadPaymentProof = (file: File) => uploadImage(file, "payment-proofs");
export const uploadReceipt = (file: File) => uploadImage(file, "receipts");
export const uploadAvatar = (file: File) => uploadImage(file, "avatars");
