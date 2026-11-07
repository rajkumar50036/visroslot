"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Loader2,
  Instagram,
} from "lucide-react";
import { getFirebaseClient } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { VisroContactPhone } from "@/components/brand/VisroSlotLogo";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    const { auth, db } = getFirebaseClient();

    try {
      const uid =
        auth?.currentUser?.uid ||
        (typeof document !== "undefined" &&
          (document.cookie.match(/visroslot_session=([^;]+)/)?.[1] ||
            document.cookie.match(/slotora_session=([^;]+)/)?.[1])) ||
        "anonymous";

      if (db) {
        const docRef = await addDoc(collection(db, "support_tickets"), {
          user_id: uid,
          subject: subject.trim(),
          priority,
          message: message.trim(),
          status: "open",
          created_at: new Date().toISOString(),
        });
        setTicketId(docRef.id);
      } else {
        setTicketId(`TKT-${Date.now().toString().slice(-6)}`);
      }

      setTicketSent(true);
      setSubject("");
      setMessage("");
    } catch (e) {
      console.error("Support ticket error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-navy-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-navy-950">
            Dedicated Engineering & Onboarding Support
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Direct access to VisroSlot technical architects and founding engineers
          </p>
        </div>

        <VisroContactPhone variant="dark" />
      </div>

      {/* Top 3 Direct Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-navy-950 text-white border border-gold-500/30 shadow-gold space-y-3">
          <span className="font-mono text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <Instagram className="w-3.5 h-3.5 text-pink-400" /> INSTAGRAM HELP & SUPPORT
          </span>
          <h3 className="font-display text-lg font-bold">Official Instagram DM</h3>
          <p className="text-xs text-navy-300">
            Immediate assistance with booking conflicts, custom setup, or billing queries.
          </p>
          <div className="pt-2">
            <a
              href="https://www.instagram.com/visroslot?rpxt=dGNmc2E4eGR5c3J0"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm font-black text-gold-300 hover:text-pink-300 hover:underline flex items-center gap-1.5"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>@visroslot</span>
            </a>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-3">
          <span className="font-mono text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> DEDICATED INBOX
          </span>
          <h3 className="font-display text-lg font-bold text-navy-950">Architecture & Data</h3>
          <p className="text-xs text-navy-500">
            Submit custom CSV rosters or request enterprise multi-tenant configuration.
          </p>
          <div className="pt-2">
            <a
              href="mailto:support@visroslot.com"
              className="font-mono text-xs font-bold text-navy-950 hover:underline"
            >
              support@visroslot.com
            </a>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-3">
          <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> WHITE-GLOVE SERVICE
          </span>
          <h3 className="font-display text-lg font-bold text-navy-950">Concierge Roster Setup</h3>
          <p className="text-xs text-navy-500">
            We will input your full staff roster, service catalog, and timings at zero charge.
          </p>
          <div className="pt-2">
            <span className="text-xs font-mono font-bold text-emerald-700">Included in all plans</span>
          </div>
        </div>
      </div>

      {/* Ticket Submission Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-navy-200 shadow-sm space-y-6">
        <h2 className="font-display text-lg font-black uppercase text-navy-950 border-b border-navy-100 pb-3">
          Dispatch Support Ticket
        </h2>

        {ticketSent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-navy-950">
              Support Ticket Logged #{ticketId.slice(0, 8)}
            </h3>
            <p className="text-xs text-navy-500 max-w-sm mx-auto">
              Our engineering team has received your inquiry. An engineer will follow up shortly or contact you via telephone.
            </p>
            <button
              onClick={() => setTicketSent(false)}
              className="px-4 py-2 rounded-xl bg-navy-950 text-gold-400 font-mono text-xs font-bold mt-2"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question on Razorpay renewal or staff shift"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
                  Urgency Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 font-mono focus:outline-none focus:border-gold-500"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent (Needs immediate attention)</option>
                  <option value="critical">Critical (Booking outage)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-navy-600 mb-1.5">
                Detailed Message *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the problem or requirement with as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-navy-50/50 border border-navy-200 rounded-xl text-navy-950 focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-navy-950 text-gold-400 font-mono text-xs font-bold hover:bg-navy-900 shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-gold-400" /> : <MessageSquare className="w-4 h-4" />}
              <span>{loading ? "Transmitting..." : "Send Ticket"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
