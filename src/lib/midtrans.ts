import { authStore } from '@/stores/auth.svelte';
import { supabase } from '@/lib/supabase';
import type { BillingCycle, CreateSubscriptionResponse, SnapCallbacks } from '@/types';

const IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';
const CLIENT_KEY = (import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string | undefined) || '';

let snapLoadPromise: Promise<void> | null = null;

/**
 * Memuat library Snap JS Midtrans secara dinamis dan idempotent.
 */
export function loadSnapScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.snap) {
    return Promise.resolve();
  }

  if (snapLoadPromise) {
    return snapLoadPromise;
  }

  snapLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('midtrans-snap-script');
    if (existing) {
      if (window.snap) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap JS.')));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = SNAP_URL;
    if (CLIENT_KEY) {
      script.setAttribute('data-client-key', CLIENT_KEY);
    }
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => {
      snapLoadPromise = null;
      reject(new Error('Gagal mengunduh script pembayaran Midtrans Snap.'));
    };

    document.head.appendChild(script);
  });

  return snapLoadPromise;
}

export interface CreateSubscriptionParams {
  packageId: string;
  billingCycle: BillingCycle;
  tenantId?: string;
}

/**
 * Meminta Snap Token pembayaran ke endpoint backend Serverless `/api/midtrans/create`.
 */
export async function createSubscriptionTransaction(
  params: CreateSubscriptionParams
): Promise<CreateSubscriptionResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Sesi autentikasi telah berakhir. Silakan login kembali.');
  }

  const token = sessionData.session.access_token;
  const tenantId = params.tenantId || authStore.tenant?.id;

  if (!tenantId) {
    throw new Error('Data usaha kuliner (tenant) tidak ditemukan.');
  }

  const res = await fetch('/api/midtrans/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      package_id: params.packageId,
      billing_cycle: params.billingCycle
    })
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || `Gagal membuat transaksi pembayaran (${res.status}).`);
  }

  const responseData =
    payload && typeof payload === 'object' && 'data' in payload && payload.data
      ? payload.data
      : payload;

  if (!responseData?.token) {
    throw new Error('Token transaksi Midtrans tidak diterima dari server.');
  }

  return responseData as CreateSubscriptionResponse;
}

/**
 * Menampilkan dialog popup pembayaran Midtrans Snap di browser.
 */
export async function openSnapPayment(
  snapToken: string,
  callbacks?: SnapCallbacks
): Promise<void> {
  await loadSnapScript();

  if (!window.snap?.pay) {
    throw new Error('Midtrans Snap SDK belum siap pada browser.');
  }

  window.snap.pay(snapToken, callbacks);
}

/**
 * Polling status aktivasi tenant setelah pembayaran dilakukan.
 * Webhook Midtrans akan memproses aktivasi secara asinkron di server.
 */
export async function pollTenantActivation(options?: {
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 15; // default ~30 detik
  const intervalMs = options?.intervalMs ?? 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await authStore.refreshTenant();
    if (authStore.tenant?.status === 'active') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}
