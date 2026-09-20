import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const isProduction = process.env.NODE_ENV === "production"
    const scriptSource = isProduction ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'"
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src ${scriptSource}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-src 'self' https://www.google.com https://maps.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      isProduction ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; ")

    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
      ],
    }]
  },
};

export default nextConfig;
