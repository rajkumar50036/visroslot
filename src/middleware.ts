import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Redirect legacy /dashboard routes to modern /app routes
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(new URL("/app/overview", request.url));
  }
  if (pathname.startsWith("/dashboard/")) {
    const subpath = pathname.replace(/^\/dashboard\//, "");
    // Map known routes
    if (subpath === "customers") {
      return NextResponse.redirect(new URL("/app/customers", request.url));
    }
    if (subpath === "services") {
      return NextResponse.redirect(new URL("/app/services", request.url));
    }
    if (subpath === "staff") {
      return NextResponse.redirect(new URL("/app/staff", request.url));
    }
    if (subpath === "availability") {
      return NextResponse.redirect(new URL("/app/availability", request.url));
    }
    if (subpath === "analytics") {
      return NextResponse.redirect(new URL("/app/analytics", request.url));
    }
    if (subpath === "settings") {
      return NextResponse.redirect(new URL("/app/settings", request.url));
    }
    return NextResponse.redirect(new URL(`/app/${subpath}`, request.url));
  }

  // 2. Redirect legacy /signup to /register
  if (pathname === "/signup" || pathname === "/signup/") {
    const url = new URL("/register", request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // 3. Protected route check for /super-admin
  if (pathname.startsWith("/super-admin")) {
    const adminSession = request.cookies.get("visroslot_admin_session")?.value;
    if (pathname === "/super-admin/login") {
      if (adminSession) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }
      return NextResponse.next();
    }
    if (!adminSession) {
      const redirectUrl = new URL("/super-admin/login", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. Protected route check for /app and /onboarding
  const isProtectedRoute = pathname.startsWith("/app") || pathname.startsWith("/onboarding");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const sessionToken =
    request.cookies.get("visroslot_session")?.value ||
    request.cookies.get("slotora_session")?.value;

  const isFirebaseActive = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("placeholder")
  );

  const isPreview = request.nextUrl.searchParams.get("preview") === "true";

  if (isFirebaseActive && isProtectedRoute && !sessionToken && !isPreview) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isFirebaseActive && isAuthRoute && sessionToken && !request.nextUrl.searchParams.has("logout")) {
    return NextResponse.redirect(new URL("/app/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/dashboard/:path*",
    "/app/:path*",
    "/onboarding",
    "/login",
    "/signup",
    "/register",
  ],
};
