import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-5">
      <div className="w-full max-w-md">
        {/* LOGIN CARD */}

<div className="rounded-2xl border border-[#dfe2e6] bg-white p-8 text-[#1d2228]">
          {/* LOGO */}

          <div className="flex justify-center">
            <img
              src="/clubstyle-garage-logo.png"
              alt="ClubStyle India Garage"
              className="h-14 w-auto max-w-[280px] object-contain"
            />
          </div>

          {/* TITLE */}

          <div className="mt-7 text-center">
<h1 className="text-2xl font-semibold tracking-tight text-[#1d2228]">
                Garage Login
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to access ClubStyle Garage
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          ClubStyle India Garage
        </p>
      </div>
    </main>
  );
}