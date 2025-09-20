"use client";
import { useMemo, useState, useEffect } from "react";

type Recipient = "OMVP" | "DMVP" | "TEAM" | "PLAYER";

const AMOUNTS = [5, 10, 25, 50, 100] as const;

// Replace with your actual PayPal donation page link
const PAYPAL_DONATION_PAGE =
  "https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID";

type Player = { id: string; name: string };

export function DonationForm() {
  const [recipient, setRecipient] = useState<Recipient>("TEAM");
  const [player, setPlayer] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [customMode, setCustomMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    if (busy) return true;
    if (recipient === "PLAYER" && !player) return true;
    if (amount === "" || Number(amount) <= 0) return true;
    return false;
  }, [busy, recipient, player, amount]);

  // Fetch roster
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/roster");
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error("Failed to fetch roster", err);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Invalid donation amount");

      // 1. Log donation intent
      await fetch("/api/donate/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          playerId: recipient === "PLAYER" ? player : null,
          message: message.slice(0, 250),
          amount: amt,
        }),
      });

      // 2. Build PayPal redirect URL
      const label =
        recipient === "PLAYER" && player
          ? `Donation to Player ${player}`
          : `Donation to ${recipient}`;
      const encodedLabel = encodeURIComponent(label);

      const paypalUrl = `${PAYPAL_DONATION_PAGE}&amount=${amt}&item_name=${encodedLabel}`;

      // 3. Redirect
      window.location.href = paypalUrl;
    } catch (err: any) {
      setError(err?.message || "Failed to start donation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Recipient selection */}
      <div>
        <div className="mb-2 font-semibold">Choose recipient</div>
        <div className="flex gap-2 flex-wrap">
          {(["OMVP", "DMVP", "TEAM", "PLAYER"] as Recipient[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRecipient(r)}
              className={[
                "rounded-lg border px-3 py-1 text-sm",
                recipient === r
                  ? "border-ecu-gold bg-ecu-gold text-black"
                  : "border-zinc-700 text-zinc-200 hover:bg-zinc-800",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Player select */}
      {recipient === "PLAYER" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Select player</label>
          <select
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
          >
            <option value="">-- Choose a player --</option>
            {players.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Message */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 250))}
          maxLength={250}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
          placeholder="Say something to the team (max 250 chars)"
        />
        <div className="mt-1 text-right text-xs text-zinc-500">
          {message.length}/250
        </div>
      </div>

      {/* Amount */}
      <div>
        <div className="mb-2 font-semibold">Select amount</div>
        {!customMode ? (
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAmount(a)}
                className={[
                  "rounded-lg border px-3 py-1 text-sm",
                  amount === a
                    ? "border-ecu-gold bg-ecu-gold text-black"
                    : "border-zinc-700 text-zinc-200 hover:bg-zinc-800",
                ].join(" ")}
              >
                ${a}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomMode(true);
                setAmount("");
              }}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Other
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-100"
              placeholder="Enter amount"
            />
            <button
              type="button"
              onClick={() => {
                setCustomMode(false);
                setAmount(25); // default back
              }}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-ecu-gold px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {busy
          ? "Processing..."
          : amount
          ? `Donate $${amount}`
          : "Donate"}
      </button>
    </form>
  );
}
