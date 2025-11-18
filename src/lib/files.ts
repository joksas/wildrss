import { err, ok, type Result } from "neverthrow";

const ENCLOSURE_EXTENSIONS = [
  "mp3",
  "m4a",
  "mov",
  "mp4",
  "m4v",
  "pdf",
  "m3u8",
] as const;
export type EnclosureExtension = (typeof ENCLOSURE_EXTENSIONS)[number];
export const APPLE_PODCASTS_ENCLOSURE_EXTENSIONS = [
  "mp3",
  "m4a",
  "mov",
  "mp4",
  "m4v",
  "pdf",
] satisfies EnclosureExtension[];

const ALLOWED_MIMETYPES: Record<EnclosureExtension, string[]> = {
  mp3: ["audio/mpeg", "audio/mp3"],
  m4a: ["audio/mp4", "audio/x-m4a", "audio/m4a"],
  mov: ["video/quicktime"],
  mp4: ["video/mp4"],
  m4v: ["video/x-m4v"],
  m3u8: ["application/x-mpegURL", "application/vnd.apple.mpegurl"],
  pdf: ["application/pdf"],
};

/** Check if a given mimetype is allowed for a given file extension */
export function checkAllowedMimetype({
  extension,
  mimetype,
}: {
  extension: string;
  mimetype: string;
}): Result<void, string[]> {
  const allowed = ALLOWED_MIMETYPES[extension as EnclosureExtension];
  if (!allowed) return ok();

  if (!allowed.map((m) => m.toLowerCase()).includes(mimetype.toLowerCase()))
    return err(allowed);

  return ok();
}
