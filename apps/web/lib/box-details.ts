import type { BoxSummary } from "./boxes";

export const contactChannels = [
  "whatsapp",
  "phone",
  "email",
  "instagram",
  "website",
] as const;
export type ContactChannel = (typeof contactChannels)[number];
export type ContactAction = {
  channel: ContactChannel;
  value: string;
  href: string;
};

export function contactHref(
  channel: ContactChannel,
  raw: string,
): string | null {
  const value = raw.trim();
  if (!value || /[\r\n]/.test(value)) return null;
  if (channel === "whatsapp" || channel === "phone") {
    const phone = value.replace(/[\s()-]/g, "");
    if (!/^\+?[1-9]\d{6,14}$/.test(phone)) return null;
    return channel === "whatsapp"
      ? `https://wa.me/${phone.replace(/^\+/, "")}`
      : `tel:${phone}`;
  }
  if (channel === "email")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? `mailto:${encodeURIComponent(value)}`
      : null;
  if (channel === "instagram") {
    const handle = value
      .replace(/^https:\/\/(?:www\.)?instagram\.com\//, "")
      .replace(/\/$/, "")
      .replace(/^@/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(handle)
      ? `https://www.instagram.com/${handle}/`
      : null;
  }
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !/\s/.test(value) &&
      url.hostname.includes(".")
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function contactActions(
  box: Pick<BoxSummary, ContactChannel | "supportContact">,
) {
  const actions: ContactAction[] = [];
  for (const channel of contactChannels) {
    const value = box[channel]?.trim();
    const href = value ? contactHref(channel, value) : null;
    if (value && href) actions.push({ channel, value, href });
  }
  // Preserve free-form legacy instructions; migrate recognizable lines to actions.
  const notes: string[] = [];
  for (const line of (box.supportContact ?? "")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean)) {
    const normalized = line
      .replace(
        /^(?:whatsapp|phone|tel(?:éfono|efone)?|email|e-mail|correo|instagram|website|site|sitio web)\s*:\s*/i,
        "",
      )
      .trim();
    const token = (value: string) =>
      value.toLowerCase().replace(/[\s()+-]/g, "");
    if (actions.some((item) => token(item.value) === token(normalized)))
      continue;
    const labeledChannel = /^whatsapp\s*:/i.test(line)
      ? "whatsapp"
      : /^(?:phone|tel)/i.test(line)
        ? "phone"
        : null;
    const action = (
      labeledChannel ? ([labeledChannel] as ContactChannel[]) : contactChannels
    )
      .map((channel) => ({
        channel,
        value: normalized,
        href: contactHref(channel, normalized),
      }))
      .find(
        (item) =>
          item.href &&
          (item.channel !== "instagram" ||
            normalized.startsWith("@") ||
            normalized.includes("instagram.com/")),
      );
    if (action?.href) {
      if (actions.some((item) => item.href === action.href)) continue;
      if (actions.some((item) => item.channel === action.channel))
        notes.push(line);
      else actions.push({ ...action, href: action.href });
    } else notes.push(line);
  }
  actions.sort(
    (a, b) =>
      contactChannels.indexOf(a.channel) - contactChannels.indexOf(b.channel),
  );
  return { actions, notes: [...new Set(notes)].join("\n") };
}

export function boxDestination(
  box: Pick<BoxSummary, "latitude" | "longitude" | "address" | "location">,
) {
  const { latitude: lat, longitude: lng } = box;
  const coordinates =
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180;
  const destination = coordinates
    ? `${lat},${lng}`
    : box.address?.trim() || box.location?.trim() || null;
  return {
    coordinates,
    destination,
    google: destination
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
      : null,
    apple: destination
      ? `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`
      : null,
  };
}
