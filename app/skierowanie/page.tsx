import type { Metadata } from "next";
import ReferralForm from "@/components/ReferralForm";
import { LEGAL_BASIS } from "@/lib/referral/types";

export const metadata: Metadata = {
  title: "Skierowanie na badania lekarskie — Atuto",
  description:
    "Formularz skierowania na profilaktyczne badania lekarskie zgodny ze wzorem z załącznika 3a (Dz.U. 2023 poz. 607).",
};

export default function ReferralPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">
          Dokument
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Skierowanie na badania lekarskie
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{LEGAL_BASIS}</p>
      </header>

      <ReferralForm />
    </main>
  );
}
