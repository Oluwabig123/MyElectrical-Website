import type { NextConfig } from "next";

function sanitizeHost(value: string) {
  return value.trim().toLowerCase();
}

function readSupabaseHostname() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return "";

  try {
    return sanitizeHost(new URL(url).hostname);
  } catch {
    return "";
  }
}

function readConfiguredImageHosts() {
  const hosts = (process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS || "")
    .split(",")
    .map(sanitizeHost)
    .filter(Boolean);

  return Array.from(new Set(hosts));
}

function buildRemotePatterns() {
  const hosts = new Set<string>([
    "images.unsplash.com",
    readSupabaseHostname(),
    ...readConfiguredImageHosts(),
  ]);

  const patterns = Array.from(hosts)
    .filter(Boolean)
    .flatMap((hostname) => {
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

      return [
        {
          protocol: "https" as const,
          hostname,
        },
        ...(isLocalhost
          ? [
              {
                protocol: "http" as const,
                hostname,
              },
            ]
          : []),
      ];
    });

  return patterns;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.216.0"],
  images: {
    remotePatterns: buildRemotePatterns(),
  },
};

export default nextConfig;
