import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { checkBusinessBookingQuota } from "@/lib/subscription/quota";
import {
  findBusinessBySlugRest,
  fetchCollectionRest,
  getStarterServicesForBusiness,
} from "@/lib/firebase/firestoreRest";

const DEFAULT_DEMO_SALON = {
  id: "2715CnLUsE7SU6ylo9EU",
  name: "VISROSLOT Demo Salon & Wellness",
  slug: "demo-salon",
  category: "Salon & Wellness",
  description: "Premier styling salon offering precision haircuts, luxury beard grooming, therapeutic facials, and complete aesthetic care.",
  phone: "+91 98765 43210",
  email: "demo@visroslot.com",
  address: "Suite 101, Luxury Boulevard, Bangalore",
  location: {
    address: "Suite 101, Luxury Boulevard, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    postalCode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  is_active: true,
  lifetime_free: true,
  payment_verified: true,
  is_paid: true,
  subscription_status: "active",
  owner_id: "vMZQTGlYSfM8adohQAZmSE3cNX02",
  owner_email: "rajkumar50036@gmail.com",
  buffer_time_mins: 15,
  advance_notice_hours: 1,
  booking_window_days: 30,
  cancellation_buffer_hours: 2,
  working_hours: {
    monday: { isOpen: true, open: "09:00", close: "20:00" },
    tuesday: { isOpen: true, open: "09:00", close: "20:00" },
    wednesday: { isOpen: true, open: "09:00", close: "20:00" },
    thursday: { isOpen: true, open: "09:00", close: "20:00" },
    friday: { isOpen: true, open: "09:00", close: "21:00" },
    saturday: { isOpen: true, open: "09:00", close: "21:00" },
    sunday: { isOpen: true, open: "10:00", close: "18:00" },
  },
};

const DEFAULT_DEMO_SERVICES = [
  {
    id: "srv-demo-1",
    name: "Precision Haircut & Styling",
    duration: 35,
    price: 500,
    description: "Consultation, precision scissor & clipper cut, wash, and luxury finish styling.",
    category: "Hair Care",
    is_active: true,
    business_id: "2715CnLUsE7SU6ylo9EU",
  },
  {
    id: "srv-demo-2",
    name: "Luxury Beard Grooming & Hot Towel",
    duration: 30,
    price: 350,
    description: "Razor shaping, beard oil conditioning, and soothing hot towel relaxation.",
    category: "Grooming",
    is_active: true,
    business_id: "2715CnLUsE7SU6ylo9EU",
  },
  {
    id: "srv-demo-3",
    name: "Deep Cleansing & Glowing Facial",
    duration: 60,
    price: 1200,
    description: "Skin exfoliation, blackhead extraction, rejuvenating massage, and organic gold mask.",
    category: "Facial & Skin",
    is_active: true,
    business_id: "2715CnLUsE7SU6ylo9EU",
  },
  {
    id: "srv-demo-4",
    name: "Complete Royal Spa & Grooming Package",
    duration: 90,
    price: 2499,
    description: "Haircut, luxury facial, beard grooming, and head massage experience.",
    category: "Package",
    is_active: true,
    business_id: "2715CnLUsE7SU6ylo9EU",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().trim();
  const isDemo = cleanSlug === "demo" || cleanSlug === "sample" || cleanSlug === "demo-salon";

  const { db, isConfigured } = getFirebaseAdmin();
  if (!db || !isConfigured) {
    if (isDemo) {
      return NextResponse.json(
        {
          business: DEFAULT_DEMO_SALON,
          services: DEFAULT_DEMO_SERVICES,
          quotaCheck: {
            isQuotaReached: false,
            quota: "UNLIMITED",
            currentUsage: 0,
            isUnlimited: true,
            canAcceptBooking: true,
            status: "ACTIVE",
            businessId: "2715CnLUsE7SU6ylo9EU",
            plan: "business",
            isLifetimeFree: true,
          },
          isRedirect: cleanSlug !== "demo-salon",
          canonicalSlug: "demo-salon",
        },
        {
          headers: {
            "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    // Attempt fast Firestore REST resolution (zero service-account required)
    const restBiz = await findBusinessBySlugRest(cleanSlug);
    if (restBiz) {
      if (restBiz.publicBookingStatus === "PAUSED" && !restBiz.lifetime_free && (restBiz.owner_email || "").toLowerCase() !== "rajkumar50036@gmail.com") {
        return NextResponse.json(
          {
            error: "BOOKINGS_PAUSED",
            heading: "Bookings Temporarily Unavailable",
            message:
              "This business's booking service is temporarily paused. Please contact the business directly.",
            isPaused: true,
            reason: restBiz.publicBookingPauseReason || "RENEWAL_PENDING",
          },
          { status: 403 }
        );
      }
      let services: any[] = [];
      try {
        const allServices = await fetchCollectionRest("services");
        services = allServices.filter(
          (s: any) => (s.business_id === restBiz.id || s.business_id === "2715CnLUsE7SU6ylo9EU") && s.is_active !== false
        );
      } catch (e) {}

      if (!services.length) {
        services = getStarterServicesForBusiness(restBiz.id, restBiz.name || "VISROSLOT Partner");
      }

      const isBusiness =
        restBiz.lifetime_free === true ||
        (restBiz.plan || "").toLowerCase().includes("business") ||
        (restBiz.plan || "").toLowerCase().includes("999");

      return NextResponse.json(
        {
          business: restBiz,
          services,
          quotaCheck: {
            isQuotaReached: false,
            quota: isBusiness ? "UNLIMITED" : 300,
            currentUsage: 0,
            isUnlimited: isBusiness,
            canAcceptBooking: true,
            status: "ACTIVE",
            businessId: restBiz.id,
            plan: isBusiness ? "business" : "professional",
            isLifetimeFree: restBiz.lifetime_free === true,
            periodStart: new Date().toISOString(),
            periodEnd: new Date().toISOString(),
            daysActive: 1,
            daysRemaining: 30,
            totalCycleDays: 30,
          },
          isRedirect: (restBiz.slug || "").toLowerCase() !== cleanSlug,
          canonicalSlug: restBiz.slug || cleanSlug,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: "NOT_FOUND",
        message: "We couldn't find this booking page. Please check the address or contact the business.",
      },
      { status: 404 }
    );
  }

  try {
    // If user accesses /book/demo or /book/sample, route directly to real flagship portal: demo-salon
    let searchSlug = cleanSlug;
    let isRedirect = false;
    if (searchSlug === "demo" || searchSlug === "sample") {
      searchSlug = "demo-salon";
      isRedirect = true;
    }

    // 1. Fetch Business from Firestore by current canonical slug
    const busQuery = await db
      .collection("businesses")
      .where("slug", "==", searchSlug)
      .where("is_active", "==", true)
      .limit(1)
      .get();

    let busDoc = busQuery.empty ? null : busQuery.docs[0];
    let canonicalSlug = searchSlug;

    // 2. If not found by canonical slug, check if this is an older alias in previous_slugs
    if (!busDoc) {
      const prevQuery = await db
        .collection("businesses")
        .where("previous_slugs", "array-contains", searchSlug)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (!prevQuery.empty) {
        busDoc = prevQuery.docs[0];
        isRedirect = true;
        canonicalSlug = busDoc.data().slug || searchSlug;
      }
    }

    if (!busDoc) {
      const restBiz = await findBusinessBySlugRest(searchSlug);
      if (restBiz) {
        if (restBiz.publicBookingStatus === "PAUSED" && !restBiz.lifetime_free && (restBiz.owner_email || "").toLowerCase() !== "rajkumar50036@gmail.com") {
          return NextResponse.json(
            {
              error: "BOOKINGS_PAUSED",
              heading: "Bookings Temporarily Unavailable",
              message:
                "This business's booking service is temporarily paused. Please contact the business directly.",
              isPaused: true,
              reason: restBiz.publicBookingPauseReason || "RENEWAL_PENDING",
            },
            { status: 403 }
          );
        }
        let services: any[] = [];
        try {
          const allServices = await fetchCollectionRest("services");
          services = allServices.filter(
            (s: any) => (s.business_id === restBiz.id || s.business_id === "2715CnLUsE7SU6ylo9EU") && s.is_active !== false
          );
        } catch (e) {}

        if (!services.length) {
          services = getStarterServicesForBusiness(restBiz.id, restBiz.name || "VISROSLOT Partner");
        }

        const isBusiness =
          restBiz.lifetime_free === true ||
          (restBiz.plan || "").toLowerCase().includes("business") ||
          (restBiz.plan || "").toLowerCase().includes("999");

        return NextResponse.json(
          {
            business: restBiz,
            services,
            quotaCheck: {
              isQuotaReached: false,
              quota: isBusiness ? "UNLIMITED" : 300,
              currentUsage: 0,
              isUnlimited: isBusiness,
              canAcceptBooking: true,
              status: "ACTIVE",
              businessId: restBiz.id,
              plan: isBusiness ? "business" : "professional",
              isLifetimeFree: restBiz.lifetime_free === true,
              periodStart: new Date().toISOString(),
              periodEnd: new Date().toISOString(),
              daysActive: 1,
              daysRemaining: 30,
              totalCycleDays: 30,
            },
            isRedirect: (restBiz.slug || "").toLowerCase() !== searchSlug,
            canonicalSlug: restBiz.slug || searchSlug,
          },
          {
            headers: {
              "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }

      if (searchSlug === "demo-salon") {
        return NextResponse.json(
          {
            business: DEFAULT_DEMO_SALON,
            services: DEFAULT_DEMO_SERVICES,
            quotaCheck: {
              isQuotaReached: false,
              quota: "UNLIMITED",
              currentUsage: 0,
              isUnlimited: true,
              canAcceptBooking: true,
              status: "ACTIVE",
              businessId: "2715CnLUsE7SU6ylo9EU",
              plan: "business",
              isLifetimeFree: true,
            },
            isRedirect,
            canonicalSlug: "demo-salon",
          },
          {
            headers: {
              "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "We couldn't find this booking page. Please check the address or contact the business.",
        },
        { status: 404 }
      );
    }

    const bData = busDoc.data();
    const isFounder =
      bData.owner_id === "vMZQTGlYSfM8adohQAZmSE3cNX02" ||
      (bData.owner_email || "").toLowerCase() === "rajkumar50036@gmail.com" ||
      bData.lifetime_free === true;

    // Execute Subscription Check, Services Query, and Quota Check in PARALLEL for maximum speed
    const subPromise = isFounder
      ? Promise.resolve({ isPaid: true, isTrial: false, isExpired: false, subData: null })
      : db
          .collection("subscriptions")
          .where("business_id", "==", busDoc.id)
          .limit(1)
          .get()
          .then(async (subSnap: any) => {
            let docToUse = subSnap.empty ? null : subSnap.docs[0];
            if (!docToUse && bData.owner_id) {
              const userSubSnap = await db
                .collection("subscriptions")
                .where("user_id", "==", bData.owner_id)
                .limit(1)
                .get();
              if (!userSubSnap.empty) {
                docToUse = userSubSnap.docs[0];
              }
            }
            if (!docToUse) {
              return { isPaid: false, isTrial: false, isExpired: false, subData: null };
            }
            const sData = docToUse.data();
            const sStatus = (sData.subscriptionStatus || sData.status || "").toUpperCase();
            const isTrial = sStatus === "TRIALING" || sStatus === "TRIAL";
            const isPaidActive = sStatus === "ACTIVE" || sStatus === "CANCELLED";
            const now = new Date();
            const isExpired =
              sStatus === "EXPIRED" ||
              (isTrial && sData.trialEndAt && new Date(sData.trialEndAt) < now) ||
              (sData.paid_through_date && new Date(sData.paid_through_date) < now);

            return {
              isPaid: isPaidActive,
              isTrial,
              isExpired,
              subData: sData,
            };
          })
          .catch(() => ({ isPaid: true, isTrial: false, isExpired: false, subData: null }));

    const srvPromise = db
      .collection("services")
      .where("business_id", "==", busDoc.id)
      .where("is_active", "==", true)
      .get()
      .then((srvQuery: any) =>
        srvQuery.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      )
      .catch(() => []);

    const isBusiness =
      isFounder ||
      bData.lifetime_free === true ||
      bData.is_unlimited === true ||
      (bData.plan || "").toLowerCase().includes("business") ||
      (bData.plan || "").toLowerCase().includes("999");

    const quotaPromise = isFounder || bData.lifetime_free
      ? Promise.resolve({
          isQuotaReached: false,
          quota: "UNLIMITED",
          currentUsage: 0,
          isUnlimited: true,
          canAcceptBooking: true,
          status: "ACTIVE" as const,
          businessId: busDoc.id,
          plan: "business" as const,
          isLifetimeFree: true,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          daysActive: 1,
          daysRemaining: "LIFETIME" as const,
          totalCycleDays: "LIFETIME" as const,
        })
      : checkBusinessBookingQuota(db, busDoc.id).catch(() => ({
          isQuotaReached: false,
          quota: isBusiness ? "UNLIMITED" : 300,
          currentUsage: 0,
          isUnlimited: isBusiness,
          canAcceptBooking: true,
          status: "ACTIVE" as const,
          businessId: busDoc.id,
          plan: isBusiness ? "business" : "professional" as const,
          isLifetimeFree: false,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          daysActive: 1,
          daysRemaining: 30,
          totalCycleDays: 30,
        }));

    const [subResult, services, quotaCheck] = await Promise.all([
      subPromise,
      srvPromise,
      quotaPromise,
    ]);

    const now = new Date();
    const isBusExpired =
      !isFounder &&
      !bData.lifetime_free &&
      (subResult.isExpired ||
        (quotaCheck as any)?.isExpired === true ||
        (bData.subscription_expires_at && new Date(bData.subscription_expires_at) < now) ||
        (bData.subscription_status || "").toLowerCase() === "expired");

    // RULE 1: If recurring renewal not done, mandate halted, failed, explicitly PAUSED, or expired
    const isExplicitlyPaused =
      !isFounder &&
      !bData.lifetime_free &&
      (bData.publicBookingStatus === "PAUSED" ||
        (bData.subscription_status || "").toLowerCase() === "halted" ||
        (bData.subscription_status || "").toLowerCase() === "payment_failed");

    if (isExplicitlyPaused || isBusExpired || (quotaCheck as any)?.canAcceptBooking === false || (quotaCheck as any)?.isPaused === true) {
      return NextResponse.json(
        {
          error: "BOOKINGS_PAUSED",
          heading: "Bookings Temporarily Unavailable",
          message:
            "This business's booking service is temporarily paused. Please contact the business directly.",
          isPaused: true,
          isExpired: isBusExpired,
          reason: bData.publicBookingPauseReason || "RENEWAL_PENDING",
        },
        { status: 403 }
      );
    }

    // RULE 2: Direct Access Mode (Payment Gateway Removed)
    const isTestAccess =
      bData.payment_verified === true ||
      bData.paymentVerified === true ||
      bData.onboarding_complete === true ||
      bData.profileCompleted === true ||
      bData.sharingLinkUnlocked === true ||
      bData.sharing_link_unlocked === true ||
      Boolean(bData.name) ||
      bData.plan === "test-access";

    const isTrialActive = subResult.isTrial && !(quotaCheck as any)?.isQuotaReached && !isBusExpired;
    if (!subResult.isPaid && !isTrialActive && !isTestAccess && !isFounder && !bData.lifetime_free) {
      return NextResponse.json(
        {
          error: "BOOKINGS_PAUSED",
          heading: "Bookings Temporarily Unavailable",
          message:
            "This business's booking service is temporarily paused. Please contact the business directly.",
          isInactive: true,
          isUnpaid: true,
          isPaused: true,
        },
        { status: 403 }
      );
    }

    const business = { ...bData, id: busDoc.id };

    return NextResponse.json(
      {
        business,
        services,
        quotaCheck,
        isRedirect,
        canonicalSlug,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    if (isDemo) {
      return NextResponse.json(
        {
          business: DEFAULT_DEMO_SALON,
          services: DEFAULT_DEMO_SERVICES,
          quotaCheck: {
            isQuotaReached: false,
            quota: "UNLIMITED",
            currentUsage: 0,
            isUnlimited: true,
            canAcceptBooking: true,
            status: "ACTIVE",
            businessId: "2715CnLUsE7SU6ylo9EU",
            plan: "business",
            isLifetimeFree: true,
          },
          isRedirect: cleanSlug !== "demo-salon",
          canonicalSlug: "demo-salon",
        },
        {
          headers: {
            "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }
    try {
      const restBiz = await findBusinessBySlugRest(cleanSlug);
      if (restBiz) {
        if (restBiz.publicBookingStatus === "PAUSED" && !restBiz.lifetime_free && (restBiz.owner_email || "").toLowerCase() !== "rajkumar50036@gmail.com") {
          return NextResponse.json(
            {
              error: "BOOKINGS_PAUSED",
              heading: "Bookings Temporarily Unavailable",
              message:
                "This business's booking service is temporarily paused. Please contact the business directly.",
              isPaused: true,
              reason: restBiz.publicBookingPauseReason || "RENEWAL_PENDING",
            },
            { status: 403 }
          );
        }
        let services: any[] = [];
        try {
          const allServices = await fetchCollectionRest("services");
          services = allServices.filter(
            (s: any) => (s.business_id === restBiz.id || s.business_id === "2715CnLUsE7SU6ylo9EU") && s.is_active !== false
          );
        } catch (e) {}

        if (!services.length) {
          services = getStarterServicesForBusiness(restBiz.id, restBiz.name || "VISROSLOT Partner");
        }

        const isBusiness =
          restBiz.lifetime_free === true ||
          (restBiz.plan || "").toLowerCase().includes("business") ||
          (restBiz.plan || "").toLowerCase().includes("999");

        return NextResponse.json(
          {
            business: restBiz,
            services,
            quotaCheck: {
              isQuotaReached: false,
              quota: isBusiness ? "UNLIMITED" : 300,
              currentUsage: 0,
              isUnlimited: isBusiness,
              canAcceptBooking: true,
              status: "ACTIVE",
              businessId: restBiz.id,
              plan: isBusiness ? "business" : "professional",
              isLifetimeFree: restBiz.lifetime_free === true,
              periodStart: new Date().toISOString(),
              periodEnd: new Date().toISOString(),
              daysActive: 1,
              daysRemaining: 30,
              totalCycleDays: 30,
            },
            isRedirect: (restBiz.slug || "").toLowerCase() !== cleanSlug,
            canonicalSlug: restBiz.slug || cleanSlug,
          },
          {
            headers: {
              "Cache-Control": "public, max-age=10, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }
    } catch (restErr) {}

    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
