import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export const dynamic = "force-dynamic";

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

// 5MB maximum file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const authCookie =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value;

    if (!authCookie) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please sign in to upload images." },
        { status: 401 }
      );
    }

    const userId = authCookie;
    const { app, db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "DATABASE_UNAVAILABLE", message: "Database temporarily unavailable." },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "customer_profile"; // "business_logo" | "owner_profile" | "customer_profile"
    const businessId = (formData.get("businessId") as string) || null;

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE", message: "Please select an image file to upload." },
        { status: 400 }
      );
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE", message: "Image must be smaller than 5MB." },
        { status: 400 }
      );
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "INVALID_MIME_TYPE",
          message: "Unsupported file format. Please upload JPEG, PNG, WebP or SVG.",
        },
        { status: 400 }
      );
    }

    // 3. Ownership Authorization
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const userEmail = (userData?.email || "").toLowerCase().trim();
    const isPlatformOwner = userEmail === OWNER_EMAIL;

    let targetBusinessId: string | null = null;

    if (uploadType === "business_logo") {
      let authorized = isPlatformOwner;

      if (businessId) {
        const busDoc = await db.collection("businesses").doc(businessId).get();
        if (busDoc.exists) {
          const bData = busDoc.data();
          if (bData?.owner_id === userId || bData?.owner_email?.toLowerCase() === userEmail) {
            authorized = true;
            targetBusinessId = businessId;
          }
        }
      } else {
        // Fallback: look up user's personal business
        const busSnap = await db.collection("businesses").where("owner_id", "==", userId).limit(1).get();
        if (!busSnap.empty) {
          authorized = true;
          targetBusinessId = busSnap.docs[0].id;
        }
      }

      if (!authorized) {
        return NextResponse.json(
          { error: "FORBIDDEN", message: "You do not have permission to manage this business logo." },
          { status: 403 }
        );
      }
    }

    // 4. File Buffer & Safe Storage Path
    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const timestamp = Date.now();

    let storagePath = "";
    if (uploadType === "business_logo" && targetBusinessId) {
      storagePath = `businesses/${targetBusinessId}/logo/${timestamp}_logo.${sanitizedExt}`;
    } else if (uploadType === "owner_profile") {
      storagePath = `users/${userId}/owner_profile/${timestamp}_avatar.${sanitizedExt}`;
    } else {
      storagePath = `users/${userId}/customer_profile/${timestamp}_avatar.${sanitizedExt}`;
    }

    let downloadUrl = "";

    // 5. Try Upload via Firebase Admin Storage
    try {
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "visroslot.firebasestorage.app";
      const bucket = app ? getStorage(app).bucket(bucketName) : getStorage().bucket(bucketName);
      const storageFile = bucket.file(storagePath);

      await storageFile.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: userId,
            uploadType,
            businessId: targetBusinessId || "",
          },
        },
      });

      // Make file public or generate download token
      try {
        await storageFile.makePublic();
        downloadUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
      } catch (publicErr) {
        // Fallback to Firebase Storage firebasestorage.googleapis.com format
        downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
      }
    } catch (storageErr: any) {
      console.warn("Storage upload fallback to base64 data URI:", storageErr.message);
      // Fallback: if Firebase Storage credentials are not fully configured with service account permissions,
      // create safe inline base64 data URI so user is NEVER blocked!
      downloadUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    const nowIso = new Date().toISOString();

    // 6. Update Firestore Records with centralized image reference
    if (uploadType === "business_logo" && targetBusinessId) {
      await db.collection("businesses").doc(targetBusinessId).update({
        logo_url: downloadUrl,
        logoUrl: downloadUrl,
        updated_at: nowIso,
        updatedAt: nowIso,
      });
    } else if (uploadType === "owner_profile") {
      await db.collection("users").doc(userId).set(
        {
          ownerPhotoURL: downloadUrl,
          photoURL: downloadUrl,
          avatar_url: downloadUrl,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } else {
      await db.collection("users").doc(userId).set(
        {
          customerPhotoURL: downloadUrl,
          photoURL: downloadUrl,
          avatar_url: downloadUrl,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      type: uploadType,
      message: "Image uploaded and saved successfully.",
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: err.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
