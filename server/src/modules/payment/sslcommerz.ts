import { env } from "@/config/env";

/**
 * Minimal SSLCommerz client (v4 API). Sandbox vs live is chosen by
 * SSLCOMMERZ_IS_LIVE. Every call returns null-ish/false on failure so callers
 * can fall back cleanly — the platform never hard-depends on the gateway.
 */
const BASE = () => (env.sslcommerz.isLive ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

/** True when a store id + password are configured. */
export const sslcommerzEnabled = (): boolean =>
  Boolean(env.sslcommerz.storeId && env.sslcommerz.storePassword);

export interface InitParams {
  amount: number;
  tranId: string;
  productName: string;
  customer: { name: string; email: string; phone?: string | null };
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

/** Open a payment session; returns the gateway URL to send the payer to, or null. */
export async function initSession(p: InitParams): Promise<string | null> {
  const body = new URLSearchParams({
    store_id: env.sslcommerz.storeId,
    store_passwd: env.sslcommerz.storePassword,
    total_amount: String(p.amount),
    currency: "BDT",
    tran_id: p.tranId,
    success_url: p.successUrl,
    fail_url: p.failUrl,
    cancel_url: p.cancelUrl,
    ipn_url: p.ipnUrl,
    shipping_method: "NO",
    product_name: p.productName,
    product_category: "service",
    product_profile: "general",
    num_of_item: "1",
    cus_name: p.customer.name,
    cus_email: p.customer.email,
    cus_phone: p.customer.phone ?? "N/A",
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
  });

  try {
    const res = await fetch(`${BASE()}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string };
    if (data.status !== "SUCCESS" || !data.GatewayPageURL) return null;
    return data.GatewayPageURL;
  } catch {
    return null;
  }
}

export interface ValidationResult {
  valid: boolean;
  tranId?: string;
  amount?: number;
}

/** Confirm a transaction with SSLCommerz using the val_id from the callback. */
export async function validate(valId: string): Promise<ValidationResult> {
  const url =
    `${BASE()}/validator/api/validationserverAPI.php` +
    `?val_id=${encodeURIComponent(valId)}` +
    `&store_id=${encodeURIComponent(env.sslcommerz.storeId)}` +
    `&store_passwd=${encodeURIComponent(env.sslcommerz.storePassword)}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { valid: false };
    const data = (await res.json()) as { status?: string; tran_id?: string; amount?: string };
    const valid = data.status === "VALID" || data.status === "VALIDATED";
    return { valid, tranId: data.tran_id, amount: data.amount ? Number(data.amount) : undefined };
  } catch {
    return { valid: false };
  }
}
