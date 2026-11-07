import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";
import { getDocumentRest, fetchCollectionRest } from "@/lib/firebase/firestoreRest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCookie =
      req.cookies.get("visroslot_session")?.value ||
      req.cookies.get("slotora_session")?.value;

    const { db } = getFirebaseAdmin();

    if (!authCookie) {
      return NextResponse.json({
        authenticated: false,
        nextRoute: "/login",
      });
    }

    const uid = authCookie;
    let userData: any = null;

    if (db) {
      try {
        const userDoc = await db.collection("users").doc(uid).get();
        userData = userDoc.exists ? userDoc.data() : null;
      } catch (uErr) {
        userData = await getDocumentRest("users", uid);
      }
    } else {
      userData = await getDocumentRest("users", uid);
    }
    const userEmail = (userData?.email || "").toLowerCase().trim();

    const isPlatformOwner =
      userEmail === OWNER_EMAIL ||
      (userData?.role === "OWNER" && userData?.lifetime_free === true);

    if (isPlatformOwner) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        isFounder: true,
        nextStep: "dashboard",
        nextRoute: "/app/overview",
        stepNumber: 8,
        hasSubscription: true,
        isSubscriptionActive: true,
      });
    }

    // Check business record
    let business: any = null;
    if (db) {
      try {
        let busSnap = await db.collection("businesses").where("owner_id", "==", uid).limit(1).get();
        if (busSnap.empty && userEmail) {
          busSnap = await db.collection("businesses").where("owner_email", "==", userEmail).limit(1).get();
        }
        business = !busSnap.empty ? { id: busSnap.docs[0].id, ...busSnap.docs[0].data() } : null;
      } catch (bErr) {
        console.warn("Admin bus fetch warning:", bErr);
      }
    }

    if (!business) {
      const allBiz = await fetchCollectionRest("businesses");
      business = allBiz.find(
        (b: any) =>
          b.owner_id === uid ||
          b.ownerUid === uid ||
          (userEmail && (b.owner_email || "").toLowerCase() === userEmail)
      );
    }

    // Check plan selection & subscription
    const hasPlanSelected = Boolean(
      userData?.plan ||
      userData?.selected_plan ||
      userData?.subscription_status === "TRIALING" ||
      userData?.subscription_status === "active"
    );

    let subData: any = null;
    if (db) {
      try {
        if (business) {
          const subSnap = await db.collection("subscriptions").where("business_id", "==", business.id).limit(1).get();
          if (!subSnap.empty) {
            subData = subSnap.docs[0].data();
          }
        }

        if (!subData) {
          const userSubSnap = await db.collection("subscriptions").where("user_id", "==", uid).limit(1).get();
          if (!userSubSnap.empty) {
            subData = userSubSnap.docs[0].data();
          }
        }
      } catch (sErr) {
        console.warn("Admin sub fetch warning:", sErr);
      }
    }

    const isSubActive = hasPlanSelected || Boolean(subData);

    // Step 2: Plan Selection
    if (!hasPlanSelected && !subData) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: userData?.plan || "professional",
        billingCycle: userData?.billing_cycle || "monthly",
        hasSubscription: false,
        isSubscriptionActive: false,
        nextStep: "plan",
        nextRoute: "/onboarding?step=plan",
        stepNumber: 2,
      });
    }

    // Step 3: Business Profile
    if (!business || !business.slug) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: userData?.plan || subData?.plan || "professional",
        billingCycle: userData?.billing_cycle || "monthly",
        hasSubscription: true,
        isSubscriptionActive: isSubActive,
        nextStep: "profile",
        nextRoute: "/onboarding?step=profile",
        stepNumber: 3,
      });
    }

    // Check services, staff, and hours
    let hasServices = false;
    let hasStaff = false;
    let hasHours = false;

    if (db) {
      try {
        const [servicesSnap, staffSnap, hoursSnap] = await Promise.all([
          db.collection("services").where("business_id", "==", business.id).limit(1).get(),
          db.collection("staff").where("business_id", "==", business.id).limit(1).get(),
          db.collection("business_hours").where("business_id", "==", business.id).limit(1).get(),
        ]);
        hasServices = !servicesSnap.empty;
        hasStaff = !staffSnap.empty;
        hasHours = !hoursSnap.empty;
      } catch (checkErr) {
        console.warn("Admin check warning in resume:", checkErr);
      }
    } else {
      const [allServices, allStaff, allHours] = await Promise.all([
        fetchCollectionRest("services"),
        fetchCollectionRest("staff"),
        fetchCollectionRest("business_hours"),
      ]);
      hasServices = allServices.some((s: any) => s.business_id === business.id);
      hasStaff = allStaff.some((st: any) => st.business_id === business.id);
      hasHours = allHours.some((h: any) => h.business_id === business.id);
    }

    // Step 4: Services
    if (!hasServices) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: business.plan || userData?.plan || "professional",
        billingCycle: userData?.billing_cycle || "monthly",
        hasSubscription: true,
        isSubscriptionActive: isSubActive,
        hasBusiness: true,
        businessId: business.id,
        businessSlug: business.slug,
        businessName: business.name,
        nextStep: "services",
        nextRoute: "/onboarding?step=services",
        stepNumber: 4,
      });
    }

    // Step 5: Staff
    if (!hasStaff) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: business.plan || userData?.plan || "professional",
        billingCycle: userData?.billing_cycle || "monthly",
        hasSubscription: true,
        isSubscriptionActive: isSubActive,
        hasBusiness: true,
        businessId: business.id,
        businessSlug: business.slug,
        businessName: business.name,
        hasServices: true,
        nextStep: "staff",
        nextRoute: "/onboarding?step=staff",
        stepNumber: 5,
      });
    }

    // Step 6: Working Hours
    if (!hasHours) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: business.plan || userData?.plan || "professional",
        billingCycle: userData?.billing_cycle || "monthly",
        hasSubscription: true,
        isSubscriptionActive: isSubActive,
        hasBusiness: true,
        businessId: business.id,
        businessSlug: business.slug,
        businessName: business.name,
        hasServices: true,
        hasStaff: true,
        nextStep: "hours",
        nextRoute: "/onboarding?step=hours",
        stepNumber: 6,
      });
    }

    // If marked onboarding complete
    if (business.onboarding_complete || userData?.onboarding_complete) {
      return NextResponse.json({
        authenticated: true,
        uid,
        email: userEmail,
        plan: business.plan || userData?.plan || "professional",
        hasSubscription: true,
        isSubscriptionActive: isSubActive,
        hasBusiness: true,
        businessId: business.id,
        businessSlug: business.slug,
        businessName: business.name,
        hasServices: true,
        hasStaff: true,
        nextStep: "dashboard",
        nextRoute: "/app/overview",
        stepNumber: 8,
      });
    }

    // Step 8: Review & Finish
    return NextResponse.json({
      authenticated: true,
      uid,
      email: userEmail,
      plan: business.plan || userData?.plan || "professional",
      billingCycle: userData?.billing_cycle || "monthly",
      hasSubscription: true,
      isSubscriptionActive: isSubActive,
      hasBusiness: true,
      businessId: business.id,
      businessSlug: business.slug,
      businessName: business.name,
      hasServices: true,
      hasStaff: true,
      nextStep: "review",
      nextRoute: "/onboarding?step=review",
      stepNumber: 8,
    });
  } catch (err: any) {
    console.error("Error in onboarding resume endpoint:", err);
    return NextResponse.json({ error: "Failed to resolve resume state", details: err.message }, { status: 500 });
  }
}
