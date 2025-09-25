// components/support/DonationForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createClient } from '../../app/(public)/lib/supabase-browser'; // Adjust path to shared/supabase-browser
import type { Player, Donation } from '@pirate-nation/types'; // Add Donation/Player types if not there

interface DonationFormProps {
  onSuccess?: (orderId: string) => void; // Optional callback for parent
}

export default function DonationForm({ onSuccess }: DonationFormProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [donation, setDonation] = useState<Donation>({ amount: 19.81, type: 'sponsorship' });
  const [loading, setLoading] = useState(true);

  // Fetch ECU players for sponsorship buttons
  useEffect(() => {
    const fetchPlayers = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('players').select('*').eq('team', 'ECU'); // Filter for Pirates
      setPlayers(data || []);
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  // Log to Supabase on success
  const handleApprove = async (data: any, actions: any) => {
    const order = await actions.order?.capture();
    const supabase = createClient();
    await supabase.from('donations').insert({
      amount: donation.amount,
      athlete_id: donation.athleteId,
      type: donation.type,
      order_id: order?.id || '',
      created_at: new Date().toISOString(),
    });
    onSuccess?.(order?.id || '');
    alert('Argh! Pirate sponsorship captured—funds en route to ECU stars! 🏴‍☠️');
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: { value: donation.amount.toFixed(2), currency_code: 'USD' },
          description: `NIL Sponsorship: ${donation.athleteId ? `Athlete ${donation.athleteId}` : 'Purple Armada Collective'}`,
          custom_id: JSON.stringify({ type: donation.type, athleteId: donation.athleteId }),
        },
      ],
    });
  };

  if (loading) return <div className="text-center py-8">Loading Pirate rosters...</div>;

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

      {/* PayPal Buttons: Per-Player + Collective */}
      <div className="space-y-4 max-w-md mx-auto">
        {players.map((player) => (
          <div key={player.id} className="border-t pt-4">
            <h3 className="text-sm font-medium text-purple-800 mb-2">#{player.number} {player.name} ({player.position})</h3>
            <PayPalScriptProvider
              options={{
                'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency: 'USD',
              }}
            >
              <PayPalButtons
                createOrder={createOrder}
                onApprove={handleApprove}
                style={{ layout: 'vertical', color: 'gold', label: 'donate', height: 45 }} // ECU gold vibe
              />
            </PayPalScriptProvider>
          </div>
        ))}
        {/* Collective Button */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Support the Full Armada</h3>
          <PayPalScriptProvider
            options={{
              'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
              currency: 'USD',
            }}
          >
            <PayPalButtons
              createOrder={(data, actions) =>
                createOrder(data, actions) // Reuse with no athleteId
              }
              onApprove={handleApprove}
              style={{ layout: 'vertical', color: 'gold', label: 'donate', height: 45 }}
            />
          </PayPalScriptProvider>
        </div>
      </div>
    </section>
  );
}