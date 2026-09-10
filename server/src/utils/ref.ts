const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Human-readable reference like WB-7KQ4M2 (uniqueness enforced by the DB). */
export const genRef = (prefix: string): string => `${prefix}-${randomCode(6)}`;
