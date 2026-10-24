import { toastState } from '@/stores/toast.svelte';

export function pushToast(message: string, tone: 'info' | 'success' | 'error' = 'info') {
  toastState.push(message, tone);
}
