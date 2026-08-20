"use client";

import { useState } from "react";

const BUTTON =
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed";
const BUTTON_PRIMARY = `${BUTTON} bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-400`;
const BUTTON_OUTLINE = `${BUTTON} border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; recipient: string }
  | { kind: "error"; message: string };

export default function DocumentRowActions({
  id,
  numer,
  disabled,
}: {
  id: string;
  numer: string;
  /** Snapshot uszkodzony — nie ma z czego złożyć ani PDF-a, ani maila. */
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const sending = status.kind === "sending";

  async function send() {
    setStatus({ kind: "sending" });

    try {
      const response = await fetch(`/api/dokumenty/${id}/wyslij`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Trasa zawsze odpowiada JSON-em, ale przy awarii infrastruktury
      // (timeout, 502 od proxy) w ciele może być HTML — wtedy .json() rzuca.
      let payload: { error?: string; recipient?: string } = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        setStatus({
          kind: "error",
          message:
            payload.error ?? `Wysyłka nie powiodła się (HTTP ${response.status}).`,
        });
        return;
      }

      setStatus({ kind: "sent", recipient: payload.recipient ?? email.trim() });
      setOpen(false);
      setEmail("");
    } catch (thrown) {
      setStatus({
        kind: "error",
        message:
          thrown instanceof Error
            ? `Nie udało się połączyć z serwerem: ${thrown.message}`
            : "Nie udało się połączyć z serwerem.",
      });
    }
  }

  if (disabled) {
    return (
      <span className="text-sm text-slate-400">
        niedostępne — uszkodzony snapshot
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/dokumenty/${id}/pdf`}
          className={BUTTON_OUTLINE}
          aria-label={`Pobierz PDF skierowania ${numer}`}
        >
          Pobierz PDF
        </a>
        <button
          type="button"
          onClick={() => {
            setOpen((previous) => !previous);
            setStatus({ kind: "idle" });
          }}
          className={BUTTON_OUTLINE}
          aria-expanded={open}
        >
          {open ? "Anuluj" : "Wyślij mailem"}
        </button>
      </div>

      {open && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`email-${id}`} className="sr-only">
            Adres e-mail odbiorcy skierowania {numer}
          </label>
          <input
            id={`email-${id}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && email.trim() && !sending) send();
            }}
            placeholder="adres@odbiorcy.pl"
            disabled={sending}
            className="w-56 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || email.trim().length === 0}
            className={BUTTON_PRIMARY}
          >
            {sending ? "Wysyłanie…" : "Wyślij"}
          </button>
        </div>
      )}

      {sending && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generowanie PDF-a i wysyłka — to potrwa kilka sekund.
        </p>
      )}

      {status.kind === "sent" && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Wysłano na {status.recipient}.
        </p>
      )}

      {status.kind === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {status.message}
        </p>
      )}
    </div>
  );
}
