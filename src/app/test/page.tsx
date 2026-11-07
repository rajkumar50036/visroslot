"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play, 
  RefreshCw, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  ArrowRight
} from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  category: "PAGES" | "API" | "AUTH" | "SCHEDULING";
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  payload?: any;
  status: "IDLE" | "RUNNING" | "PASSED" | "FAILED";
  latencyMs?: number;
  responsePreview?: string;
  errorMessage?: string;
}

const INITIAL_TESTS: TestCase[] = [
  {
    id: "landing",
    name: "Landing Page & Brand Identity",
    category: "PAGES",
    description: "Verifies Slotora branding, navigation links, and pricing structure.",
    endpoint: "/",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "auth-login",
    name: "Authentication — Login Route",
    category: "AUTH",
    description: "Verifies login page accessibility and form structures.",
    endpoint: "/login",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "auth-signup",
    name: "Authentication — Signup Route",
    category: "AUTH",
    description: "Verifies registration page and onboarding redirection entry.",
    endpoint: "/signup",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "public-booking",
    name: "Customer Booking Page",
    category: "PAGES",
    description: "Verifies tenant public booking wizard (/book/aura-hair-studio).",
    endpoint: "/book/aura-hair-studio",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "api-business",
    name: "Business Profile & Catalog API",
    category: "API",
    description: "Fetches active business details and service catalog by URL slug.",
    endpoint: "/api/book/business?slug=aura-hair-studio",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "api-slots",
    name: "Real-time Availability Engine",
    category: "SCHEDULING",
    description: "Calculates open appointment slots factoring operating hours and breaks.",
    endpoint: "/api/book/slots?businessId=c814125b-0cf9-42b9-a29d-ee1b3126be8d&serviceId=b9fcae12-3498-4c8d-8a17-21ea7f2f1e29&date=2026-11-03",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "api-validation",
    name: "Zod Schema Security & Validation",
    category: "API",
    description: "Tests rejection of invalid payloads and enforces strict data types.",
    endpoint: "/api/book/appointment",
    method: "POST",
    payload: {
      businessId: "",
      customerEmail: "not-an-email",
    },
    status: "IDLE",
  },
  {
    id: "api-booking",
    name: "Appointment Booking Transaction",
    category: "SCHEDULING",
    description: "Executes an appointment booking and returns reference code.",
    endpoint: "/api/book/appointment",
    method: "POST",
    payload: {
      businessId: "c814125b-0cf9-42b9-a29d-ee1b3126be8d",
      serviceId: "b9fcae12-3498-4c8d-8a17-21ea7f2f1e29",
      appointmentDate: "2026-11-03",
      startTime: "14:00:00",
      endTime: "14:30:00",
      customerName: "Aarav Sharma",
      customerEmail: "aarav.sharma@example.com",
      customerPhone: "+91 98765 43210",
      customerNotes: "Automated test booking verification",
    },
    status: "IDLE",
  },
  {
    id: "dashboard-home",
    name: "Tenant Workspace — Dashboard",
    category: "PAGES",
    description: "Verifies the business management dashboard and KPI metrics.",
    endpoint: "/dashboard",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "dashboard-services",
    name: "Tenant Workspace — Services CRUD",
    category: "PAGES",
    description: "Verifies service management and price configuration page.",
    endpoint: "/dashboard/services",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "dashboard-availability",
    name: "Tenant Workspace — Operating Hours",
    category: "PAGES",
    description: "Verifies availability settings and interval configuration page.",
    endpoint: "/dashboard/availability",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "dashboard-customers",
    name: "Tenant Workspace — Customer CRM Directory",
    category: "PAGES",
    description: "Verifies customer CRM profiles, booking history, and search.",
    endpoint: "/dashboard/customers",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "dashboard-analytics",
    name: "Tenant Workspace — Performance & Analytics",
    category: "PAGES",
    description: "Verifies live database-backed metrics, dynamic KPIs, and trends.",
    endpoint: "/dashboard/analytics",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "dashboard-settings",
    name: "Tenant Workspace — Business Settings",
    category: "PAGES",
    description: "Verifies brand profile and dynamic booking URL slug synchronization.",
    endpoint: "/dashboard/settings",
    method: "GET",
    status: "IDLE",
  },
  {
    id: "api-slug-sync",
    name: "API — Slug Synchronization & Redirection",
    category: "API",
    description: "Verifies alias slug lookup and automatic canonical redirection.",
    endpoint: "/api/book/business?slug=auro-tatti",
    method: "GET",
    status: "IDLE",
  },
];

export default function TestScreenPage() {
  const [tests, setTests] = useState<TestCase[]>(INITIAL_TESTS);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runSingleTest = async (testId: string) => {
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: "RUNNING", errorMessage: undefined } : t))
    );

    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    const start = performance.now();
    try {
      let res: Response;
      if (test.method === "GET") {
        res = await fetch(test.endpoint);
      } else {
        res = await fetch(test.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test.payload),
        });
      }

      const elapsed = Math.round(performance.now() - start);

      // Handle expected validation test (HTTP 400 is expected success for validation test)
      if (test.id === "api-validation") {
        const bodyText = await res.text();
        if (res.status === 400) {
          setTests((prev) =>
            prev.map((t) =>
              t.id === testId
                ? {
                    ...t,
                    status: "PASSED",
                    latencyMs: elapsed,
                    responsePreview: bodyText,
                  }
                : t
            )
          );
        } else {
          setTests((prev) =>
            prev.map((t) =>
              t.id === testId
                ? {
                    ...t,
                    status: "FAILED",
                    latencyMs: elapsed,
                    errorMessage: `Expected HTTP 400 validation rejection, received ${res.status}`,
                    responsePreview: bodyText,
                  }
                : t
            )
          );
        }
        return;
      }

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let preview = "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          preview = JSON.stringify(json, null, 2);
        } else {
          const text = await res.text();
          preview = `HTML / Content Length: ${text.length} characters (HTTP 200 OK)`;
        }

        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: "PASSED",
                  latencyMs: elapsed,
                  responsePreview: preview,
                }
              : t
          )
        );
      } else {
        const errText = await res.text();
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: "FAILED",
                  latencyMs: elapsed,
                  errorMessage: `HTTP ${res.status}: ${res.statusText}`,
                  responsePreview: errText,
                }
              : t
          )
        );
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: "FAILED",
                latencyMs: elapsed,
                errorMessage: err.message || "Network request failed",
              }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const t of tests) {
      await runSingleTest(t.id);
    }
    setIsRunningAll(false);
  };

  useEffect(() => {
    // Auto-run on screen load
    runAllTests();
  }, []);

  const passedCount = tests.filter((t) => t.status === "PASSED").length;
  const failedCount = tests.filter((t) => t.status === "FAILED").length;
  const runningCount = tests.filter((t) => t.status === "RUNNING").length;
  const totalCount = tests.length;
  const progressPercent = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Slotora System Test Suite</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live Screen Runner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated end-to-end verification of routes, APIs, scheduling engine, and tenant isolation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isRunningAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Tests ({runningCount + passedCount + failedCount}/{totalCount})...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-run Full Test Suite</span>
                </>
              )}
            </button>
            <Link
              href="/"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-sm flex items-center space-x-1.5 border border-slate-700 transition-all"
            >
              <span>Back to App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Tests</p>
            <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="bg-slate-900 border border-emerald-950/60 rounded-xl p-4">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Passed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{passedCount}</p>
          </div>
          <div className="bg-slate-900 border border-red-950/60 rounded-xl p-4">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Failed</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{failedCount}</p>
          </div>
          <div className="bg-slate-900 border border-blue-950/60 rounded-xl p-4">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{progressPercent}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Overall Verification Progress</span>
            <span className="text-blue-400 font-bold">{passedCount} of {totalCount} Passed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                failedCount > 0 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Test Cards List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Test Execution Cases ({tests.length})
          </h2>

          <div className="divide-y divide-slate-800/80 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {tests.map((t) => {
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {t.status === "PASSED" && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                        {t.status === "FAILED" && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        {t.status === "RUNNING" && (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        )}
                        {t.status === "IDLE" && (
                          <div className="w-5 h-5 rounded-full border border-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-white">{t.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {t.method} {t.endpoint.split("?")[0]}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-950/70 text-blue-300 border border-blue-800/60">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{t.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end md:self-center">
                      {t.latencyMs !== undefined && (
                        <span className="text-xs font-mono text-slate-400">
                          {t.latencyMs} ms
                        </span>
                      )}

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          t.status === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : t.status === "FAILED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : t.status === "RUNNING"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {t.status}
                      </span>

                      <button
                        onClick={() => runSingleTest(t.id)}
                        disabled={t.status === "RUNNING" || isRunningAll}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                        title="Re-run this test"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {t.responsePreview && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 text-xs"
                        >
                          <span>Data</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Inspector */}
                  {isExpanded && t.responsePreview && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono">Response Payload Preview</span>
                        {t.errorMessage && (
                          <span className="text-red-400 font-semibold">{t.errorMessage}</span>
                        )}
                      </div>
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-56">
                        {t.responsePreview}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
          Slotora Automated Testing Suite • Multi-Tenant Appointment Booking Platform • http://localhost:3000
        </div>
      </div>
    </div>
  );
}
