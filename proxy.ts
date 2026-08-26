import NextAuth from "next-auth";

import {
  authConfig,
} from "./auth.config";

export default NextAuth(
  authConfig
).auth;

export const config = {
  matcher: [
    /*
     * Protect everything except:
     *
     * - login page
     * - Auth.js API
     * - Next.js assets
     * - public images
     */

    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};