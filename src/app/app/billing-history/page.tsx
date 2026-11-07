"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Download,
  CheckCircle2,
  CalendarCheck2,
  Clock,
  IndianRupee,
  Loader2,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { AutoPayVerificationRecord } from "@/types/database";

interface PaymentRecord {
  id: string;
  order_id?: string;
  payment_id?: string;
  amount: number;
  plan: string;
  billing_cycle: string;
  status: string;
  record_type?: string;
  created_at: string;
}

export default function BillingHistoryPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [autopayVerification, setAutopayVerification] = useState<AutoPayVerificationRecord | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      const { auth, db, isConfigured } = getFirebaseClient();
      if (!isConfigured || !db) {
        setLoading(false);
        return;
      }

      try {
        const uid =
          auth?.currentUser?.uid ||
          (typeof document !== "undefined" &&
            (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
              document.cookie.match(/slotora_session=([^;]+)/)?.[1]));

        if (uid) {
          let busSnap = await getDocs(
            query(collection(db, "businesses"), where("owner_id", "==", uid))
          );
          if (busSnap.empty && auth?.currentUser?.email) {
            busSnap = await getDocs(
              query(collection(db, "businesses"), where("owner_email", "==", auth.currentUser.email.toLowerCase()))
            );
          }

          let bId = "";
          if (!busSnap.empty) {
            bId = busSnap.docs[0].id;
          } else {
            setPayments([]);
            setLoading(false);
            return;
          }

          if (bId) {
            // 1. Fetch AutoPay Verification Record
            try {
              const autoDoc = await getDoc(doc(db, "autopay_verifications", `autopay_${bId}`));
              if (autoDoc.exists()) {
                setAutopayVerification({ id: autoDoc.id, ...autoDoc.data() } as AutoPayVerificationRecord);
              }
            } catch (err) {
              console.warn("AutoPay record fetch warning:", err);
            }

            // 2. Fetch Subscription Data
            const subSnap = await getDocs(
              query(collection(db, "subscriptions"), where("business_id", "==", bId))
            );
            if (!subSnap.empty) {
              setSubscription(subSnap.docs[0].data());
            }

            // 3. Fetch Genuine Subscription Payments (Exclude trial token verification deductions)
            const paySnap = await getDocs(
              query(collection(db, "payments"), where("business_id", "==", bId))
            );
            const list = paySnap.docs
              .map((d) => ({ id: d.id, ...d.data() } as PaymentRecord))
              .filter((p) => Number(p.amount) >= 499 || p.record_type === "SUBSCRIPTION_PAYMENT");

            list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
            setPayments(list);
          }
        }
      } catch (e) {
        console.error("Billing fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-navy-600">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
        <span className="font-mono text-xs">Loading billing history from Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Billing & AutoPay Ledger
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Separated records for AutoPay mandate verification and subscription billing invoices
          </p>
        </div>

        <Link
          href="/app/subscription"
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-mono font-bold shadow-xs flex items-center gap-2 transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </Link>
      </div>

      {/* SECTION 1: AutoPay Mandate & Verification Status */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C49A46] font-bold">
              AutoPay Authorization
            </span>
            <h2 className="font-display font-bold text-lg text-slate-900 mt-0.5">
              Mandate & Verification Status
            </h2>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
              autopayVerification?.mandate_status === "AUTHORIZED"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {autopayVerification?.mandate_status || subscription?.mandateStatus || "AUTHORIZED"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Payment Method</span>
            <div className="font-bold text-slate-900 uppercase">
              {autopayVerification?.payment_method || "Razorpay AutoPay"}
            </div>
            <div className="text-[11px] text-slate-500">Recurring eMandate / Card</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Verification Deduction</span>
            <div className="font-bold text-slate-900">
              {autopayVerification?.verification_deduction_amount
                ? `₹${autopayVerification.verification_deduction_amount}`
                : "₹0 (Zero Auth)"}
            </div>
            <div className="text-[11px] text-slate-500">Temporary bank deduction</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Verification Refund Status</span>
            <div className="font-bold text-slate-900">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  autopayVerification?.refund_status === "REFUND_PROCESSED"
                    ? "bg-emerald-100 text-emerald-800"
                    : autopayVerification?.refund_status === "REFUND_PENDING"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {autopayVerification?.refund_status || "NOT_REQUIRED"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {autopayVerification?.automatic_refund_ref
                ? `Ref: ${autopayVerification.automatic_refund_ref}`
                : "Handled by bank / Razorpay"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Authorization Date</span>
            <div className="font-bold text-slate-900 font-mono">
              {autopayVerification?.authorization_date
                ? new Date(autopayVerification.authorization_date).toLocaleDateString("en-IN")
                : subscription?.activated_at
                ? new Date(subscription.activated_at).toLocaleDateString("en-IN")
                : "Active"}
            </div>
            <div className="text-[11px] text-slate-500">AutoPay Mandate Registered</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Subscription Payment Ledger Table */}
      <div className="rounded-3xl bg-white border border-navy-200 shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-navy-100">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C49A46] font-bold">
            Subscription Billing
          </span>
          <h2 className="font-display font-bold text-lg text-slate-900 mt-0.5">
            Captured Subscription Invoices & Receipts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official records of recurring subscription billings (Professional ₹499/mo or Business Suite ₹999/mo)
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-navy-500 space-y-2">
            <Receipt className="w-8 h-8 text-navy-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No commercial subscription charges captured yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              If you are currently on the 7-day free trial, your first subscription payment will occur at trial conclusion.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-800">
              <thead className="bg-navy-50/70 border-b border-navy-200 font-mono text-[11px] uppercase text-navy-600 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Transaction / Payment ID</th>
                  <th className="py-3.5 px-6 font-bold">Plan & Cycle</th>
                  <th className="py-3.5 px-6 font-bold">Amount Paid</th>
                  <th className="py-3.5 px-6 font-bold">Date & Time</th>
                  <th className="py-3.5 px-6 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono">
                      <div className="font-bold text-navy-950">
                        {p.payment_id || p.order_id || p.id}
                      </div>
                      <div className="text-[10px] text-navy-400">Order: {p.order_id || "N/A"}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-navy-950 uppercase">
                        {p.plan || "Professional"}
                      </div>
                      <div className="text-[11px] text-navy-500 font-mono uppercase">
                        {p.billing_cycle || "monthly"}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-navy-950">
                      ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-4 px-6 font-mono text-navy-600">
                      {p.created_at ? new Date(p.created_at).toLocaleString("en-IN") : "Recorded"}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        {p.status || "CAPTURED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
