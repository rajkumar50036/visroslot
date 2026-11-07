/**
 * Optional Razorpay Client Integration
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

/**
 * Robust loader for Razorpay Checkout script with pre-existing tag detection
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(Boolean((window as any).Razorpay));
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script from CDN");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface CheckoutOptions {
  businessId: string;
  businessName?: string;
  userId?: string;
  plan: "professional" | "business";
  cycle?: "monthly" | "yearly";
  trial?: boolean;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  preferStandardOrder?: boolean;
  onSuccess?: (verificationResult: any) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
  onAutoPayRestricted?: (retryStandard: () => void) => void;
}

export async function initiateRazorpayCheckout(opts: CheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error(
      "Unable to connect to Razorpay secure payment gateway. Please check your internet connection."
    );
  }

  const effectiveUserId =
    opts.userId ||
    (opts.businessId?.startsWith("pending_")
      ? opts.businessId.replace(/^pending_/, "")
      : undefined);

  // Step 1: Create Subscription/Order via server API
  const orderRes = await fetch("/api/subscription/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: opts.businessId,
      userId: effectiveUserId,
      plan: opts.plan,
      cycle: opts.cycle || "monthly",
      trial: Boolean(opts.trial),
    }),
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok) {
    throw new Error(
      orderData.message || orderData.error || "Failed to initialize checkout session."
    );
  }

  // Pre-checkout Duplicate Protection: If user already has active subscription, skip modal!
  if (orderData.alreadySubscribed) {
    if (opts.onSuccess) {
      opts.onSuccess({
        message: orderData.message || "Active subscription verified! Continuing to your dashboard.",
        subscription: orderData.subscription,
        alreadySubscribed: true,
      });
    }
    return;
  }

  const {
    keyId,
    subscriptionId,
    orderId,
    amount,
    amountInRupees,
    isTrial,
  } = orderData;

  const planTitle =
    opts.plan === "business"
      ? "Business Suite (Unlimited Bookings)"
      : "Professional Plan (300 Bookings)";

  const cycleLabel = opts.cycle === "yearly" ? "Annual" : "Monthly";
  const recurringAmount =
    opts.plan === "business"
      ? opts.cycle === "yearly"
        ? "9,990/year"
        : "999/month"
      : opts.cycle === "yearly"
      ? "4,990/year"
      : "499/month";

  const descText = isTrial
    ? `VISROSLOT 7-Day Free Trial • ${planTitle} • ₹0 today • Auto-debit ₹${recurringAmount} starts Day 8`
    : `${planTitle} • ₹${amountInRupees} (${cycleLabel})`;

  return new Promise((resolve, reject) => {
    function launchModal(useSubscription: boolean) {
      const rzpOptions: any = {
        key: keyId || RAZORPAY_KEY_ID,
        name: "VISROSLOT",
        description: descText,
        image: "/assets/visroslot-logo.png",
        prefill: {
          name: opts.userName || opts.businessName || "VisroSlot Business Owner",
          email: opts.userEmail || "",
          contact: opts.userPhone || "",
        },
        notes: {
          businessId: opts.businessId,
          plan: opts.plan,
          cycle: opts.cycle || "monthly",
          isTrial: isTrial ? "true" : "false",
          subscriptionId: subscriptionId || "",
          orderId: orderId || "",
        },
        theme: {
          color: "#043D2E",
        },
        modal: {
          ondismiss: () => {
            if (opts.onDismiss) opts.onDismiss();
            resolve();
          },
        },
        handler: async function (response: any) {
          try {
            // Step 2: Cryptographic Server-side Verification & Activation
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessId: opts.businessId,
                userId: effectiveUserId,
                plan: opts.plan,
                cycle: opts.cycle || "monthly",
                isTrial: Boolean(isTrial),
                subscriptionId: response.razorpay_subscription_id || subscriptionId || null,
                orderId: response.razorpay_order_id || orderId || null,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature || null,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(
                verifyData.error ||
                  "Payment was captured by Razorpay, but subscription verification failed."
              );
            }

            if (opts.onSuccess) {
              opts.onSuccess(verifyData);
            }
            resolve();
          } catch (err: any) {
            if (opts.onError) opts.onError(err);
            reject(err);
          }
        },
      };

      // For recurring AutoPay subscriptions, pass subscription_id only when preferStandardOrder is NOT requested
      if (subscriptionId && !opts.preferStandardOrder && isTrial) {
        rzpOptions.subscription_id = subscriptionId;
      } else {
        rzpOptions.amount = amount;
        rzpOptions.currency = "INR";
        if (orderId) {
          rzpOptions.order_id = orderId;
        }
      }

      try {
        const paymentInstance = new (window as any).Razorpay(rzpOptions);
        paymentInstance.on("payment.failed", function (resp: any) {
          const desc = resp.error?.description || "";
          const isAutopayRestricted =
            desc.toLowerCase().includes("restricted") ||
            desc.toLowerCase().includes("autopay") ||
            desc.toLowerCase().includes("mandate");

          const err = new Error(
            isAutopayRestricted
              ? "Your bank account has restrictions on UPI AutoPay. You can switch to Credit/Debit Card or click 'Pay via Standard UPI'."
              : desc || "Payment failed or was cancelled by user."
          );

          if (isAutopayRestricted && opts.onAutoPayRestricted) {
            opts.onAutoPayRestricted(() => launchModal(false));
          }

          if (opts.onError) opts.onError(err);
          reject(err);
        });

        paymentInstance.open();
      } catch (err: any) {
        console.warn("Error opening with subscription mode, falling back to standard order mode:", err);
        if (useSubscription && !opts.preferStandardOrder) {
          launchModal(false);
        } else {
          if (opts.onError) opts.onError(err);
          reject(err);
        }
      }
    }

    launchModal(!opts.preferStandardOrder && Boolean(subscriptionId));
  });
}
