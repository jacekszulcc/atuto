export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Atuto
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Twoja dokumentacja to atut.
        </p>
        <p className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Już wkrótce
        </p>
      </main>
    </div>
  );
}
