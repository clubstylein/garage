import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({
      auth,
      request: { nextUrl },
    }) {
      const loggedIn =
        Boolean(auth?.user);

      /*
       * Auth.js must be able to use
       * its own API routes.
       */
      if (
        nextUrl.pathname.startsWith(
          "/api/auth"
        )
      ) {
        return true;
      }

      /*
       * Return proper 401 for our
       * application API calls.
       */
      if (
        nextUrl.pathname.startsWith(
          "/api/"
        )
      ) {
        if (loggedIn) {
          return true;
        }

        return Response.json(
          {
            error:
              "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      /*
       * Protect all application pages.
       */
      return loggedIn;
    },
  },

  providers: [],
} satisfies NextAuthConfig;