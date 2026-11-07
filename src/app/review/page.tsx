"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReviewPage from "./[token]/page";
import { Loader2 } from "lucide-react";

function ReviewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Review Token Required</h1>
        <p className="text-xs text-slate-500 dark:text-navy-400 mt-2">
          Please use the link provided in your completed appointment confirmation email.
        </p>
      </div>
    );
  }

  return <ReviewPage params={{ token }} />;
}

export default function ReviewRootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F3] dark:bg-[#10251D] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#046A38]" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
