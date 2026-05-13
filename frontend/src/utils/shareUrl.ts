/**
 * Returns the correct base URL for sharing poll links.
 *
 * - In production (deployed): uses window.location.origin  → real domain
 * - In development on localhost: replaces "localhost" with the machine's
 *   LAN IP so the link works on phones / other devices on the same WiFi.
 *
 * The LAN IP is injected at build-time by Vite via VITE_HOST_IP.
 * If not set, falls back to window.location.origin (safe default).
 */
export const getShareBaseUrl = (): string => {
  const origin = window.location.origin;

  // If we're already on a real IP or domain, use it as-is
  if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }

  // Replace localhost with the LAN IP injected at build time
  const lanIp = import.meta.env.VITE_HOST_IP as string | undefined;
  if (lanIp) {
    // Keep the same port, just swap the host
    return origin.replace(/localhost|127\.0\.0\.1/, lanIp);
  }

  // Fallback — still localhost (works on same machine)
  return origin;
};

export const getPollShareUrl = (publicLink: string): string =>
  `${getShareBaseUrl()}/p/${publicLink}`;
