import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    if (process.env.NODE_ENV === "production") securityHeaders.push(
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; upgrade-insecure-requests" },
    );
    return [
      { source: "/((?!admin/funcionarios/.+/biometria|ponto$).*)", headers: securityHeaders },
      { source: "/admin/funcionarios/:id/biometria", headers: [...securityHeaders.filter((header) => header.key !== "Permissions-Policy"), { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }] },
      { source: "/ponto", headers: [...securityHeaders.filter((header) => header.key !== "Permissions-Policy"), { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" }] },
    ];
  },
};

export default nextConfig;
