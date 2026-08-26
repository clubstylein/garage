"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  signIn,
} from "next-auth/react";

import {
  useRouter,
} from "next/navigation";

export default function LoginForm() {
  const router =
    useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result =
        await signIn(
          "credentials",
          {
            username,
            password,

            /*
             * We handle navigation
             * ourselves.
             */
            redirect: false,
          }
        );

      if (
        !result ||
        result.error
      ) {
        setError(
          "Invalid username or password."
        );

        return;
      }

      /*
       * Successful login.
       */

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mt-6 space-y-5"
    >
      {/* USERNAME */}

      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Username
        </label>

        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          className="w-full rounded-lg border border-[#d8dce1] bg-white px-4 py-3 text-sm text-[#1d2228] placeholder:text-gray-300 outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]"
        />
      </div>

      {/* PASSWORD */}

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full rounded-lg border border-[#d8dce1] bg-white px-4 py-3 text-sm text-[#1d2228] placeholder:text-gray-300 outline-none focus:border-[#7c828a] focus:ring-1 focus:ring-[#7c828a]"
        />
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUBMIT */}

      <button
        type="submit"
        disabled={
          loading
        }
        className="w-full rounded-lg bg-[#1d2228] px-5 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Signing in..."
          : "Sign In"}
      </button>
    </form>
  );
}