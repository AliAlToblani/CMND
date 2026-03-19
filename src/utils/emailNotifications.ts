/**
 * emailNotifications.ts
 *
 * Fire-and-forget wrappers for email notification events.
 * These functions return immediately — callers should NOT await them.
 * Errors are swallowed and logged to the console so they never break
 * the customer/contract creation flow.
 *
 * Usage:
 *   notifyNewCustomer({ customerId, customerName });
 *   notifyNewContract({ contractId, customerId, customerName, contractName, contractValue, paymentFrequency });
 */

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ─── Public API ───────────────────────────────────────────────────────────────

export interface NewCustomerNotificationParams {
  customerId: string;
  customerName: string;
}

export interface NewContractNotificationParams {
  contractId: string;
  customerId: string;
  customerName: string;
  contractName: string;
  contractValue: number;
  paymentFrequency: string;
}

/**
 * Fire-and-forget: notify team members that a new customer was added.
 * Only call this from the MAIN portal (not from /batelco/* routes).
 */
export function notifyNewCustomer(params: NewCustomerNotificationParams): void {
  void dispatch("new-customer", params);
}

/**
 * Fire-and-forget: notify team members that a new contract was created.
 * Only call this from the MAIN portal (not from /batelco/* routes).
 */
export function notifyNewContract(params: NewContractNotificationParams): void {
  void dispatch("new-contract", params);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function dispatch(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("emailNotifications: no session, skipping notification.");
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ event, ...data }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`emailNotifications: notify-event returned ${res.status}`, body);
    }
  } catch (err) {
    // Never let email errors propagate — just log
    console.error("emailNotifications: failed to dispatch notification —", err);
  }
}
