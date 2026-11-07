import type { ApiRequest, ApiResponse } from '../_types';

export async function parseJsonBody<T = any>(req: ApiRequest): Promise<T> {
  const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB batas aman

  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    if (Buffer.byteLength(req.body, 'utf8') > MAX_PAYLOAD_SIZE) {
      throw new Error('Ukuran payload melebihi batas maksimal (1MB).');
    }
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new Error('Format JSON pada body request tidak valid.');
    }
  }

  return new Promise<T>((resolve, reject) => {
    let raw = '';
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_PAYLOAD_SIZE) {
        if (typeof (req as any).destroy === 'function') {
          (req as any).destroy();
        }
        reject(new Error('Ukuran payload melebihi batas maksimal (1MB).'));
        return;
      }
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
