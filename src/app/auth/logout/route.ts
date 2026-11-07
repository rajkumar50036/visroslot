import { NextResponse } from "next/server";

function getSafeOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  
  // Clean IPv6 unspecified address [::] or 0.0.0.0
  let cleanHost = host;
  if (cleanHost.includes("[::]") || cleanHost.startsWith("0.0.0.0")) {
    cleanHost = cleanHost.replace("[::]", "localhost").replace("0.0.0.0", "localhost");
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("[::]")) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  return `${proto}://${cleanHost}`;
}

function createLogoutResponse(request: Request) {
  const origin = getSafeOrigin(request);
  const isJson = request.headers.get("accept")?.includes("application/json");

  let response: NextResponse;
  if (isJson) {
    response = NextResponse.json({ success: true, message: "Signed out successfully" });
  } else {
    response = NextResponse.redirect(`${origin}/login?logout=true`, { status: 303 });
  }

  const cookieOptions = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax" as const,
  };

  // Expire and delete both modern and legacy session tokens
  response.cookies.set("visroslot_session", "", cookieOptions);
  response.cookies.set("slotora_session", "", cookieOptions);
  response.cookies.delete("visroslot_session");
  response.cookies.delete("slotora_session");

  return response;
}

export async function POST(request: Request) {
  return createLogoutResponse(request);
}

export async function GET(request: Request) {
  return createLogoutResponse(request);
}
