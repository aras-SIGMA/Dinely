import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { authStore } from '@/stores/auth.svelte';
import { router } from '@/lib/router';
import { adminStore } from '@/stores/admin.svelte';

// Expose helpers di localhost/dev mode untuk pengujian via console browser
if (
  typeof window !== 'undefined' &&
  (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  (window as any).authStore = authStore;
  (window as any).router = router;
  (window as any).adminStore = adminStore;
}

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
