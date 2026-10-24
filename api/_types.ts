import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Type helper untuk Serverless Functions Vercel (Node.js runtime)
 * Menggunakan ekstensi dari IncomingMessage dan ServerResponse bawaan Node.js
 */
export type ApiRequest = IncomingMessage & {
  body?: any;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
};

export type ApiResponse = ServerResponse & {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => ApiResponse;
  send: (body: any) => ApiResponse;
};
