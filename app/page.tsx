"use client";

import dynamic from "next/dynamic";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

const HTMLFlipBook = dynamic(
  () => import("react-pageflip"),
  {
    ssr: false,
  },
) as any;

type Letter = {
  id: string;
  name: string;
  relationship: string | null;
  letter: string;
  photos: string[];
  page_order: number;
};

type FlipBookRef = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    flip: (pageNumber: number) => void;
  };
};

type FlipEvent = {
  data: number;
};

export default function Home() {
  const flipBookRef = useRef<FlipBookRef | null>(null);

  const [letters, setLetters] = useState<Letter[]>([]);
  const [bookOpened, setBookOpened] = useState(false);
  const [currentPhysicalPage, setCurrentPhysicalPage] =
    useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLetters = useCallback(async () => {
    setIsLoading(true);
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
        page_order
        `,
      )
      .eq("status", "published")
      .order("page_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage("The book could not be loaded.");
      setIsLoading(false);
      return;
    }

    setLetters((data ?? []) as Letter[]);
    setCurrentPhysicalPage(0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  const totalPhysicalPages = letters.length * 2;

  const currentLetterIndex = Math.min(
    Math.floor(currentPhysicalPage / 2),
    Math.max(letters.length - 1, 0),
  );

  function goToPreviousPage() {
    flipBookRef.current?.pageFlip().flipPrev();
  }

  function goToNextPage() {
    flipBookRef.current?.pageFlip().flipNext();
  }

  function goToLetter(letterIndex: number) {
    const firstPageOfLetter = letterIndex * 2;

    flipBookRef.current
      ?.pageFlip()
      .flip(firstPageOfLetter);
  }

  function handleFlip(event: FlipEvent) {
    setCurrentPhysicalPage(event.data);
  }

  function closeBook() {
    setBookOpened(false);
    setCurrentPhysicalPage(0);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9ec] px-5 text-[#4b3532]">
        <p className="text-sm text-[#8e816d]">
          Opening the book...
        </p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9ec] px-5 text-[#4b3532]">
        <section className="paper-texture book-shadow w-full max-w-md rounded-[28px] border border-[#e7dfc3] bg-[#fffdf6] p-8 text-center">
          <p className="font-book text-4xl font-medium tracking-[-0.04em]">
            Something went wrong
          </p>

          <p className="mt-3 text-sm leading-6 text-[#80735f]">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={loadLetters}
            className="mt-6 h-11 rounded-full bg-[#b73b38] px-6 text-sm font-semibold text-[#fffdf6] transition hover:-translate-y-0.5 hover:bg-[#97312f]"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (!bookOpened) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcf9ec] px-5 py-8 text-[#4b3532]">
        <FloralBackground />

        <div className="absolute left-[-100px] top-[-60px] h-80 w-80 rounded-full bg-[#fffdf6] blur-3xl" />

        <div className="absolute bottom-[-120px] right-[-70px] h-96 w-96 rounded-full bg-[#b73b38]/8 blur-3xl" />

        <section className="paper-texture book-shadow relative z-10 w-full max-w-[780px] overflow-hidden rounded-[34px] border border-[#e7dfc3] bg-[#fffdf6]">
          <div className="grid min-h-[720px] md:grid-cols-[76px_1fr]">
            <div className="hidden border-r border-[#e7dfc3] bg-[#b73b38] md:block" />

            <div className="relative flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-14">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#a84d47]">
                  A collection of letters
                </p>

                <span className="text-xs text-[#9a8c74]">
                  2026
                </span>
              </div>

              <div className="py-16 text-center sm:py-20">
                <p className="text-sm uppercase tracking-[0.28em] text-[#a39176]">
                  For
                </p>

                <h1 className="mt-5 font-book text-[clamp(5.5rem,14vw,10rem)] font-medium leading-[0.78] tracking-[-0.07em] text-[#4b3532]">
                  Kirstin
                </h1>

                <div className="mx-auto mt-10 h-[2px] w-20 bg-[#b73b38]" />

                <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-[#74675a] sm:text-base">
                  A book of memories, love, and letters
                  from the people who know and love you
                  most.
                </p>
              </div>

              <div className="flex flex-col items-center">
                {letters.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setBookOpened(true)}
                    className="rounded-full bg-[#b73b38] px-8 py-4 text-sm font-semibold text-[#fffdf6] shadow-[0_14px_30px_rgba(128,45,42,0.14)] transition duration-300 hover:-translate-y-1 hover:bg-[#97312f]"
                  >
                    Open the Book
                  </button>
                ) : (
                  <p className="text-sm text-[#80735f]">
                    The first pages are being prepared.
                  </p>
                )}

                <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-[#a89b84]">
                  Made with love
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcf9ec] px-3 py-4 text-[#4b3532] sm:px-6 sm:py-6">
      <FloralBackground />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        <header className="mb-4 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={closeBook}
            className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8e4a43] transition hover:text-[#b73b38]"
          >
            Close Book
          </button>

          <p className="text-xs text-[#8e816d]">
            Letter {currentLetterIndex + 1} of{" "}
            {letters.length}
          </p>
        </header>

        <section className="flex w-full justify-center">
          <HTMLFlipBook
            ref={flipBookRef}
            width={620}
            height={760}
            size="stretch"
            minWidth={290}
            maxWidth={680}
            minHeight={560}
            maxHeight={820}
            startPage={0}
            drawShadow={true}
            flippingTime={950}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.28}
            showCover={false}
            mobileScrollSupport={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            className="w-full"
            style={{ margin: "0 auto" }}
            onFlip={handleFlip}
          >
            {letters.flatMap((letter, letterIndex) => [
              <LetterBookPage
                key={`${letter.id}-letter`}
                letter={letter}
                pageNumber={letterIndex + 1}
              />,

              <MemoryBookPage
                key={`${letter.id}-memory`}
                letter={letter}
              />,
            ])}
          </HTMLFlipBook>
        </section>

        <nav className="mx-auto mt-5 flex max-w-[1300px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={currentPhysicalPage === 0}
            className="rounded-full border border-[#ddd3b4] bg-[#fffdf6]/90 px-4 py-3 text-xs font-semibold text-[#76443f] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 sm:px-6 sm:text-sm"
          >
            ← Previous Page
          </button>

          <div className="hidden max-w-[60%] flex-wrap items-center justify-center gap-2 sm:flex">
            {letters.map((letter, index) => (
              <button
                key={letter.id}
                type="button"
                onClick={() => goToLetter(index)}
                aria-label={`Open letter from ${letter.name}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === currentLetterIndex
                    ? "bg-[#b73b38]"
                    : "bg-[#d9cfb1] hover:bg-[#ae9980]"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={
              currentPhysicalPage >=
              totalPhysicalPages - 1
            }
            className="rounded-full bg-[#b73b38] px-4 py-3 text-xs font-semibold text-[#fffdf6] shadow-[0_10px_22px_rgba(128,45,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[#97312f] disabled:cursor-not-allowed disabled:opacity-35 sm:px-6 sm:text-sm"
          >
            Next Page →
          </button>
        </nav>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-[#a99b84] sm:hidden">
          Swipe the page to continue
        </p>
      </div>
    </main>
  );
}

const LetterBookPage = forwardRef<
  HTMLDivElement,
  {
    letter: Letter;
    pageNumber: number;
  }
>(function LetterBookPage(
  { letter, pageNumber },
  ref,
) {
  return (
    <article
      ref={ref}
      className="h-full overflow-hidden bg-[#fffdf6]"
    >
      <div className="paper-texture relative flex h-full flex-col overflow-hidden border border-[#e7dfc3] bg-[#fffdf6] px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute left-0 top-0 h-full w-2.5 bg-[#b73b38]" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pl-2 pr-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#a84d47] sm:text-[10px]">
            A letter from
          </p>

          <h2 className="mt-4 font-book text-5xl font-medium leading-none tracking-[-0.055em] text-[#4b3532] sm:text-7xl">
            {letter.name}
          </h2>

          {letter.relationship && (
            <p className="mt-3 text-xs text-[#8f806a] sm:text-sm">
              {letter.relationship}
            </p>
          )}

          <div className="mt-8 whitespace-pre-line font-book text-[17px] font-medium leading-[1.65] tracking-[-0.01em] text-[#594844] sm:mt-10 sm:text-[20px] sm:leading-[1.7]">
            {letter.letter}
          </div>
        </div>

        <div className="flex items-end justify-between pl-2 pt-6">
          <p className="text-[9px] uppercase tracking-[0.24em] text-[#a4947c] sm:text-[10px]">
            For Kirstin
          </p>

          <p className="text-xs text-[#988b76]">
            {String(pageNumber).padStart(2, "0")}
          </p>
        </div>
      </div>
    </article>
  );
});

const MemoryBookPage = forwardRef<
  HTMLDivElement,
  {
    letter: Letter;
  }
>(function MemoryBookPage({ letter }, ref) {
  const hasPhotos = letter.photos.length > 0;

  return (
    <article
      ref={ref}
      className="h-full overflow-hidden bg-[#f8f2d9]"
    >
      {hasPhotos ? (
        <PhotoPage
          photos={letter.photos}
          personName={letter.name}
        />
      ) : (
        <NoPhotoPage personName={letter.name} />
      )}
    </article>
  );
});

function PhotoPage({
  photos,
  personName,
}: {
  photos: string[];
  personName: string;
}) {
  if (photos.length === 1) {
    return (
      <div className="h-full bg-[#f8f2d9] p-4 sm:p-6">
        <div className="h-full overflow-hidden rounded-[20px] border border-[#fffdf6] bg-[#f5efd9] shadow-[0_12px_30px_rgba(99,74,25,0.07)]">
          <img
            src={photos[0]}
            alt={`${personName} memory`}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid h-full grid-rows-2 gap-3 bg-[#f8f2d9] p-4 sm:grid-cols-2 sm:grid-rows-1 sm:gap-4 sm:p-6">
        {photos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            className="min-h-0 overflow-hidden rounded-[20px] border border-[#fffdf6] bg-[#f5efd9] shadow-[0_12px_30px_rgba(99,74,25,0.07)]"
          >
            <img
              src={photo}
              alt={`${personName} memory ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full bg-[#f8f2d9] p-4 sm:p-6">
      <div className="grid h-full grid-cols-2 gap-3 sm:gap-4">
        {photos.slice(0, 6).map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            className={`min-h-0 overflow-hidden rounded-[18px] border border-[#fffdf6] bg-[#f5efd9] shadow-[0_12px_30px_rgba(99,74,25,0.07)] ${
              index === 0 && photos.length === 3
                ? "col-span-2"
                : ""
            }`}
          >
            <img
              src={photo}
              alt={`${personName} memory ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NoPhotoPage({
  personName,
}: {
  personName: string;
}) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#f8f2d9] px-7 py-12 text-center sm:px-12">
      <div className="absolute left-[-70px] top-[-70px] h-52 w-52 rounded-full border border-[#b73b38]/10" />

      <div className="absolute bottom-[-85px] right-[-50px] h-64 w-64 rounded-full border border-[#b73b38]/10" />

      <div className="absolute left-1/2 top-1/2 h-[420px] w-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#b73b38]/5" />

      <div className="relative max-w-md">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#a84d47] sm:text-[10px]">
          A page from
        </p>

        <h3 className="mt-5 font-book text-5xl font-medium leading-none tracking-[-0.055em] text-[#4b3532] sm:text-7xl">
          {personName}
        </h3>

        <div className="mx-auto my-7 h-px w-16 bg-[#b73b38]" />

        <p className="font-book text-2xl font-medium leading-[1.35] tracking-[-0.02em] text-[#705953] sm:text-4xl">
          “A letter written with love for your next
          chapter.”
        </p>

        <p className="mt-8 text-[9px] uppercase tracking-[0.28em] text-[#9c8e78] sm:text-[10px]">
          For Kirstin
        </p>
      </div>
    </div>
  );
}

function FloralBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Flower
        className="-left-16 top-[8%] h-52 w-52 rotate-[-18deg] opacity-[0.11] sm:h-72 sm:w-72"
        petalColor="#c85e4d"
        centerColor="#d89963"
      />

      <Flower
        className="-right-20 top-[32%] h-64 w-64 rotate-[25deg] opacity-[0.08] sm:h-96 sm:w-96"
        petalColor="#b8453d"
        centerColor="#db8b58"
      />

      <Flower
        className="bottom-[-90px] left-[18%] h-56 w-56 rotate-[10deg] opacity-[0.08] sm:h-80 sm:w-80"
        petalColor="#d77a55"
        centerColor="#b73b38"
      />

      <div className="absolute left-[5%] top-[52%] h-64 w-64 rounded-full bg-[#d97757]/5 blur-3xl" />

      <div className="absolute bottom-[3%] right-[7%] h-72 w-72 rounded-full bg-[#b73b38]/5 blur-3xl" />
    </div>
  );
}

function Flower({
  className,
  petalColor,
  centerColor,
}: {
  className: string;
  petalColor: string;
  centerColor: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        fill="none"
      >
        <ellipse
          cx="100"
          cy="47"
          rx="27"
          ry="52"
          fill={petalColor}
        />

        <ellipse
          cx="100"
          cy="153"
          rx="27"
          ry="52"
          fill={petalColor}
        />

        <ellipse
          cx="47"
          cy="100"
          rx="52"
          ry="27"
          fill={petalColor}
        />

        <ellipse
          cx="153"
          cy="100"
          rx="52"
          ry="27"
          fill={petalColor}
        />

        <ellipse
          cx="63"
          cy="63"
          rx="25"
          ry="47"
          transform="rotate(-45 63 63)"
          fill={petalColor}
        />

        <ellipse
          cx="137"
          cy="63"
          rx="25"
          ry="47"
          transform="rotate(45 137 63)"
          fill={petalColor}
        />

        <ellipse
          cx="63"
          cy="137"
          rx="25"
          ry="47"
          transform="rotate(45 63 137)"
          fill={petalColor}
        />

        <ellipse
          cx="137"
          cy="137"
          rx="25"
          ry="47"
          transform="rotate(-45 137 137)"
          fill={petalColor}
        />

        <circle
          cx="100"
          cy="100"
          r="28"
          fill={centerColor}
        />

        <circle
          cx="100"
          cy="100"
          r="13"
          fill="#fff7e8"
          fillOpacity="0.6"
        />
      </svg>
    </div>
  );
}