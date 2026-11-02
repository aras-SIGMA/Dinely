import type { ApiRequest, ApiResponse } from '../_types';

export async function parseJsonBody<T = any>(req: ApiRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new Error('Format JSON pada body request tidak valid.');
    }
  }

  return new Promise<T>((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) {
        return resolve({} as T);
      }
      try {
        resolve(JSON.parse(raw) as T);
      } catch {
        reject(new Error('Format JSON pada body request tidak valid.'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export function sendJson(res: ApiResponse, statusCode: number, data: unknown): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }
  // Fallback for native Node ServerResponse
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
