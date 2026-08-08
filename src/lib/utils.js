import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Neutralizes regex metacharacters so user input can be used inside a
// $regex query as a literal rather than as a pattern.
export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Mongo documents — even from .lean() — carry ObjectId and Date instances,
// which React refuses to pass from a server component to a client one because
// they have toJSON methods. This flattens them to strings so query results can
// be handed straight to client blocks.
export function toPlain(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}
