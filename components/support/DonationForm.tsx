// components/support/DonationForm.tsx
'use client';
import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import roster from '../../data/public/roster.json';

interface DonationFormProps { onSuccess?: (orderId: string) => void }

type Player = { id: string; name: string; position?: string; number?: number };
type Donation = { amount: number; type: 'sponsorship' | 'team'; athleteId?: string };

export default function DonationForm({ onSuccess }: DonationFormProps) {
  const players: Player[] = ((roster as any).players ?? []) as Player[];
  const [donation, setDonation] = useState<Donation>({ amount: 19.81, type: 'team' });

  // Sort players by jersey then name for selector
  const sortedPlayers = [...players].sort((a, b) => {
    const an = typeof a.number === 'number' ? a.number : 9999;
    const bn = typeof b.number === 'number' ? b.number : 9999;
    if (an !== bn) return an - bn;
    return a.name.localeCompare(b.name);
  });

  // Verify with server + record donation
  const handleApprove = async (_data: any, actions: any) => {
    const order = await actions.order?.capture();
    const orderId = order?.id as string | undefined;
    if (!orderId) return;
    await fetch('/api/donate/donate/paypal/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    });
    onSuccess?.(orderId);
    alert('Argh! Donation completed — thank you! 🏴‍☠️');
  };

  const createOrder = (_data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: { value: donation.amount.toFixed(2), currency_code: 'USD' },
          description:
            donation.type === 'team'
              ? 'NIL Sponsorship: Purple Armada Collective'
              : `NIL Sponsorship: Athlete ${donation.athleteId}`,
          custom_id: JSON.stringify({
            recipient: donation.type === 'team' ? 'TEAM' : 'PLAYER',
            type: donation.type === 'team' ? 'TEAM' : 'PLAYER',
            athleteId: donation.athleteId,
          }),
        },
      ],
    });
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mt-8 text-center">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">Sponsor a Pirate Below! 🏴‍☠️</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Back ECU athletes’ NIL—gear, shoutouts, more. Via Primal Tree LLC, non-tax-deductible.
      </p>

      {/* Amount Picker */}
      <div className="mb-6">
        <label htmlFor="amount" className="block text-lg font-medium text-gray-700 mb-2">
          Sponsorship Tier
        </label>
        <select
          id="amount"
          className="p-2 border border-gray-300 rounded-md w-full max-w-xs mx-auto"
          value={donation.amount}
          onChange={(e) => setDonation({ ...donation, amount: Number(e.target.value) })}
        >
          {[
            { label: '$19.81 - Natty Legacy Boost', value: 19.81 },
            { label: '$25 - Gear Up', value: 25 },
            { label: '$50 - Shoutout Star', value: 50 },
            { label: '$100 - Game Day Hero', value: 100 },
          ].map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Picker */}
      <div className="mb-6">
        <label htmlFor="recipient" className="block text-lg font-medium text-gray-700 mb-2">
          Sponsor
        </label>
        <select
          id="recipient"
          className="p-2 border border-gray-300 rounded-md w-full max-w-xs mx-auto"
          value={donation.type === 'team' ? 'team' : `player:${donation.athleteId}`}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'team') {
              setDonation({ ...donation, type: 'team', athleteId: undefined });
            } else if (v.startsWith('player:')) {
              const id = v.substring('player:'.length);
              setDonation({ ...donation, type: 'sponsorship', athleteId: id });
            }
          }}
        >
          <option value="team">Full Team — Purple Armada Collective</option>
          {sortedPlayers.map((p) => (
            <option key={p.id} value={`player:${p.id}`}>
              {p.number != null ? `#${p.number} ` : ''}{p.name}{p.position ? ` (${p.position})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* PayPal Button */}
      <div className="space-y-4 max-w-md mx-auto">
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-purple-800 mb-2">
            {donation.type === 'team'
              ? 'Support the Full Armada'
              : 'Sponsor Selected Athlete'}
          </h3>
          <PayPalScriptProvider
            options={{
              'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
              currency: 'USD',
            }}
          >
            <PayPalButtons
              createOrder={createOrder}
              onApprove={handleApprove}
              style={{ layout: 'vertical', color: 'gold', label: 'donate', height: 45 }}
            />
          </PayPalScriptProvider>
        </div>
      </div>
    </section>
  );
}
