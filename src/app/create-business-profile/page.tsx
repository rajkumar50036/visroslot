"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CreateBusinessProfileRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("step")) {
      params.set("step", "profile");
    }
    const targetUrl = `/onboarding?${params.toString()}`;
    if (typeof window !== "undefined") {
      window.location.replace(targetUrl);
    } else {
      router.replace(targetUrl);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#101A2B] flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mb-3" />
      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
        Payment authorized! Opening your business profile setup...
      </span>
    </div>
  );
}

export default function CreateBusinessProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#101A2B] flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C49A46] mb-3" />
          <span className="text-xs font-mono text-slate-500">Loading...</span>
        </div>
      }
    >
      <CreateBusinessProfileRedirectContent />
    </Suspense>
  );
}
