import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  const mustChange = Boolean(req.auth?.user?.mustChangePassword);
  if (mustChange && !pathname.startsWith("/change-password")) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl));
  }

  if (!mustChange && pathname.startsWith("/change-password")) {
    return NextResponse.redirect(new URL("/chat", req.nextUrl));
  }

  if (pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN" && role !== "MODERATOR") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/chat/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/report/:path*",
    "/change-password",
  ],
};
