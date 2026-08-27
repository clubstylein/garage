"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  function isActive(section: string) {
    if (section === "garage") return pathname === "/";
    if (section === "vehicles") return pathname.startsWith("/vehicles");
    if (section === "work") return pathname.startsWith("/work");
    return false;
  }

  return (
    <header className="border-b border-[#e1e4e8] bg-white">
      <div className="px-3 py-2 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/clubstyle-garage-logo.png"
              alt="ClubStyle India Garage"
              className="h-8 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[220px]"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-between gap-3 sm:flex">
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
              <NavLink href="/" active={isActive("garage")}>Garage</NavLink>
              <NavLink href="/vehicles" active={isActive("vehicles")}>Vehicles</NavLink>
              <NavLink href="/work" active={isActive("work")}>Work</NavLink>
            </nav>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="h-10 shrink-0 rounded-lg px-4 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-[#1d2228]"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-10 shrink-0 rounded-lg px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-[#1d2228] sm:hidden"
          >
            Logout
          </button>
        </div>

        <nav className="mt-2 flex items-center gap-1 overflow-x-auto pb-1 sm:hidden">
          <NavLink href="/" active={isActive("garage")}>Garage</NavLink>
          <NavLink href="/vehicles" active={isActive("vehicles")}>Vehicles</NavLink>
          <NavLink href="/work" active={isActive("work")}>Work</NavLink>
        </nav>
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
      className={`h-10 shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
        active
          ? "bg-[#f0f1f3] text-[#1d2228]"
          : "text-gray-500 hover:bg-gray-50 hover:text-[#1d2228]"
      }`}
    >
      {children}
    </Link>
  );
}
