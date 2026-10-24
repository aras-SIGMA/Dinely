import { resolveHost } from './tenant-resolver';

export const host = resolveHost(window.location.hostname);
