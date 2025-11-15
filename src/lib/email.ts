import * as z from "zod";

/** Checks if string is email-like */
export function isEmail(s: string): boolean {
  return z.email().safeParse(s).success;
}
