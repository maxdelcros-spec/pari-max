import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink-50">Match introuvable</h1>
      <p className="text-sm text-ink-400">Ce match n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="mt-2 rounded-lg bg-value-gradient px-4 py-2 text-sm font-semibold text-base-950">
        Retour au dashboard
      </Link>
    </div>
  );
}
