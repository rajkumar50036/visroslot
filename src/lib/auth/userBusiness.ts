import { Firestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Business } from "@/types/database";

export interface UserBusinessContext {
  userId: string;
  userEmail: string;
  isOwner: boolean;
  isFounder: boolean;
  lifetimeFree: boolean;
  business: Business | null;
  subscription: any | null;
  plan: "professional" | "business";
}

export const OWNER_EMAIL = "rajkumar50036@gmail.com";

/**
 * Loads the authenticated user's strictly private business profile.
 * NEVER leaks or falls back to another user's business profile.
 */
export async function getUserPersonalBusiness(
  db: Firestore,
  uid: string,
  emailHint?: string | null
): Promise<UserBusinessContext> {
  const result: UserBusinessContext = {
    userId: uid,
    userEmail: emailHint || "",
    isOwner: false,
    isFounder: false,
    lifetimeFree: false,
    business: null,
    subscription: null,
    plan: "professional",
  };

  if (!uid) return result;

  try {
    // 1. Fetch User Record to verify Identity & Claims
    const userSnap = await getDoc(doc(db, "users", uid));
    const userData = userSnap.exists() ? userSnap.data() : null;
    const userEmail = (userData?.email || emailHint || "").toLowerCase().trim();
    result.userEmail = userEmail;

    const isPlatformOwner =
      userEmail === OWNER_EMAIL ||
      userData?.role === "OWNER" && userData?.lifetime_free === true;

    if (isPlatformOwner) {
      result.isOwner = true;
      result.isFounder = true;
      result.lifetimeFree = true;
      result.plan = "business";
    }

    // 2. Query Strictly by owner_id
    let busSnap = await getDocs(
      query(collection(db, "businesses"), where("owner_id", "==", uid))
    );

    // Fallback: If not found by UID, check if owner_email matches (for the verified user only)
    if (busSnap.empty && userEmail) {
      busSnap = await getDocs(
        query(collection(db, "businesses"), where("owner_email", "==", userEmail))
      );
    }

    // 3. Privacy Rule: If user has a business, load ONLY their business
    if (!busSnap.empty) {
      const bDoc = busSnap.docs[0];
      const bData = bDoc.data();
      result.business = { id: bDoc.id, ...bData } as Business;

      // 4. Load Subscription strictly for this business or user
      let subSnap = await getDocs(
        query(collection(db, "subscriptions"), where("business_id", "==", bDoc.id))
      );
      if (subSnap.empty) {
        subSnap = await getDocs(
          query(collection(db, "subscriptions"), where("user_id", "==", uid))
        );
      }
      if (subSnap.empty && userEmail) {
        subSnap = await getDocs(
          query(collection(db, "subscriptions"), where("user_email", "==", userEmail))
        );
      }
      if (!subSnap.empty) {
        result.subscription = subSnap.docs[0].data();
      }

      const sData = result.subscription;
      const subPlan = (sData?.plan || sData?.plan_id || "").toLowerCase();
      const busPlan = (bData.plan || "").toLowerCase();

      const isBusinessPlan =
        isPlatformOwner ||
        bData.lifetime_free === true ||
        bData.is_unlimited === true ||
        sData?.is_unlimited === true ||
        sData?.amount === 999 ||
        sData?.amount === 9990 ||
        busPlan.includes("business") ||
        busPlan.includes("999") ||
        subPlan.includes("business") ||
        subPlan.includes("999");

      if (isBusinessPlan) {
        result.plan = "business";
        if (isPlatformOwner || bData.lifetime_free) {
          result.lifetimeFree = true;
        }
      } else {
        result.plan = "professional";
      }
    } else {
      // User does NOT have a business yet, but MAY ALREADY HAVE A VERIFIED SUBSCRIPTION!
      result.business = null;

      // Query subscription directly by authenticated user_id
      const userSubSnap = await getDocs(
        query(collection(db, "subscriptions"), where("user_id", "==", uid))
      );

      if (!userSubSnap.empty) {
        result.subscription = userSubSnap.docs[0].data();
        const sData = result.subscription;
        const subPlan = (sData?.plan || sData?.plan_id || "").toLowerCase();
        if (
          isPlatformOwner ||
          sData?.is_unlimited === true ||
          sData?.amount === 999 ||
          sData?.amount === 9990 ||
          subPlan.includes("business") ||
          subPlan.includes("999")
        ) {
          result.plan = "business";
        } else {
          result.plan = "professional";
        }
      } else if (userData?.subscription_status === "active" || userData?.subscription_status === "TRIALING") {
        // Fallback from user record
        result.subscription = {
          plan: userData.plan || "professional",
          status: userData.subscription_status,
          subscription_id: userData.subscription_id || null,
          paid_through_date: userData.paid_through_date || null,
        };
        result.plan = userData.plan === "business" ? "business" : "professional";
      } else {
        result.subscription = null;
      }
    }
  } catch (err) {
    console.error("Error loading user personal business:", err);
  }

  return result;
}
