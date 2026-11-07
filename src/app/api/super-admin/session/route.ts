import { NextResponse } from "next/server";
import {
  verifySuperAdminSession,
  logAdminAudit,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_UID,
} from "@/lib/auth/superAdmin";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const result = await verifySuperAdminSession(request);

  if (!result.isAuthorized) {
    return NextResponse.json({ authenticated: false, reason: result.reason }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      uid: result.uid,
      email: result.email,
      role: result.role,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { uid, email, idToken } = body;

    // Decode idToken payload if provided
    if (idToken && typeof idToken === "string") {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          if (payload.sub && !uid) uid = payload.sub;
          if (payload.email && !email) email = payload.email;
        }
      } catch (e) {
        console.warn("Failed to parse idToken payload:", e);
      }
    }

    const normalizedEmail = (email || "").toLowerCase().trim();

    // Verify authorized administrator identity
    const isAuthorizedEmail = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const isAuthorizedUid = uid === SUPER_ADMIN_UID;

    if (!isAuthorizedEmail && !isAuthorizedUid) {
      await logAdminAudit({
        admin_uid: uid || "UNKNOWN",
        admin_email: normalizedEmail || "UNKNOWN",
        action: "ADMIN_LOGIN_REJECTED",
        target_type: "session",
        outcome: "FAILURE",
        metadata: { reason: "EMAIL_OR_UID_NOT_AUTHORIZED", attemptedEmail: normalizedEmail, attemptedUid: uid },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });

      return NextResponse.json(
        { error: "Access Restricted: You are not authorized to access the Super Admin console." },
        { status: 403 }
      );
    }

    const activeUid = uid || SUPER_ADMIN_UID;

    // Verify Firestore User Record
    const { db } = getFirebaseAdmin();
    if (db && uid) {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          id: uid,
          email: normalizedEmail,
          role: "SUPER_ADMIN",
          is_super_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        await userRef.update({
          role: "SUPER_ADMIN",
          is_super_admin: true,
          last_admin_login: new Date().toISOString(),
        });
      }
    }

    // Set secure admin session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        uid: activeUid,
        email: SUPER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
      },
    });

    // Set 7-day session cookie
    response.cookies.set("visroslot_admin_session", activeUid, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      httpOnly: false, // Accessible to client auth guards
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("visroslot_session", activeUid, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    // Record login in immutable audit log
    await logAdminAudit({
      admin_uid: activeUid,
      admin_email: SUPER_ADMIN_EMAIL,
      action: "ADMIN_LOGIN",
      target_type: "session",
      outcome: "SUCCESS",
      metadata: { login_method: idToken ? "FIREBASE_TOKEN" : "PASSWORD" },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return response;
  } catch (err: any) {
    console.error("Super Admin session error:", err);
    return NextResponse.json({ error: "Failed to establish admin session." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const result = await verifySuperAdminSession(request);

  if (result.isAuthorized && result.uid) {
    await logAdminAudit({
      admin_uid: result.uid,
      admin_email: result.email || SUPER_ADMIN_EMAIL,
      action: "ADMIN_LOGOUT",
      target_type: "session",
      outcome: "SUCCESS",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("visroslot_admin_session");
  return response;
}
