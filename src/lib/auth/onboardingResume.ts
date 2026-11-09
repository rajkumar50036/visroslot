import { Firestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { OWNER_EMAIL } from "@/lib/auth/userBusiness";

export interface OnboardingResumeState {
  userId: string;
  userEmail: string;
  hasSubscription: boolean;
  isSubscriptionActive: boolean;
  hasBusiness: boolean;
  businessId: string | null;
  businessSlug: string | null;
  businessName: string | null;
  hasServices: boolean;
  hasStaff: boolean;
  hasHours: boolean;
  onboardingComplete: boolean;
  nextStep: "account" | "plan" | "profile" | "services" | "staff" | "hours" | "settings" | "review" | "dashboard" | "expired";
  nextRoute: string;
  stepNumber: number;
}

/**
 * Calculates the exact resume state and destination route for any authenticated customer.
 * Guarantees a customer resumes exactly where they stopped, without repeating steps or losing work.
 */
export async function getOnboardingResumeState(
  db: Firestore,
  uid: string,
  emailHint?: string | null
): Promise<OnboardingResumeState> {
  const result: OnboardingResumeState = {
    userId: uid,
    userEmail: emailHint || "",
    hasSubscription: false,
    isSubscriptionActive: false,
    hasBusiness: false,
    businessId: null,
    businessSlug: null,
    businessName: null,
    hasServices: false,
    hasStaff: false,
    hasHours: false,
    onboardingComplete: false,
    nextStep: "plan",
    nextRoute: "/onboarding?step=plan",
    stepNumber: 2,
  };

  if (!uid || !db) return result;

  try {
    // 1. Inspect user record
    const userSnap = await getDoc(doc(db, "users", uid));
    const userData = userSnap.exists() ? userSnap.data() : null;
    const userEmail = (userData?.email || emailHint || "").toLowerCase().trim();
    result.userEmail = userEmail;

    const isPlatformOwner =
      userEmail === OWNER_EMAIL ||
      (userData?.role === "OWNER" && userData?.lifetime_free === true);

    if (isPlatformOwner) {
      result.hasSubscription = true;
      result.isSubscriptionActive = true;
      result.onboardingComplete = true;
      result.nextStep = "dashboard";
      result.nextRoute = "/app/overview";
      result.stepNumber = 8;
      return result;
    }

    // 2. Inspect Business Record
    let busSnap = await getDocs(
      query(collection(db, "businesses"), where("owner_id", "==", uid))
    );

    if (busSnap.empty && userEmail) {
      busSnap = await getDocs(
        query(collection(db, "businesses"), where("owner_email", "==", userEmail))
      );
    }

    if (!busSnap.empty) {
      const bDoc = busSnap.docs[0];
      const bData = bDoc.data();
      result.hasBusiness = true;
      result.businessId = bDoc.id;
      result.businessSlug = bData.slug || null;
      result.businessName = bData.name || null;
      if (bData.onboarding_complete === true) {
        result.onboardingComplete = true;
      }
    }

    // 3. Inspect Subscription / Plan Selection
    let subDocData: any = null;
    if (result.businessId) {
      const subSnap = await getDocs(
        query(collection(db, "subscriptions"), where("business_id", "==", result.businessId))
      );
      if (!subSnap.empty) {
        subDocData = subSnap.docs[0].data();
      }
    }

    if (!subDocData) {
      const userSubSnap = await getDocs(
        query(collection(db, "subscriptions"), where("user_id", "==", uid))
      );
      if (!userSubSnap.empty) {
        subDocData = userSubSnap.docs[0].data();
      }
    }

    const rawSubStatus = String(userData?.subscription_status || userData?.subscriptionStatus || "").toLowerCase();
    const rawAccountStatus = String(userData?.accountStatus || "").toLowerCase();
    const subDocStatus = String(subDocData?.status || subDocData?.subscriptionStatus || "").toLowerCase();

    const isSubDocActive = Boolean(
      subDocData &&
      ["active", "trialing", "authenticated"].includes(subDocStatus) &&
      (!subDocData.expires_at || new Date(subDocData.expires_at) >= new Date())
    );

    const hasActivePlan = Boolean(
      isPlatformOwner ||
      isSubDocActive ||
      userData?.payment_verified === true ||
      userData?.payment_verified === "true" ||
      userData?.payment_verified === "verified" ||
      userData?.paymentVerified === true ||
      userData?.paymentVerified === "true" ||
      rawAccountStatus === "trial_active" ||
      rawAccountStatus === "active" ||
      ["active", "trialing", "authenticated"].includes(rawSubStatus) ||
      Boolean(userData?.plan && (userData?.payment_verified || userData?.paymentVerified || rawSubStatus === "trialing" || rawSubStatus === "active"))
    );

    result.hasSubscription = hasActivePlan;
    result.isSubscriptionActive = hasActivePlan;

    // Step 2: Plan Selection (ONLY for unverified users without an active plan)
    if (!hasActivePlan) {
      result.nextStep = "plan";
      result.nextRoute = "/onboarding?step=plan";
      result.stepNumber = 2;
      return result;
    }

    // Step 3: Business Profile (if user has active plan but hasn't created business yet)
    if (!result.hasBusiness || !result.businessSlug) {
      result.nextStep = "profile";
      result.nextRoute = "/onboarding?step=profile";
      result.stepNumber = 3;
      return result;
    }

    // Check services, staff, and hours
    const [servicesSnap, staffSnap, hoursSnap] = await Promise.all([
      getDocs(query(collection(db, "services"), where("business_id", "==", result.businessId))),
      getDocs(query(collection(db, "staff"), where("business_id", "==", result.businessId))),
      getDocs(query(collection(db, "business_hours"), where("business_id", "==", result.businessId))),
    ]);

    result.hasServices = !servicesSnap.empty;
    result.hasStaff = !staffSnap.empty;
    result.hasHours = !hoursSnap.empty;

    // Step 4: Services
    if (!result.hasServices) {
      result.nextStep = "services";
      result.nextRoute = "/onboarding?step=services";
      result.stepNumber = 4;
      return result;
    }

    // Step 5: Staff
    if (!result.hasStaff) {
      result.nextStep = "staff";
      result.nextRoute = "/onboarding?step=staff";
      result.stepNumber = 5;
      return result;
    }

    // Step 6: Working Hours
    if (!result.hasHours) {
      result.nextStep = "hours";
      result.nextRoute = "/onboarding?step=hours";
      result.stepNumber = 6;
      return result;
    }

    // If user marked onboarding complete
    if (result.onboardingComplete || userData?.onboarding_complete === true) {
      result.nextStep = "dashboard";
      result.nextRoute = "/app/overview";
      result.stepNumber = 8;
      return result;
    }

    // Otherwise show Step 8: Review & Finish
    result.nextStep = "review";
    result.nextRoute = "/onboarding?step=review";
    result.stepNumber = 8;
    return result;
  } catch (err) {
    console.error("Error computing onboarding resume state:", err);
    return result;
  }
}
