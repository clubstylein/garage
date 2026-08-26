import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import {
  authConfig,
} from "./auth.config";

/*
 * 72 hours
 */

const SESSION_MAX_AGE =
  72 * 60 * 60;

export const {
  auth,
  signIn,
  signOut,
  handlers,
} = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(
        credentials
      ) {
        const username =
          typeof credentials
            ?.username ===
          "string"
            ? credentials.username
            : "";

        const password =
          typeof credentials
            ?.password ===
          "string"
            ? credentials.password
            : "";

        const expectedUsername =
          process.env
            .GARAGE_USERNAME;

        const passwordHashBase64 =
          process.env
            .GARAGE_PASSWORD_HASH_B64;

        if (
          !username ||
          !password ||
          !expectedUsername ||
          !passwordHashBase64
        ) {
          return null;
        }

        /*
         * Username check
         */

        if (
          username !==
          expectedUsername
        ) {
          return null;
        }

        /*
         * Decode bcrypt hash
         */

        const passwordHash =
          Buffer.from(
            passwordHashBase64,
            "base64"
          ).toString(
            "utf8"
          );

        /*
         * Password check
         */

        const passwordValid =
          await bcrypt.compare(
            password,
            passwordHash
          );

        if (
          !passwordValid
        ) {
          return null;
        }

        return {
          id: "garage-user",
          name:
            expectedUsername,
        };
      },
    }),
  ],

  /*
   * JWT session means we don't
   * need another database table
   * just for login sessions.
   */

  session: {
    strategy: "jwt",
    maxAge:
      SESSION_MAX_AGE,
  },

  jwt: {
    maxAge:
      SESSION_MAX_AGE,
  },
});