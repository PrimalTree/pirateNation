"use client";

import React, { useEffect, useRef, useState } from "react";

type PayPalButtonsLiteProps = {
  clientId: string;
  currency?: string;
  createOrder: (data: any, actions: any) => Promise<string> | string;
  onApprove: (data: any, actions: any) => Promise<void> | void;
  style?: Record<string, any>;
};

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButtonsLite({
  clientId,
  currency = "USD",
  createOrder,
  onApprove,
  style,
}: PayPalButtonsLiteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.querySelector(
      `script[data-pp-sdk][data-client-id="${clientId}"]`
    ) as HTMLScriptElement | null;

    const ensureButtons = () => {
      if (!window.paypal || !containerRef.current) return;
      // Clear any previous renders
      containerRef.current.innerHTML = "";
      const btns = window.paypal.Buttons({ createOrder, onApprove, style });
      btns.render(containerRef.current);
      setReady(true);
    };

    if (window.paypal) {
      ensureButtons();
      return;
    }

    const script = existing || document.createElement("script");
    if (!existing) {
      const params = new URLSearchParams({
        "client-id": clientId,
        currency,
        intent: "capture",
        components: "buttons",
      });
      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.async = true;
      script.dataset.ppSdk = "true";
      script.setAttribute("data-client-id", clientId);
      document.body.appendChild(script);
    }

    const onLoad = () => ensureButtons();
    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, [clientId, currency, createOrder, onApprove, style]);

  return (
    <div>
      <div ref={containerRef} />
      {!ready && (
        <div className="mt-2 text-xs text-zinc-400">Loading PayPal…</div>
      )}
    </div>
  );
}

