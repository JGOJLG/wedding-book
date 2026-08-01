"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/admin");
        return;
      }

      setIsCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(
        error.message === "Invalid login credentials"
          ? "The email or password is incorrect."
          : error.message,
      );

      setIsLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9ec] text-[#4b3532]">
        <p className="text-sm text-[#8e816d]">Opening admin...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcf9ec] px-5 py-10 text-[#4b3532]">
      <div className="absolute left-[-100px] top-[-80px] h-80 w-80 rounded-full bg-[#fffdf6] blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-80px] h-96 w-96 rounded-full bg-[#b73b38]/8 blur-3xl" />

      <section className="relative w-full max-w-[520px] overflow-hidden rounded-[32px] border border-[#e7dfc3] bg-[#fffdf6] shadow-[0_30px_90px_rgba(96,66,23,0.1)]">
        <div className="h-3 bg-[#b73b38]" />

        <div className="px-7 py-10 sm:px-11 sm:py-12">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#a84d47]">
              Kirstin&apos;s Wedding Book
            </p>

            <h1 className="mt-5 font-serif text-5xl tracking-[-0.05em] text-[#4b3532]">
              Admin
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#7f725f]">
              Sign in to add, edit, organize, and publish letters.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-10 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c7c65]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 w-full rounded-[15px] border border-[#ddd3b4] bg-white/70 px-4 text-sm text-[#4b3532] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b73b38]/50 focus:ring-4 focus:ring-[#b73b38]/8"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c7c65]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-12 w-full rounded-[15px] border border-[#ddd3b4] bg-white/70 px-4 text-sm text-[#4b3532] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b73b38]/50 focus:ring-4 focus:ring-[#b73b38]/8"
              />
            </div>

            {errorMessage && (
              <div className="rounded-[15px] border border-[#d9a7a2] bg-[#f9e9e7] px-4 py-3 text-sm text-[#8f3733]">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-full bg-[#b73b38] px-6 text-sm font-semibold text-[#fffdf6] shadow-[0_12px_26px_rgba(128,45,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[#9f2f2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <a
            href="/"
            className="mt-8 block text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#94866f] transition hover:text-[#b73b38]"
          >
            Back to the book
          </a>
        </div>
      </section>
    </main>
  );
}