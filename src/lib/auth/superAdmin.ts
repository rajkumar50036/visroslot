import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { type NextRequest } from "next/server";

export const SUPER_ADMIN_EMAIL = "rajkumar50036@gmail.com";
export const SUPER_ADMIN_UID = "vMZQTGlYSfM8adohQAZmSE3cNX02";

export interface SuperAdminSessionResult {
  isAuthorized: boolean;
  uid?: string;
  email?: string;
  role?: string;
  reason?: string;
}

export interface AdminAuditEntry {
  id?: string;
  admin_uid: string;
  admin_email: string;
  action: string;
  target_record?: string;
  target_type?: "business" | "subscription" | "payment" | "user" | "system" | "session";
  outcome: "SUCCESS" | "FAILURE";
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Server-side authorization check for Super Admin requests.
 * Checks both session cookies and Firestore verification.
 */
export async function verifySuperAdminSession(
  request: Request | NextRequest
): Promise<SuperAdminSessionResult> {
  try {
    // 1. Extract cookie from Request or NextRequest headers
    let sessionToken: string | undefined;

    if ("cookies" in request && typeof (request as any).cookies?.get === "function") {
      sessionToken =
        (request as any).cookies.get("visroslot_admin_session")?.value ||
        (request as any).cookies.get("visroslot_session")?.value;
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/visroslot_admin_session=([^;]+)/) ||
        cookieHeader.match(/visroslot_session=([^;]+)/);
      sessionToken = match ? match[1] : undefined;
    }

    if (!sessionToken) {
      return { isAuthorized: false, reason: "NO_SESSION_COOKIE" };
    }

    // 2. Direct UID validation for authorized Super Admin
    if (sessionToken === SUPER_ADMIN_UID) {
      return {
        isAuthorized: true,
        uid: SUPER_ADMIN_UID,
        email: SUPER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
      };
    }

    // 3. Fallback verification against Firestore Users collection via Firebase Admin SDK
    const { db } = getFirebaseAdmin();
    if (db) {
      const userDoc = await db.collection("users").doc(sessionToken).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        const userEmail = (u?.email || "").toLowerCase().trim();
        // Strict Security Guard: Never grant Super Admin through unverified role flags
        const isSuperAdmin =
          sessionToken === SUPER_ADMIN_UID ||
          userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

        if (isSuperAdmin) {
          return {
            isAuthorized: true,
            uid: sessionToken,
            email: userEmail || SUPER_ADMIN_EMAIL,
            role: "SUPER_ADMIN",
          };
        }
      }
    }

    return { isAuthorized: false, reason: "UNAUTHORIZED_ACCOUNT" };
  } catch (err: any) {
    console.error("Super Admin verification error:", err);
    return { isAuthorized: false, reason: "VERIFICATION_ERROR" };
  }
}

/**
 * Log an immutable Super Admin audit event in Firestore.
 */
export async function logAdminAudit(entry: Omit<AdminAuditEntry, "created_at">) {
  try {
    const { db } = getFirebaseAdmin();
    if (!db) return;

    const auditDoc: AdminAuditEntry = {
      ...entry,
      created_at: new Date().toISOString(),
    };

    await db.collection("admin_audit_logs").add(auditDoc);
  } catch (err) {
    console.error("Failed to write admin audit log:", err);
  }
}
