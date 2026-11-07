import { getFirebaseClient } from "@/lib/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export interface UploadOptions {
  file: File;
  type: "business_logo" | "owner_profile" | "customer_profile";
  businessId?: string;
  userId?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface UploadResult {
  url: string;
  success: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImageWithProgress({
  file,
  type,
  businessId,
  userId,
  onProgress,
}: UploadOptions): Promise<UploadResult> {
  // 1. Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds maximum allowed size of 5MB.");
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file format. Please upload JPEG, PNG, WebP or SVG.");
  }

  onProgress?.(10);

  // 2. Try Client Firebase Storage Upload
  try {
    const { storage, auth } = getFirebaseClient();
    const currentUid = userId || auth?.currentUser?.uid;

    if (storage && currentUid) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const timestamp = Date.now();
      let path = "";

      if (type === "business_logo" && businessId) {
        path = `businesses/${businessId}/logo/${timestamp}_${sanitizedName}`;
      } else if (type === "owner_profile") {
        path = `users/${currentUid}/owner_profile/${timestamp}_${sanitizedName}`;
      } else {
        path = `users/${currentUid}/customer_profile/${timestamp}_${sanitizedName}`;
      }

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      const url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(Math.round(progress));
          },
          (error) => {
            console.warn("Client storage upload failed, falling back to server route:", error);
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });

      return { url, success: true };
    }
  } catch (clientErr) {
    console.warn("Falling back to server upload route:", clientErr);
  }

  // 3. Fallback: Server Upload Route via /api/upload
  onProgress?.(40);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  if (businessId) formData.append("businessId", businessId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  onProgress?.(90);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to upload image.");
  }

  onProgress?.(100);
  return { url: data.url, success: true };
}
