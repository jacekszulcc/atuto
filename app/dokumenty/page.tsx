import type { Metadata } from "next";
import Link from "next/link";
import DocumentRowActions from "@/components/DocumentRowActions";
import { listDocuments } from "@/lib/referral/list-documents";
import { EXAMINATION_TYPES } from "@/lib/referral/types";

export const metadata: Metadata = {
  title: "Dokumenty — Atuto",
};

// Lista czyta bazę przy każdym wejściu; bez tego Next zapiekłby ją
// statycznie w czasie builda i nowe skierowania by się nie pojawiały.
export const dynamic = "force-dynamic";

const TH = "px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300";
const TD = "px-4 py-3 align-top text-sm text-slate-800 dark:text-slate-200";

function examinationLabel(value: string | null): string {
  return EXAMINATION_TYPES.find((type) => type.value === value)?.label ?? "—";
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
}

export default async function DocumentsPage() {
  const result = await listDocuments();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Dokumenty
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Wystawione skierowania na badania lekarskie.
        </p>
      </header>

      {!result.ok && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          Nie udało się wczytać listy dokumentów: {result.error}
        </p>
      )}

      {result.ok && result.items.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Nie ma jeszcze żadnych dokumentów.{" "}
          <Link href="/skierowanie" className="text-blue-700 underline dark:text-blue-400">
            Wystaw pierwsze skierowanie
          </Link>
          .
        </p>
      )}

      {result.ok && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse bg-white dark:bg-slate-950">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <tr>
                <th scope="col" className={TH}>Numer</th>
                <th scope="col" className={TH}>Utworzono</th>
                <th scope="col" className={TH}>Osoba kierowana</th>
                <th scope="col" className={TH}>Rodzaj badania</th>
                <th scope="col" className={TH}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                >
                  <td className={TD}>
                    <Link
                      href={`/dokumenty/${item.id}`}
                      className="font-mono font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {item.numer}
                    </Link>
                  </td>
                  <td className={`${TD} whitespace-nowrap text-slate-600 dark:text-slate-400`}>
                    {formatCreatedAt(item.dataUtworzenia)}
                  </td>
                  <td className={TD}>
                    {item.fullName ?? (
                      <span className="text-slate-400">dane niedostępne</span>
                    )}
                  </td>
                  <td className={TD}>{examinationLabel(item.examinationType)}</td>
                  <td className={TD}>
                    <DocumentRowActions
                      id={item.id}
                      numer={item.numer}
                      disabled={item.snapshotError !== null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
