import { Firestore } from "firebase-admin/firestore";

export type SubscriptionStatus =
  | "NOT_SUBSCRIBED"
  | "PENDING_AUTHORIZATION"
  | "TRIALING"
  | "ACTIVE"
  | "PAYMENT_PENDING"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED";

export interface PlanConfig {
  id: "professional" | "business";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStaff: number;
  bookingQuota: number | "UNLIMITED";
  features: string[];
}

export const OWNER_EMAIL = "rajkumar50036@gmail.com";

export const VISRO_PLANS: Record<"professional" | "business", PlanConfig> = {
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    maxStaff: 3,
    bookingQuota: 300,
    features: [
      "300 successful bookings per monthly usage period",
      "Maximum 3 staff members",
      "Automated staff assignment engine",
      "Dedicated public booking link & dynamic QR",
      "Customer CRM ledger & history",
      "Cloud Firestore atomic conflict prevention",
    ],
  },
  business: {
    id: "business",
    name: "Business Suite",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    maxStaff: 10,
    bookingQuota: "UNLIMITED",
    features: [
      "UNLIMITED APPOINTMENT BOOKINGS (No monthly quota)",
      "Maximum 10 staff members",
      "All Professional features",
      "Advanced revenue, conversion & service analytics",
      "Staff performance reports & workload metrics",
      "Priority engineer onboarding & direct support",
    ],
  },
};

export interface QuotaCheckResult {
  businessId: string;
  plan: "professional" | "business";
  status: SubscriptionStatus;
  isUnlimited: boolean;
  isLifetimeFree: boolean;
  quota: number | "UNLIMITED";
  currentUsage: number;
  remainingSlots: number | "UNLIMITED";
  isQuotaReached: boolean;
  canAcceptBooking: boolean;
  isExpired?: boolean;
  isPaused?: boolean;
  isTrial?: boolean;
  trialAppointmentsUsed?: number;
  trialAppointmentLimit?: number;
  trialEndAt?: string;
  firstPaymentScheduledAt?: string;
  paidThrough?: string;
  nextRenewalAt?: string;
  mandateStatus?: "AUTHORIZED" | "PENDING" | "FAILED" | "CANCELLED";
  cancellationStatus?: "NONE" | "PENDING" | "CANCELLED";
  publicBookingStatus?: "ACTIVE" | "PAUSED";
  publicBookingPauseReason?: string | null;
  periodStart: string;
  periodEnd: string;
  daysActive: number;
  daysRemaining: number | "LIFETIME";
  totalCycleDays: number | "LIFETIME";
  upgradeMessage?: string;
  upgradeDifference?: number;
}

/**
 * Calculates current billing period start and end dates.
 */
export function calculateBillingPeriod(subscription?: any): { periodStart: Date; periodEnd: Date } {
  const now = new Date();

  if (subscription?.activated_at) {
    const actDate = new Date(subscription.activated_at);
    if (!isNaN(actDate.getTime())) {
      let curStart = new Date(actDate);
      while (true) {
        const nextStart = new Date(curStart);
        nextStart.setDate(nextStart.getDate() + 30);
        if (nextStart > now) {
          const curEnd = nextStart;
          return { periodStart: curStart, periodEnd: curEnd };
        }
        curStart = nextStart;
        if (now.getTime() - curStart.getTime() > 1000 * 60 * 60 * 24 * 365 * 10) break;
      }
    }
  }

  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
}

/**
 * Checks business booking quota against live Cloud Firestore records.
 * Grants permanent lifetime free access to platform owner (rajkumar50036@gmail.com).
 * Calculates backend active days and days remaining for every user.
 */
export async function checkBusinessBookingQuota(
  db: Firestore,
  businessId: string
): Promise<QuotaCheckResult> {
  // 1. Fetch Business Profile
  const busDoc = await db.collection("businesses").doc(businessId).get();
  const busData = busDoc.data() || {};

  // 2. Fetch Subscription
  const subQuery = await db
    .collection("subscriptions")
    .where("business_id", "==", businessId)
    .limit(1)
    .get();

  const subData = !subQuery.empty ? subQuery.docs[0].data() : null;

  // Determine centralized subscription status
  const rawStatus = (
    subData?.subscriptionStatus ||
    subData?.status ||
    busData?.subscription_status ||
    "NOT_SUBSCRIBED"
  ).toUpperCase();

  let status: SubscriptionStatus = "NOT_SUBSCRIBED";
  if (rawStatus === "ACTIVE") status = "ACTIVE";
  else if (rawStatus === "TRIALING" || rawStatus === "TRIAL") status = "TRIALING";
  else if (rawStatus === "PENDING_AUTHORIZATION" || rawStatus === "PENDING") status = "PENDING_AUTHORIZATION";
  else if (rawStatus === "PAYMENT_PENDING") status = "PAYMENT_PENDING";
  else if (rawStatus === "PAST_DUE") status = "PAST_DUE";
  else if (rawStatus === "CANCELLED" || rawStatus === "CANCELED") status = "CANCELLED";
  else if (rawStatus === "EXPIRED") status = "EXPIRED";
  else if (rawStatus === "SUSPENDED" || rawStatus === "HALTED") status = "SUSPENDED";

  // Check if this business belongs to the Platform Owner (rajkumar50036@gmail.com)
  const isOwner =
    (busData.owner_email || "").toLowerCase() === OWNER_EMAIL ||
    (subData?.owner_email || "").toLowerCase() === OWNER_EMAIL ||
    busData.lifetime_free === true ||
    subData?.lifetime_free === true;

  // Calculate Billing Period
  const { periodStart, periodEnd } = calculateBillingPeriod(subData);
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = periodEnd.toISOString();

  // Backend Days Count calculation
  const now = new Date();
  const activatedDate = subData?.activated_at
    ? new Date(subData.activated_at)
    : busData.created_at
    ? new Date(busData.created_at)
    : now;
  const expiresDate = subData?.expires_at ? new Date(subData.expires_at) : periodEnd;

  const daysActive = Math.max(1, Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const rawDaysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Target plan detection
  const rawPlan = (
    busData.plan ||
    busData.subscription_plan ||
    busData.tier ||
    subData?.plan ||
    subData?.plan_id ||
    subData?.tier ||
    "professional"
  )
    .toString()
    .toLowerCase();

  const isBusinessPlan =
    rawPlan.includes("business") ||
    rawPlan.includes("999") ||
    rawPlan === "enterprise" ||
    subData?.amount === 999 ||
    subData?.amount === 9990 ||
    subData?.amount === 99900 ||
    busData.is_unlimited === true ||
    subData?.is_unlimited === true;

  const targetPlan: "professional" | "business" = isBusinessPlan ? "business" : "professional";

  const mandateStatus: "AUTHORIZED" | "PENDING" | "FAILED" | "CANCELLED" =
    subData?.mandateStatus ||
    subData?.autoPayAuthorizationStatus ||
    (subData?.razorpay_subscription_id ? "AUTHORIZED" : "PENDING");

  const cancellationStatus: "NONE" | "PENDING" | "CANCELLED" =
    subData?.cancellationStatus || (status === "CANCELLED" ? "CANCELLED" : "NONE");

  const firstPaymentScheduledAt: string | undefined =
    subData?.firstPaymentScheduledAt ||
    subData?.auto_debit_scheduled_at ||
    subData?.trialEndAt ||
    subData?.trial_end_at ||
    undefined;

  const paidThrough: string | undefined =
    subData?.paidThrough || subData?.paid_through_date || subData?.expires_at || undefined;

  const nextRenewalAt: string | undefined =
    subData?.nextRenewalAt || subData?.renewal_date || paidThrough || undefined;

  // Count successful bookings created in this period
  const apptsQuery = await db
    .collection("appointments")
    .where("business_id", "==", businessId)
    .get();

  let currentUsage = 0;
  apptsQuery.docs.forEach((doc: any) => {
    const data = doc.data();
    const apptStatus = (data.status || "").toUpperCase();
    if (apptStatus === "CANCELLED") return;

    const createdAtStr = data.created_at || (data.appointment_date ? `${data.appointment_date}T00:00:00.000Z` : null);
    if (createdAtStr && createdAtStr >= periodStartIso) {
      currentUsage++;
    }
  });

  // 1. PLATFORM OWNER: Lifetime Free Access (Unlimited)
  if (isOwner) {
    return {
      businessId,
      plan: "business",
      status: "ACTIVE",
      isUnlimited: true,
      isLifetimeFree: true,
      quota: "UNLIMITED",
      currentUsage,
      remainingSlots: "UNLIMITED",
      isQuotaReached: false,
      canAcceptBooking: true,
      mandateStatus: "AUTHORIZED",
      cancellationStatus: "NONE",
      publicBookingStatus: "ACTIVE",
      publicBookingPauseReason: null,
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      daysActive,
      daysRemaining: "LIFETIME",
      totalCycleDays: "LIFETIME",
    };
  }

  // 1.5 Legacy / Onboarded Business Access Check
  const isTestAccess =
    (busData.paymentVerified === true && busData.profileCompleted === true) ||
    busData.sharingLinkUnlocked === true ||
    busData.plan === "test-access" ||
    busData.plan === "VISROSLOT TEST ACCESS" ||
    subData?.plan === "VISROSLOT TEST ACCESS" ||
    subData?.plan_id === "test-access";

  if (isTestAccess) {
    return {
      businessId,
      plan: "professional",
      status: "ACTIVE",
      isUnlimited: true,
      isLifetimeFree: false,
      quota: "UNLIMITED",
      currentUsage,
      remainingSlots: "UNLIMITED",
      isQuotaReached: false,
      canAcceptBooking: true,
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      daysActive,
      daysRemaining: 365,
      totalCycleDays: 365,
    };
  }

  // 2. 7-DAY FREE TRIAL: Max 10 successful appointments total, max 1 staff
  if (status === "TRIALING") {
    const trialStartIso =
      subData?.trialStartAt ||
      subData?.trial_start_at ||
      subData?.start_date ||
      busData.created_at ||
      nowIsoDate(now);

    const trialEndIso =
      subData?.trialEndAt ||
      subData?.trial_end_at ||
      subData?.trial_ends_at ||
      busData.trial_ends_at ||
      new Date(new Date(trialStartIso).getTime() + 7 * 86400 * 1000).toISOString();

    const trialEndDate = new Date(trialEndIso);
    const isTrialExpired = now.getTime() > trialEndDate.getTime();

    // Count all successful bookings during trial
    let trialAppointmentsUsed = 0;
    apptsQuery.docs.forEach((doc: any) => {
      const data = doc.data();
      const apptStatus = (data.status || "").toUpperCase();
      if (apptStatus !== "CANCELLED") {
        trialAppointmentsUsed++;
      }
    });

    const trialLimit = 10;
    const isTrialQuotaReached = trialAppointmentsUsed >= trialLimit;
    const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (isTrialExpired) {
      return {
        businessId,
        plan: targetPlan,
        status: "EXPIRED",
        isUnlimited: false,
        isLifetimeFree: false,
        quota: trialLimit,
        currentUsage: trialAppointmentsUsed,
        remainingSlots: 0,
        isQuotaReached: true,
        canAcceptBooking: false,
        isExpired: true,
        isPaused: true,
        isTrial: true,
        trialAppointmentsUsed,
        trialAppointmentLimit: trialLimit,
        trialEndAt: trialEndIso,
        firstPaymentScheduledAt,
        paidThrough: trialEndIso,
        nextRenewalAt,
        mandateStatus,
        cancellationStatus,
        publicBookingStatus: "PAUSED",
        publicBookingPauseReason: "TRIAL_EXPIRED",
        periodStart: trialStartIso,
        periodEnd: trialEndIso,
        daysActive,
        daysRemaining: 0,
        totalCycleDays: 7,
        upgradeMessage:
          "Your 7-day free trial has ended and your public booking link is paused. Please purchase a subscription to continue accepting appointments.",
      };
    }

    if (isTrialQuotaReached) {
      return {
        businessId,
        plan: targetPlan,
        status: "TRIALING",
        isUnlimited: false,
        isLifetimeFree: false,
        quota: trialLimit,
        currentUsage: trialAppointmentsUsed,
        remainingSlots: 0,
        isQuotaReached: true,
        canAcceptBooking: false,
        isExpired: false,
        isPaused: true,
        isTrial: true,
        trialAppointmentsUsed,
        trialAppointmentLimit: trialLimit,
        trialEndAt: trialEndIso,
        firstPaymentScheduledAt,
        paidThrough: trialEndIso,
        nextRenewalAt,
        mandateStatus,
        cancellationStatus,
        publicBookingStatus: "PAUSED",
        publicBookingPauseReason: "QUOTA_EXCEEDED",
        periodStart: trialStartIso,
        periodEnd: trialEndIso,
        daysActive,
        daysRemaining: trialDaysRemaining,
        totalCycleDays: 7,
        upgradeMessage:
          "You have reached your 7-day free trial limit of 10 appointments. Upgrade to an active subscription to accept more bookings.",
      };
    }

    return {
      businessId,
      plan: targetPlan,
      status: "TRIALING",
      isUnlimited: false,
      isLifetimeFree: false,
      quota: trialLimit,
      currentUsage: trialAppointmentsUsed,
      remainingSlots: Math.max(0, trialLimit - trialAppointmentsUsed),
      isQuotaReached: false,
      canAcceptBooking: true,
      isTrial: true,
      trialAppointmentsUsed,
      trialAppointmentLimit: trialLimit,
      trialEndAt: trialEndIso,
      firstPaymentScheduledAt,
      paidThrough: trialEndIso,
      nextRenewalAt,
      mandateStatus,
      cancellationStatus,
      publicBookingStatus: "ACTIVE",
      publicBookingPauseReason: null,
      periodStart: trialStartIso,
      periodEnd: trialEndIso,
      daysActive,
      daysRemaining: trialDaysRemaining,
      totalCycleDays: 7,
    };
  }

  // 3. Check if plan has expired
  const paidThroughDate = subData?.paid_through_date || subData?.expires_at || busData?.subscription_expires_at;
  const isPastPaidThrough = paidThroughDate ? new Date(paidThroughDate) < now : false;

  const isPlanExpired =
    status === "EXPIRED" ||
    status === "SUSPENDED" ||
    isPastPaidThrough ||
    (status !== "ACTIVE" && status !== "CANCELLED");

  if (isPlanExpired) {
    return {
      businessId,
      plan: targetPlan,
      status: "EXPIRED",
      isUnlimited: isBusinessPlan,
      isLifetimeFree: false,
      quota: isBusinessPlan ? "UNLIMITED" : 300,
      currentUsage,
      remainingSlots: 0,
      isQuotaReached: true,
      canAcceptBooking: false,
      isExpired: true,
      isPaused: true,
      firstPaymentScheduledAt,
      paidThrough,
      nextRenewalAt,
      mandateStatus,
      cancellationStatus,
      publicBookingStatus: "PAUSED",
      publicBookingPauseReason: "PLAN_EXPIRED",
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      daysActive,
      daysRemaining: 0,
      totalCycleDays: subData?.billing_cycle === "yearly" ? 365 : 30,
      upgradeMessage:
        "Your subscription plan has expired and your public booking link is paused. Please reactivate your plan to resume accepting appointments.",
    };
  }

  // 4. Commercial Business Plan (₹999/month or ₹9,990/year): UNLIMITED BOOKINGS
  if (isBusinessPlan) {
    return {
      businessId,
      plan: "business",
      status: status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
      isUnlimited: true,
      isLifetimeFree: false,
      quota: "UNLIMITED",
      currentUsage,
      remainingSlots: "UNLIMITED",
      isQuotaReached: false,
      canAcceptBooking: true,
      firstPaymentScheduledAt,
      paidThrough,
      nextRenewalAt,
      mandateStatus,
      cancellationStatus,
      publicBookingStatus: "ACTIVE",
      publicBookingPauseReason: null,
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      daysActive,
      daysRemaining: rawDaysRemaining,
      totalCycleDays: subData?.billing_cycle === "yearly" ? 365 : 30,
    };
  }

  // 5. Professional Plan: Strict 300 Limit per cycle
  const quota = 300;
  const isQuotaReached = currentUsage >= quota;
  const remainingSlots = Math.max(0, quota - currentUsage);
  const canAcceptBooking = !isQuotaReached;

  return {
    businessId,
    plan: "professional",
    status: status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
    isUnlimited: false,
    isLifetimeFree: false,
    quota: 300,
    currentUsage,
    remainingSlots,
    isQuotaReached,
    canAcceptBooking,
    firstPaymentScheduledAt,
    paidThrough,
    nextRenewalAt,
    mandateStatus,
    cancellationStatus,
    publicBookingStatus: isQuotaReached ? "PAUSED" : "ACTIVE",
    publicBookingPauseReason: isQuotaReached ? "QUOTA_EXCEEDED" : null,
    periodStart: periodStartIso,
    periodEnd: periodEndIso,
    daysActive,
    daysRemaining: rawDaysRemaining,
    totalCycleDays: subData?.billing_cycle === "yearly" ? 365 : 30,
    upgradeDifference: 500,
    upgradeMessage: isQuotaReached
      ? "300/300 monthly booking quota reached. Upgrade to Business Plan to unlock UNLIMITED bookings immediately."
      : undefined,
  };
}

function nowIsoDate(d: Date): string {
  return d.toISOString();
}

/**
 * Calculates Upgrade Proration & Pricing
 */
export function calculateUpgradePrice(
  currentPlan: string,
  targetPlan: "business",
  billingCycle: "monthly" | "yearly",
  currentCycle?: "monthly" | "yearly"
): {
  isUpgrade: boolean;
  fullPrice: number;
  creditApplied: number;
  finalAmountToPay: number;
  reason: string;
} {
  const isYearly = billingCycle === "yearly";
  const businessFullPrice = isYearly ? 9990 : 999;

  const cleanCurrentPlan = (currentPlan || "").toLowerCase();
  const isCurrentPro = cleanCurrentPlan === "professional" || cleanCurrentPlan === "pro";

  if (!isCurrentPro) {
    return {
      isUpgrade: false,
      fullPrice: businessFullPrice,
      creditApplied: 0,
      finalAmountToPay: businessFullPrice,
      reason: "Standard new subscription pricing",
    };
  }

  let credit = 0;
  if (isYearly) {
    credit = currentCycle === "yearly" ? 4990 : 499;
  } else {
    credit = 499;
  }

  const finalAmountToPay = Math.max(0, businessFullPrice - credit);

  return {
    isUpgrade: true,
    fullPrice: businessFullPrice,
    creditApplied: credit,
    finalAmountToPay,
    reason: `Credit ₹${credit} applied from Professional subscription toward Business (${billingCycle}). Remaining to pay: ₹${finalAmountToPay}.`,
  };
}

export interface StaffLimitCheckResult {
  businessId: string;
  canAddStaff: boolean;
  currentStaffCount: number;
  maxStaff: number;
  plan: "trial" | "professional" | "business";
  isUnlimited: boolean;
  message?: string;
}

/**
 * Backend Staff Capacity Guard: Enforces 1 on trial, 3 on Professional, and 10 on Business
 */
export async function checkBusinessStaffLimit(
  db: Firestore,
  businessId: string
): Promise<StaffLimitCheckResult> {
  const busDoc = await db.collection("businesses").doc(businessId).get();
  const busData = busDoc.data() || {};

  const isOwner =
    (busData.owner_email || "").toLowerCase() === OWNER_EMAIL ||
    busData.lifetime_free === true;

  if (isOwner) {
    return {
      businessId,
      canAddStaff: true,
      currentStaffCount: 0,
      maxStaff: 999,
      plan: "business",
      isUnlimited: true,
    };
  }

  const subQuery = await db
    .collection("subscriptions")
    .where("business_id", "==", businessId)
    .limit(1)
    .get();

  const subData = !subQuery.empty ? subQuery.docs[0].data() : null;

  const rawStatus = (
    subData?.subscriptionStatus ||
    subData?.status ||
    busData?.subscription_status ||
    "NOT_SUBSCRIBED"
  ).toUpperCase();

  const isTrial = rawStatus === "TRIALING" || rawStatus === "TRIAL";
  const rawPlan = (
    busData.plan ||
    subData?.plan ||
    "professional"
  ).toLowerCase();

  const isBusiness = rawPlan.includes("business") || rawPlan.includes("999");
  const maxStaff = isTrial ? 1 : isBusiness ? 10 : 3;
  const planType: "trial" | "professional" | "business" = isTrial ? "trial" : isBusiness ? "business" : "professional";

  const staffSnap = await db
    .collection("staff")
    .where("business_id", "==", businessId)
    .where("is_active", "==", true)
    .get();

  const currentStaffCount = staffSnap.size;
  const canAddStaff = currentStaffCount < maxStaff;

  let message = "";
  if (!canAddStaff) {
    message = isTrial
      ? "7-Day Free Trial limit reached (maximum 1 staff member during trial). Upgrade to an active subscription to add more staff members."
      : isBusiness
      ? "Business Suite capacity reached (maximum 10 staff members)."
      : "Professional plan limit reached (maximum 3 staff members). Upgrade to Business Suite to add up to 10 staff members.";
  }

  return {
    businessId,
    canAddStaff,
    currentStaffCount,
    maxStaff,
    plan: planType,
    isUnlimited: isBusiness,
    message: canAddStaff ? undefined : message,
  };
}
