import crypto from "node:crypto";

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
