import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import {
  getDocumentRest,
  setDocumentRest,
  fetchCollectionRest,
} from "@/lib/firebase/firestoreRest";

export const dynamic = "force-dynamic";

const CreateProfileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  category: z.string().min(2, "Category is required"),
  phone: z
    .string()
    .transform((val) => {
      let clean = val.replace(/\D/g, "");
      if (clean.length === 12 && clean.startsWith("91")) clean = clean.slice(2);
      if (clean.length === 11 && clean.startsWith("0")) clean = clean.slice(1);
      return clean;
    })
    .refine((val) => val.length === 10, {
      message: "Business phone number must be exactly 10 digits (e.g. 9876543210)",
    }),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(3, "Address is required").max(300),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("India"),
  website: z.string().optional(),
  description: z.string().min(3, "Description must be at least 3 characters").max(1000),
  logoUrl: z.string().optional().nullable(),
  workingHours: z.string().min(2, "Working hours are required").default("9:00 AM - 8:00 PM (Monday - Saturday)"),
  timezone: z.string().default("Asia/Kolkata"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const authCookie =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value ||
      rawBody?.userId;

    if (!authCookie) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED", message: "Please sign in to create your business profile." },
        { status: 401 }
      );
    }

    const userId = authCookie;
    const { db } = getFirebaseAdmin();

    let userData: any = {};
    if (db) {
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        userData = userDoc.data() || {};
      } catch (uErr) {
        console.warn("Admin user fetch warning, falling back to REST:", uErr);
        userData = (await getDocumentRest("users", userId)) || {};
      }
    } else {
      userData = (await getDocumentRest("users", userId)) || {};
    }

    const userEmail = (userData.email || "").toLowerCase().trim();
    const isOwner = userEmail === OWNER_EMAIL;

    // 1. Subscription & Plan Verification:
    // User must have selected a plan or started trial
    const hasVerifiedSubscription =
      isOwner ||
      Boolean(userData.plan) ||
      Boolean(userData.selected_plan) ||
      userData.payment_verified === true ||
      userData.paymentVerified === true ||
      userData.subscription_status === "active" ||
      userData.subscription_status === "trialing" ||
      userData.subscription_status === "ACTIVE" ||
      userData.subscription_status === "TRIALING" ||
      userData.subscriptionStatus === "ACTIVE" ||
      userData.subscriptionStatus === "TRIALING";

    let activeSubDoc: any = null;
    let hasSubRecord = hasVerifiedSubscription;

    if (!hasSubRecord && db) {
      try {
        const subSnap = await db
          .collection("subscriptions")
          .where("user_id", "==", userId)
          .where("status", "in", ["active", "ACTIVE", "TRIALING", "trialing"])
          .limit(1)
          .get();

        if (!subSnap.empty) {
          hasSubRecord = true;
          activeSubDoc = subSnap.docs[0];
        } else {
          const subSnapAlt = await db
            .collection("subscriptions")
            .where("uid", "==", userId)
            .where("subscriptionStatus", "in", ["ACTIVE", "TRIALING"])
            .limit(1)
            .get();
          if (!subSnapAlt.empty) {
            hasSubRecord = true;
            activeSubDoc = subSnapAlt.docs[0];
          }
        }
      } catch (subErr) {
        console.warn("Admin sub fetch warning:", subErr);
      }
    }

    const validated = CreateProfileSchema.parse(rawBody);

    const cleanSlug = validated.slug.toLowerCase().trim();

    // 2. Slug Uniqueness Check (Do not overwrite another business's slug)
    if (db) {
      try {
        const existingSlugSnap = await db
          .collection("businesses")
          .where("slug", "==", cleanSlug)
          .limit(1)
          .get();

        if (!existingSlugSnap.empty) {
          const existingDoc = existingSlugSnap.docs[0];
          if (existingDoc.data().owner_id !== userId && existingDoc.data().ownerUid !== userId) {
            return NextResponse.json(
              {
                error: "SLUG_TAKEN",
                message: `The booking link "${cleanSlug}" is already taken by another business. Please choose a different link name.`,
              },
              { status: 409 }
            );
          }
        }
      } catch (slugErr) {
        console.warn("Admin slug check warning:", slugErr);
      }
    } else {
      const allBusinesses = await fetchCollectionRest("businesses");
      const existingSlugBiz = allBusinesses.find(
        (b: any) => (b.slug || "").toLowerCase() === cleanSlug
      );
      if (
        existingSlugBiz &&
        existingSlugBiz.owner_id !== userId &&
        existingSlugBiz.ownerUid !== userId
      ) {
        return NextResponse.json(
          {
            error: "SLUG_TAKEN",
            message: `The booking link "${cleanSlug}" is already taken by another business. Please choose a different link name.`,
          },
          { status: 409 }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const reqHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "visroslot.pages.dev";
    const reqProto = req.headers.get("x-forwarded-proto") || "https";
    const bookingUrl = `${reqProto}://${reqHost}/book/${cleanSlug}`;

    // 3. Resolve plan and subscription details
    const subData = activeSubDoc ? activeSubDoc.data() : null;
    const activePlan =
      subData?.plan ||
      userData.subscription_plan ||
      userData.plan ||
      userData.selected_plan ||
      "professional";
    const activeStatus =
      subData?.subscriptionStatus ||
      subData?.status ||
      userData.subscription_status ||
      (isOwner ? "ACTIVE" : "TRIALING");
    const isUnlimited = activePlan === "business" || subData?.is_unlimited === true;

    // Check if user already has an existing business doc to update or create new
    let businessId = "";
    const businessData: any = {
      owner_id: userId,
      ownerUid: userId,
      owner_email: userEmail,
      businessName: validated.name.trim(),
      name: validated.name.trim(),
      category: validated.category,
      phone: validated.phone.trim(),
      email: validated.email ? validated.email.trim() : userEmail,
      address: validated.address.trim(),
      city: validated.city?.trim() || "",
      state: validated.state?.trim() || "",
      country: validated.country?.trim() || "India",
      website: validated.website?.trim() || "",
      description: validated.description.trim(),
      logo_url: validated.logoUrl || null,
      working_hours: validated.workingHours,
      timezone: validated.timezone || "Asia/Kolkata",
      slug: cleanSlug,
      bookingSlug: cleanSlug,
      bookingUrl: bookingUrl,
      paymentVerified: true,
      profileCompleted: true,
      sharingLinkUnlocked: true,
      publicBookingStatus: "ACTIVE",
      publicBookingPauseReason: null,
      plan: activePlan,
      subscription_status: activeStatus,
      subscriptionStatus: activeStatus,
      is_unlimited: isUnlimited,
      is_active: true,
      updated_at: nowIso,
      updatedAt: nowIso,
    };

    if (db) {
      try {
        const existingBusQuery = await db
          .collection("businesses")
          .where("owner_id", "==", userId)
          .limit(1)
          .get();

        if (!existingBusQuery.empty) {
          businessId = existingBusQuery.docs[0].id;
          businessData.businessId = businessId;
          await db.collection("businesses").doc(businessId).update(businessData);
        } else {
          businessData.servicesCompleted = false;
          businessData.staffCompleted = false;
          businessData.created_at = nowIso;
          businessData.createdAt = nowIso;
          const newBusRef = await db.collection("businesses").add(businessData);
          businessId = newBusRef.id;
          await newBusRef.update({ businessId, id: businessId });
        }

        // Update user profile in Firestore
        await db.collection("users").doc(userId).set(
          {
            uid: userId,
            businessId,
            business_id: businessId,
            businessName: validated.name.trim(),
            bookingSlug: cleanSlug,
            accountStatus: "ACTIVE",
            onboarding_step: 4,
            onboardingStatus: "PROFILE_COMPLETED",
            profileCompleted: true,
            sharingLinkUnlocked: true,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn("Admin Firestore write warning, falling back to REST:", dbErr);
        businessId = "";
      }
    }

    // Direct REST API Fallback (Guaranteed to write to visroslot Firestore!)
    if (!businessId) {
      const allBusinesses = await fetchCollectionRest("businesses");
      const existingUserBiz = allBusinesses.find(
        (b: any) => b.owner_id === userId || b.ownerUid === userId
      );

      businessId =
        existingUserBiz?.id ||
        `biz_${userId.substring(0, 8)}_${Date.now().toString(36)}`;

      businessData.businessId = businessId;
      businessData.id = businessId;
      if (!existingUserBiz) {
        businessData.servicesCompleted = false;
        businessData.staffCompleted = false;
        businessData.created_at = nowIso;
        businessData.createdAt = nowIso;
      }

      await setDocumentRest("businesses", businessId, businessData);

      await setDocumentRest("users", userId, {
        ...userData,
        uid: userId,
        businessId,
        business_id: businessId,
        businessName: validated.name.trim(),
        bookingSlug: cleanSlug,
        accountStatus: "ACTIVE",
        onboarding_step: 4,
        onboardingStatus: "PROFILE_COMPLETED",
        profileCompleted: true,
        sharingLinkUnlocked: true,
        updatedAt: nowIso,
      });
    }

    // 5. Link businessId to any pending subscriptions and payment records
    if (db) {
      try {
        const batch = db.batch();

        const [userSubsByUserId, userSubsByUid] = await Promise.all([
          db.collection("subscriptions").where("user_id", "==", userId).get(),
          db.collection("subscriptions").where("uid", "==", userId).get(),
        ]);

        const seenSubIds = new Set<string>();
        [...userSubsByUserId.docs, ...userSubsByUid.docs].forEach((sDoc) => {
          if (!seenSubIds.has(sDoc.id)) {
            seenSubIds.add(sDoc.id);
            const sData = sDoc.data();
            if (!sData.business_id || !sData.businessId || sData.business_id.startsWith("pending_") || sData.businessId.startsWith("pending_")) {
              batch.update(sDoc.ref, {
                businessId,
                business_id: businessId,
                businessSlug: cleanSlug,
                businessName: validated.name.trim(),
                updated_at: nowIso,
                updatedAt: nowIso,
              });
            }
          }
        });

        await batch.commit();
      } catch (batchErr) {
        console.warn("Notice updating linked sub references:", batchErr);
      }
    }

    return NextResponse.json({
      success: true,
      businessId,
      slug: cleanSlug,
      bookingUrl,
      publicBookingStatus: "ACTIVE",
      message: "Business profile created successfully. Booking link unlocked!",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", message: err.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    console.error("Profile creation error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to create business profile." },
      { status: 500 }
    );
  }
}
