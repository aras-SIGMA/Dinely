import { resolveHost } from './tenant-resolver';

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const search = typeof window !== 'undefined' ? window.location.search : '';

export const host = resolveHost(hostname, search);
