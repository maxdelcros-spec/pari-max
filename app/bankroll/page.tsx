import { BankrollTracker } from "@/components/BankrollTracker";

export default function BankrollPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Bankroll tracker</h1>
        <p className="mt-1 text-sm text-ink-400">
          Suivi simple de tes mises, stocké localement dans ton navigateur.
        </p>
      </div>
      <BankrollTracker />
    </div>
  );
}
