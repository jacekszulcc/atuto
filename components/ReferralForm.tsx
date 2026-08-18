"use client";

import { useRef, useState, useTransition } from "react";
import { saveReferral } from "@/lib/referral/save";
import {
  factorErrorKey,
  todayIso,
  validateForm,
} from "@/lib/referral/validation";
import {
  EXAMINATION_TYPES,
  FACTOR_CATEGORIES,
  IDENTIFIER_TYPES,
  type FactorCategory,
  type FactorRow,
  type IdentifierType,
  type ReferralFormData,
} from "@/lib/referral/types";

const LABEL = "block text-sm font-medium text-slate-800 dark:text-slate-200";
const SUBLABEL = "text-sm text-slate-600 dark:text-slate-400";
const INPUT =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const INPUT_ERROR =
  "border-red-500 focus:border-red-600 focus:ring-red-600/20 dark:border-red-500";
const SECTION =
  "rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-950";
const RADIO_BASE =
  "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors";
const RADIO_ON =
  "border-blue-600 bg-blue-50 font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-200";
const RADIO_OFF =
  "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300";

function emptyFactor(key: string): FactorRow {
  return { key, category: "I", name: "", exposureLevel: "" };
}

function initialData(): ReferralFormData {
  return {
    examinationType: "",
    issuePlace: "",
    issueDate: todayIso(),
    fullName: "",
    identifierType: "pesel",
    identifier: "",
    addressCity: "",
    addressStreet: "",
    addressHouseNo: "",
    addressFlatNo: "",
    positionName: "",
    positionDescription: "",
    factors: [emptyFactor("f0")],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function SectionTitle({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
        {step}
      </span>
      {children}
    </h2>
  );
}

export default function ReferralForm() {
  const [data, setData] = useState<ReferralFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const nextFactorKey = useRef(1);

  function update<K extends keyof ReferralFormData>(
    field: K,
    value: ReferralFormData[K],
  ) {
    setData((previous) => ({ ...previous, [field]: value }));
    // Komunikat znika, gdy użytkownik zaczyna poprawiać dane pole,
    // i wraca dopiero przy kolejnej próbie wysyłki.
    setErrors((previous) => {
      if (!(field in previous)) return previous;
      const next = { ...previous };
      delete next[field as string];
      return next;
    });
  }

  function changeIdentifierType(type: IdentifierType) {
    // Zmiana typu czyści wartość: PESEL wpisany wcześniej nie ma sensu
    // w polu daty urodzenia i odwrotnie.
    setData((previous) => ({
      ...previous,
      identifierType: type,
      identifier: "",
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.identifier;
      return next;
    });
  }

  function updateFactor(key: string, patch: Partial<FactorRow>) {
    setData((previous) => ({
      ...previous,
      factors: previous.factors.map((factor) =>
        factor.key === key ? { ...factor, ...patch } : factor,
      ),
    }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const field of ["name", "exposureLevel"] as const) {
        if (field in patch) delete next[factorErrorKey(key, field)];
      }
      return next;
    });
  }

  function addFactor() {
    const key = `f${nextFactorKey.current++}`;
    setData((previous) => ({
      ...previous,
      factors: [...previous.factors, emptyFactor(key)],
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.factors;
      return next;
    });
  }

  function removeFactor(key: string) {
    setData((previous) => ({
      ...previous,
      factors: previous.factors.filter((factor) => factor.key !== key),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    const found = validateForm(data);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const result = await saveReferral(data);
      if (result.ok) {
        setSavedNumber(result.documentNumber);
      } else {
        setSaveError(result.error);
      }
    });
  }

  if (savedNumber) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/40">
        <h2 className="text-lg font-semibold text-green-900 dark:text-green-200">
          Skierowanie zapisane
        </h2>
        <p className="mt-2 text-green-900 dark:text-green-200">
          Numer dokumentu:{" "}
          <strong className="font-mono text-xl font-semibold">
            {savedNumber}
          </strong>
        </p>
        <button
          type="button"
          onClick={() => {
            setData(initialData());
            setErrors({});
            setSavedNumber(null);
          }}
          className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          Wystaw kolejne skierowanie
        </button>
      </div>
    );
  }

  const identifierMeta = IDENTIFIER_TYPES.find(
    (type) => type.value === data.identifierType,
  )!;
  const isBirthDate = data.identifierType === "data_urodzenia";
  const isPesel = data.identifierType === "pesel";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset className={SECTION}>
        <SectionTitle step={1}>Rodzaj badania</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {EXAMINATION_TYPES.map((type) => (
            <label
              key={type.value}
              className={`${RADIO_BASE} ${
                data.examinationType === type.value ? RADIO_ON : RADIO_OFF
              }`}
            >
              <input
                type="radio"
                name="examinationType"
                value={type.value}
                checked={data.examinationType === type.value}
                onChange={() => update("examinationType", type.value)}
                className="h-4 w-4 accent-blue-700"
              />
              {type.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.examinationType} />
      </fieldset>

      <fieldset className={SECTION}>
        <SectionTitle step={2}>Miejsce i data wystawienia</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="issuePlace" className={LABEL}>
              Miejscowość wystawienia
            </label>
            <input
              id="issuePlace"
              type="text"
              value={data.issuePlace}
              onChange={(event) => update("issuePlace", event.target.value)}
              className={`${INPUT} ${errors.issuePlace ? INPUT_ERROR : ""}`}
            />
            <FieldError message={errors.issuePlace} />
          </div>
          <div>
            <label htmlFor="issueDate" className={LABEL}>
              Data wystawienia
            </label>
            <input
              id="issueDate"
              type="date"
              value={data.issueDate}
              onChange={(event) => update("issueDate", event.target.value)}
              className={`${INPUT} ${errors.issueDate ? INPUT_ERROR : ""}`}
            />
            <FieldError message={errors.issueDate} />
          </div>
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <SectionTitle step={3}>Osoba kierowana na badanie</SectionTitle>

        <div>
          <label htmlFor="fullName" className={LABEL}>
            Imię i nazwisko
          </label>
          <input
            id="fullName"
            type="text"
            value={data.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            className={`${INPUT} ${errors.fullName ? INPUT_ERROR : ""}`}
          />
          <FieldError message={errors.fullName} />
        </div>

        <div className="mt-5">
          <span className={LABEL}>Identyfikacja osoby</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {IDENTIFIER_TYPES.map((type) => (
              <label
                key={type.value}
                className={`${RADIO_BASE} ${
                  data.identifierType === type.value ? RADIO_ON : RADIO_OFF
                }`}
              >
                <input
                  type="radio"
                  name="identifierType"
                  value={type.value}
                  checked={data.identifierType === type.value}
                  onChange={() => changeIdentifierType(type.value)}
                  className="h-4 w-4 accent-blue-700"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="identifier" className={LABEL}>
            {identifierMeta.fieldLabel}
          </label>
          <input
            id="identifier"
            type={isBirthDate ? "date" : "text"}
            inputMode={isPesel ? "numeric" : undefined}
            maxLength={isPesel ? 11 : undefined}
            placeholder={identifierMeta.placeholder || undefined}
            value={data.identifier}
            onChange={(event) => update("identifier", event.target.value)}
            className={`${INPUT} ${errors.identifier ? INPUT_ERROR : ""} ${
              isPesel ? "font-mono" : ""
            }`}
          />
          <FieldError message={errors.identifier} />
        </div>

        <div className="mt-5">
          <span className={LABEL}>Adres zamieszkania</span>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="addressCity" className={SUBLABEL}>
                Miejscowość
              </label>
              <input
                id="addressCity"
                type="text"
                value={data.addressCity}
                onChange={(event) => update("addressCity", event.target.value)}
                className={`${INPUT} ${errors.addressCity ? INPUT_ERROR : ""}`}
              />
              <FieldError message={errors.addressCity} />
            </div>
            <div>
              <label htmlFor="addressStreet" className={SUBLABEL}>
                Ulica
              </label>
              <input
                id="addressStreet"
                type="text"
                value={data.addressStreet}
                onChange={(event) => update("addressStreet", event.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="addressHouseNo" className={SUBLABEL}>
                Nr domu
              </label>
              <input
                id="addressHouseNo"
                type="text"
                value={data.addressHouseNo}
                onChange={(event) =>
                  update("addressHouseNo", event.target.value)
                }
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="addressFlatNo" className={SUBLABEL}>
                Nr lokalu{" "}
                <span className="text-slate-400">(opcjonalnie)</span>
              </label>
              <input
                id="addressFlatNo"
                type="text"
                value={data.addressFlatNo}
                onChange={(event) => update("addressFlatNo", event.target.value)}
                className={INPUT}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <SectionTitle step={4}>Stanowisko pracy</SectionTitle>
        <div>
          <label htmlFor="positionName" className={LABEL}>
            Nazwa stanowiska
          </label>
          <input
            id="positionName"
            type="text"
            value={data.positionName}
            onChange={(event) => update("positionName", event.target.value)}
            className={`${INPUT} ${errors.positionName ? INPUT_ERROR : ""}`}
          />
          <FieldError message={errors.positionName} />
        </div>
        <div className="mt-4">
          <label htmlFor="positionDescription" className={LABEL}>
            Określenie stanowiska pracy
          </label>
          <textarea
            id="positionDescription"
            rows={4}
            value={data.positionDescription}
            onChange={(event) =>
              update("positionDescription", event.target.value)
            }
            className={`${INPUT} resize-y ${
              errors.positionDescription ? INPUT_ERROR : ""
            }`}
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            rodzaj pracy, podstawowe czynności, sposób i czas ich wykonywania
          </p>
          <FieldError message={errors.positionDescription} />
        </div>
      </fieldset>

      <fieldset className={SECTION}>
        <SectionTitle step={5}>
          Czynniki szkodliwe, uciążliwe lub niebezpieczne
        </SectionTitle>

        <div className="space-y-4">
          {data.factors.map((factor, index) => (
            <div
              key={factor.key}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Czynnik {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFactor(factor.key)}
                  className="rounded px-2 py-1 text-sm text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  Usuń
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor={`factor-category-${factor.key}`}
                    className={SUBLABEL}
                  >
                    Kategoria
                  </label>
                  <select
                    id={`factor-category-${factor.key}`}
                    value={factor.category}
                    onChange={(event) =>
                      updateFactor(factor.key, {
                        category: event.target.value as FactorCategory,
                      })
                    }
                    className={INPUT}
                  >
                    {FACTOR_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`factor-name-${factor.key}`}
                    className={SUBLABEL}
                  >
                    Nazwa czynnika
                  </label>
                  <input
                    id={`factor-name-${factor.key}`}
                    type="text"
                    value={factor.name}
                    onChange={(event) =>
                      updateFactor(factor.key, { name: event.target.value })
                    }
                    className={`${INPUT} ${
                      errors[factorErrorKey(factor.key, "name")]
                        ? INPUT_ERROR
                        : ""
                    }`}
                  />
                  <FieldError
                    message={errors[factorErrorKey(factor.key, "name")]}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`factor-exposure-${factor.key}`}
                    className={SUBLABEL}
                  >
                    Wielkość narażenia
                  </label>
                  <input
                    id={`factor-exposure-${factor.key}`}
                    type="text"
                    value={factor.exposureLevel}
                    onChange={(event) =>
                      updateFactor(factor.key, {
                        exposureLevel: event.target.value,
                      })
                    }
                    className={`${INPUT} ${
                      errors[factorErrorKey(factor.key, "exposureLevel")]
                        ? INPUT_ERROR
                        : ""
                    }`}
                  />
                  <FieldError
                    message={
                      errors[factorErrorKey(factor.key, "exposureLevel")]
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <FieldError message={errors.factors} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={addFactor}
            className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
          >
            + Dodaj czynnik
          </button>
          {/* Licznik wyliczany z listy — na papierowym druku wpisuje się go
              ręcznie i łatwo o rozjazd z treścią tabeli. */}
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Łączna liczba czynników:{" "}
            <span className="font-mono text-base">{data.factors.length}</span>
          </p>
        </div>
      </fieldset>

      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          <strong className="font-semibold">Nie udało się zapisać.</strong>{" "}
          {saveError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? "Zapisywanie…" : "Zapisz skierowanie"}
      </button>
    </form>
  );
}
