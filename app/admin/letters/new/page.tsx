"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LetterStatus = "draft" | "published";

export default function AddLetterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [letter, setLetter] = useState("");
  const [status, setStatus] =
    useState<LetterStatus>("draft");
  const [pageOrder, setPageOrder] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>(
    [],
  );

  const [isCheckingSession, setIsCheckingSession] =
    useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setIsCheckingSession(false);
    }

    checkSession();
  }, [router]);

  function handlePhotoSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    setSelectedFiles((currentFiles) => [
      ...currentFiles,
      ...files,
    ]);

    event.target.value = "";
  }

  function removeSelectedPhoto(indexToRemove: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter(
        (_, index) => index !== indexToRemove,
      ),
    );
  }

  async function getNextPageOrder() {
    const { data, error } = await supabase
      .from("letters")
      .select("page_order")
      .order("page_order", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const highestPageOrder = data?.[0]?.page_order ?? 0;

    return highestPageOrder + 1;
  }

  async function uploadPhotos(userId: string) {
    const photoUrls: string[] = [];

    for (const file of selectedFiles) {
      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const originalName = file.name.replace(
        /\.[^/.]+$/,
        "",
      );

      const safeName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const filePath = `${userId}/${crypto.randomUUID()}-${
        safeName || "photo"
      }.${fileExtension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("letter-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

      if (uploadError) {
        throw new Error(
          `Could not upload ${file.name}: ${uploadError.message}`,
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("letter-photos")
          .getPublicUrl(filePath);

      photoUrls.push(publicUrlData.publicUrl);
    }

    return photoUrls;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedLetter = letter.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter the person’s name.");
      return;
    }

    if (!trimmedLetter) {
      setErrorMessage("Please paste the letter.");
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session expired. Please sign in again.",
        );
      }

      const photoUrls = await uploadPhotos(user.id);

      const typedPageOrder = Number.parseInt(
        pageOrder,
        10,
      );

      const finalPageOrder = Number.isNaN(typedPageOrder)
        ? await getNextPageOrder()
        : typedPageOrder;

      const { error: insertError } = await supabase
        .from("letters")
        .insert({
          name: trimmedName,
          relationship:
            relationship.trim() || null,
          letter: trimmedLetter,
          photos: photoUrls,
          page_order: finalPageOrder,
          status,
          created_by: user.id,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the page.",
      );

      setIsSaving(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9ec] text-[#4b3532]">
        <p className="text-sm text-[#8e816d]">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcf9ec] px-5 py-6 text-[#4b3532] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[900px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a84d47]">
              Kirstin&apos;s Wedding Book
            </p>

            <h1 className="mt-3 font-serif text-5xl tracking-[-0.05em]">
              Add Page
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#80735f]">
              Paste the letter and add photos only when
              you have them.
            </p>
          </div>

          <a
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#ddd3b4] bg-[#fffdf6] px-5 text-sm font-semibold transition hover:bg-white"
          >
            Back to Letters
          </a>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-[30px] border border-[#e7dfc3] bg-[#fffdf6] p-6 shadow-[0_20px_60px_rgba(96,66,23,0.07)] sm:p-9"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                placeholder="Jen"
                className="form-input"
              />
            </FormField>

            <FormField
              label="Relationship"
              htmlFor="relationship"
              optional
            >
              <input
                id="relationship"
                type="text"
                value={relationship}
                onChange={(event) =>
                  setRelationship(event.target.value)
                }
                placeholder="Friend"
                className="form-input"
              />
            </FormField>
          </div>

          <FormField label="Letter" htmlFor="letter">
            <textarea
              id="letter"
              value={letter}
              onChange={(event) =>
                setLetter(event.target.value)
              }
              required
              rows={18}
              placeholder={`Dear Kirstin,\n\nPaste the full letter here.\n\nLove,\nJen`}
              className="form-input min-h-[420px] resize-y py-4 leading-7"
            />
          </FormField>

          <FormField
            label="Photos"
            htmlFor="photos"
            optional
          >
            <div className="rounded-[18px] border border-dashed border-[#d6caaa] bg-[#faf7eb] p-5">
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelection}
                className="block w-full text-sm text-[#756957] file:mr-4 file:rounded-full file:border-0 file:bg-[#b73b38] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#9f2f2d]"
              />

              <p className="mt-3 text-xs leading-5 text-[#92846e]">
                Leave this empty when the person did not
                send photos.
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e2d9bd] bg-white/65 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-[#92846e]">
                        {(
                          file.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeSelectedPhoto(index)
                      }
                      className="shrink-0 text-xs font-semibold text-[#a84d47] hover:text-[#8f302d]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Page Order"
              htmlFor="page-order"
              optional
            >
              <input
                id="page-order"
                type="number"
                min="1"
                value={pageOrder}
                onChange={(event) =>
                  setPageOrder(event.target.value)
                }
                placeholder="Leave blank to add last"
                className="form-input"
              />

              <p className="mt-2 text-xs leading-5 text-[#92846e]">
                Leave this blank and the page will
                automatically be added to the end.
              </p>
            </FormField>

            <FormField label="Status" htmlFor="status">
              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as LetterStatus,
                  )
                }
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="published">
                  Published
                </option>
              </select>
            </FormField>
          </div>

          {errorMessage && (
            <div className="rounded-[16px] border border-[#d9a7a2] bg-[#f9e9e7] px-4 py-3 text-sm text-[#8f3733]">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#ebe3cc] pt-6 sm:flex-row sm:justify-end">
            <a
              href="/admin"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#ddd3b4] bg-white/60 px-6 text-sm font-semibold transition hover:bg-white"
            >
              Cancel
            </a>

            <button
              type="submit"
              disabled={isSaving}
              className="h-12 rounded-full bg-[#b73b38] px-7 text-sm font-semibold text-[#fffdf6] shadow-[0_12px_26px_rgba(128,45,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[#9f2f2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Page"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c7c65]"
        >
          {label}
        </label>

        {optional && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#aaa08e]">
            Optional
          </span>
        )}
      </div>

      {children}
    </div>
  );
}