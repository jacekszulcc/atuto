import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SkierowanieWydruk from "@/components/SkierowanieWydruk";
import { getDocument } from "@/lib/referral/get-document";

export const metadata: Metadata = {
  title: "Podgląd skierowania — Atuto",
};

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDocument(id);

  if (!result.ok && result.reason === "not_found") {
    notFound();
  }

  // Padnięte zapytanie do bazy to nie "dokument nie istnieje" — inny status,
  // inny komunikat. Rzucamy dalej do Next'owej strony błędu (500).
  if (!result.ok && result.reason === "db_error") {
    throw new Error(`Błąd zapytania do bazy: ${result.detail}`);
  }

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-900">
          Nie można wyświetlić dokumentu — snapshot jest niekompletny: {result.detail}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Skierowanie {result.numer}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Utworzono:{" "}
            {new Date(result.dataUtworzenia).toLocaleString("pl-PL", {
              timeZone: "Europe/Warsaw",
            })}
          </p>
        </div>
        <a
          href={`/api/dokumenty/${id}/pdf`}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Pobierz PDF
        </a>
      </div>

      {result.warnings.length > 0 && (
        <ul className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <SkierowanieWydruk numer={result.numer} dane={result.dane} />
    </main>
  );
}
