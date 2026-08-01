"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Letter = {
  id: string;
  name: string;
  relationship: string | null;
  letter: string;
  photos: string[];
  page_order: number;
  status: "draft" | "published";
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingLetters, setIsLoadingLetters] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLetters = useCallback(async () => {
    setIsLoadingLetters(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("letters")
      .select(
        `
        id,
        name,
        relationship,
        letter,
        photos,
        page_order,
        status,
        created_at
        `,
      )
      .order("page_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setIsLoadingLetters(false);
      return;
    }

    setLetters((data ?? []) as Letter[]);
    setIsLoadingLetters(false);
  }, []);

  useEffect(() => {
    async function initializeAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      setEmail(session.user.email ?? "");
      setIsCheckingSession(false);

      await loadLetters();
    }

    initializeAdmin();
  }, [loadLetters, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  async function handleDelete(letter: Letter) {
    const shouldDelete = window.confirm(
      `Delete the page from ${letter.name}?`,
    );

    if (!shouldDelete) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("letters")
      .delete()
      .eq("id", letter.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setLetters((currentLetters) =>
      currentLetters.filter(
        (currentLetter) => currentLetter.id !== letter.id,
      ),
    );
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9ec] text-[#4b3532]">
        <p className="text-sm text-[#8e816d]">Loading admin...</p>
      </main>
    );
  }

  const publishedCount = letters.filter(
    (letter) => letter.status === "published",
  ).length;

  const draftCount = letters.filter(
    (letter) => letter.status === "draft",
  ).length;

  return (
    <main className="min-h-screen bg-[#fcf9ec] px-5 py-6 text-[#4b3532] sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-col gap-5 rounded-[30px] border border-[#e7dfc3] bg-[#fffdf6] px-6 py-7 shadow-[0_20px_60px_rgba(96,66,23,0.08)] sm:flex-row sm:items-end sm:justify-between sm:px-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a84d47]">
              Kirstin&apos;s Wedding Book
            </p>

            <h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">
              Letters
            </h1>

            <p className="mt-3 text-sm text-[#80735f]">
              Signed in as {email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#ddd3b4] bg-white/60 px-5 text-sm font-semibold transition hover:bg-white"
            >
              View Book
            </a>

            <button
              type="button"
              onClick={handleSignOut}
              className="h-11 rounded-full bg-[#4b3532] px-5 text-sm font-semibold text-white transition hover:bg-[#634843]"
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="mt-5 rounded-[30px] border border-[#e7dfc3] bg-[#fffdf6] p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9a8c75]">
                Book Pages
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Manage Letters
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#ded4b7] bg-[#faf6e8] px-3 py-1.5 text-xs text-[#796d5b]">
                  {letters.length} total
                </span>

                <span className="rounded-full border border-[#c8d8c6] bg-[#eef5ec] px-3 py-1.5 text-xs text-[#587057]">
                  {publishedCount} published
                </span>

                <span className="rounded-full border border-[#e3d5b7] bg-[#faf3df] px-3 py-1.5 text-xs text-[#866f45]">
                  {draftCount} drafts
                </span>
              </div>
            </div>

            <a
              href="/admin/letters/new"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#b73b38] px-6 text-sm font-semibold text-[#fffdf6] transition hover:-translate-y-0.5 hover:bg-[#9f2f2d]"
            >
              Add Page
            </a>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-[16px] border border-[#d9a7a2] bg-[#f9e9e7] px-4 py-3 text-sm text-[#8f3733]">
              {errorMessage}
            </div>
          )}

          <div className="mt-7">
            {isLoadingLetters ? (
              <div className="rounded-[22px] border border-dashed border-[#d8ceb0] bg-[#faf6e8] px-6 py-16 text-center">
                <p className="text-sm text-[#857762]">
                  Loading letters...
                </p>
              </div>
            ) : letters.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#d8ceb0] bg-[#faf6e8] px-6 py-16 text-center">
                <p className="font-serif text-3xl tracking-[-0.03em]">
                  No letters yet
                </p>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#857762]">
                  Click Add Page to paste the first letter and optionally upload
                  photos.
                </p>

                <a
                  href="/admin/letters/new"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#b73b38] px-6 text-sm font-semibold text-[#fffdf6] transition hover:bg-[#9f2f2d]"
                >
                  Add First Page
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {letters.map((letter, index) => (
                  <article
                    key={letter.id}
                    className="flex flex-col gap-5 rounded-[20px] border border-[#e4dbc0] bg-[#faf7eb] px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-[#ded4b7] bg-white/70 px-2 text-xs font-semibold text-[#7b6e5b]">
                          {letter.page_order || index + 1}
                        </span>

                        <h3 className="font-serif text-2xl tracking-[-0.03em]">
                          {letter.name}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            letter.status === "published"
                              ? "border-[#c8d8c6] bg-[#eef5ec] text-[#587057]"
                              : "border-[#e3d5b7] bg-[#faf3df] text-[#866f45]"
                          }`}
                        >
                          {letter.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8b7e69]">
                        {letter.relationship && (
                          <span>{letter.relationship}</span>
                        )}

                        <span>
                          {letter.photos?.length ?? 0}{" "}
                          {(letter.photos?.length ?? 0) === 1
                            ? "photo"
                            : "photos"}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#6f6253]">
                        {letter.letter}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={`/admin/letters/${letter.id}/edit`}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8ceb0] bg-white/70 px-4 text-sm font-semibold transition hover:bg-white"
                      >
                        Edit
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(letter)}
                        className="h-10 rounded-full border border-[#dfbbb7] bg-[#fbefed] px-4 text-sm font-semibold text-[#9a3d38] transition hover:bg-[#f7dfdc]"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}