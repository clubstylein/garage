"use client";
import {
  signOut,
} from "next-auth/react";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  function isActive(section: string) {
    if (section === "garage") {
      return pathname === "/";
    }

    if (section === "vehicles") {
      return pathname.startsWith("/vehicles");
    }

    if (section === "work") {
      return pathname.startsWith("/work");
    }

    if (section === "parts") {
      return pathname.startsWith("/parts");
    }

    if (section === "billing") {
      return pathname.startsWith("/billing");
    }

    if (section === "ai") {
      return pathname.startsWith("/ai");
    }

    return false;
  }

  return (
    <header className="border-b border-[#e1e4e8] bg-white">
  <div className="flex items-center justify-between px-5 py-2 lg:px-8">
    <div className="flex items-center gap-7">
      {/* LOGO */}

      <Link
        href="/"
        className="flex shrink-0 items-center"
      >
        <img
          src="/clubstyle-garage-logo.png"
          alt="ClubStyle India Garage"
          className="h-10 w-auto max-w-[220px] object-contain"
        />
      </Link>

      {/* NAVIGATION */}

      <nav className="flex items-center gap-1">
        <NavLink
          href="/"
          active={
            isActive(
              "garage"
            )
          }
        >
          Garage
        </NavLink>

        <NavLink
          href="/vehicles"
          active={
            isActive(
              "vehicles"
            )
          }
        >
          Vehicles
        </NavLink>

        <NavLink
          href="/work"
          active={
            isActive(
              "work"
            )
          }
        >
          Work
        </NavLink>

        <NavLink
          href="/parts"
          active={
            isActive(
              "parts"
            )
          }
        >
          Parts
        </NavLink>

        <NavLink
          href="/billing"
          active={
            isActive(
              "billing"
            )
          }
        >
          Billing
        </NavLink>

        <NavLink
          href="/ai"
          active={
            isActive(
              "ai"
            )
          }
        >
          AI
        </NavLink>
      </nav>
    </div>

    {/* LOGOUT */}

  <button
  type="button"
  onClick={() =>
    signOut({
      callbackUrl:
        "/login",
    })
  }
  className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-[#1d2228]"
>
  Logout
</button>

  </div>
</header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#f0f1f3] text-[#1d2228]"
          : "text-gray-500 hover:bg-gray-50 hover:text-[#1d2228]"
      }`}
    >
      {children}
    </Link>
  );
}