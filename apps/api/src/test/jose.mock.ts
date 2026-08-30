export const createRemoteJWKSet = jest.fn(() => jest.fn());

export const jwtVerify = jest.fn();

export type JWTPayload = {
  sub?: string;
  email?: string;
  [key: string]: unknown;
};