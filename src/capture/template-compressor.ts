import type { Tag } from '../types.js';
import { Compressed, Compressor } from './compressor.js';

/** Keyword → tag inference table, checked in order. First hit wins. */
const TAG_KEYWORDS: ReadonlyArray<[Tag, readonly string[]]> = [
  ['COMMIT', ['commit']],
  ['SEC', ['secret', 'password', 'key']],
  ['UI', ['style', 'css', 'color']],
  ['COPY', ['unlock', 'seamless', 'elevate', 'copy']],
  ['CODE', ['useeffect', 'dry', 'duplicate']],
  ['PERF', ['slow', 'perf', 'n+1']],
];

/** Generic fallback fix when none can be extracted. A fix is mandatory. */
const GENERIC_FIX = 'follow project standard';

function inferTag(text: string): Tag {
  const lower = text.toLowerCase();
  for (const [tag, keywords] of TAG_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) {
      return tag;
    }
  }
  return 'REQ';
}

/**
 * Offline, deterministic Compressor.
 *
 * Parsing rules:
 *  - If the input contains an arrow (`→` or `->`), split anti-pattern / fix on it.
 *  - Otherwise treat the whole input as the anti-pattern and use a generic fix.
 *  - The tag is taken from the caller if provided, else inferred by keyword.
 *  - `fix` is guaranteed non-empty (a rule without a concrete fix is nagging).
 */
export class TemplateCompressor implements Compressor {
  async compress(mistake: string, tag?: Tag): Promise<Compressed> {
    const input = mistake.trim();
    const match = input.match(/(.*?)(?:→|->)(.*)/s);

    let antiPattern: string;
    let fix: string;
    if (match) {
      antiPattern = match[1].trim();
      fix = match[2].trim();
    } else {
      antiPattern = input;
      fix = '';
    }

    if (antiPattern.length === 0) {
      antiPattern = input;
    }
    if (fix.length === 0) {
      fix = GENERIC_FIX;
    }

    return {
      tag: tag ?? inferTag(input),
      antiPattern,
      fix,
    };
  }
}
