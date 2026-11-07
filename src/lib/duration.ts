const DURATION_PART = /^\d+(\.\d+)?$/;

/** Parse an itunes:duration value given as seconds, MM:SS or HH:MM:SS into seconds */
export function parseDuration(text: string | undefined): number | undefined {
  if (text === undefined) return undefined;
  const parts = text.trim().split(":");
  if (parts.length > 3) return undefined;
  if (!parts.every((part) => DURATION_PART.test(part))) return undefined;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}
