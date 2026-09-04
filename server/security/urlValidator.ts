import * as dns from 'dns';
import { URL } from 'url';

const BLOCKED_PROTOCOLS = ['file:', 'data:', 'javascript:', 'ftp:', 'ws:', 'wss:'];
const BLOCKED_HOSTNAMES = ['.local', '.internal', '.corp', '.lan', '.localhost'];
const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fd00:/,
  /^fe80:/,
  /^localhost$/i,
];

export async function validateUrl(urlString: string): Promise<{ valid: boolean; error?: string; resolvedIp?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (BLOCKED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, error: `Protocol ${parsed.protocol} is not allowed` };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  for (const pattern of PRIVATE_RANGES) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Private/internal addresses are not allowed' };
    }
  }

  for (const suffix of BLOCKED_HOSTNAMES) {
    if (hostname.endsWith(suffix)) {
      return { valid: false, error: `Hostnames ending with ${suffix} are not allowed` };
    }
  }

  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        resolve({ valid: false, error: 'DNS resolution failed' });
        return;
      }

      for (const pattern of PRIVATE_RANGES) {
        if (pattern.test(address)) {
          resolve({ valid: false, error: 'Resolved to a private/internal IP', resolvedIp: address });
          return;
        }
      }

      resolve({ valid: true, resolvedIp: address });
    });
  });
}
