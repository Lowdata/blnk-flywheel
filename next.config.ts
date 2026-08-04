import type { NextConfig } from 'next';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.com blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https: wss: ws: http://localhost:* wss://localhost:* blob: data:;
  worker-src 'self' blob: data:;
  frame-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
    turbopack: {
        // Silence the "multiple lockfiles" workspace-root inference warning
        root: __dirname,
    },
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/(.*)',
                headers: [
                    // Clickjacking protection
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // Prevent MIME-type sniffing
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Referrer information policy
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Disable permissions not needed
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                    // Basic XSS filter for older browsers
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    // HSTS — enforce HTTPS for 1 year
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    // Content Security Policy — prevents XSS, restricts allowed origins
                    { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
                    // Allows wallet popup windows (RainbowKit/WalletConnect use popups)
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
                ],
            },
            {
                // Long-lived cache for immutable 3D assets
                source: '/assets/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                // Cache public GLBs
                source: '/:file*.glb',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
                ],
            },
        ];
    },
};

export default nextConfig;
