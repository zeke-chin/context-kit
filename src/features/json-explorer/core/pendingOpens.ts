export type OpenKind = 'json' | 'text' | 'markdown' | 'python';

/**
 * Hover markdown links pass their arguments through a `command:` URI, which the
 * hover renderer drops once it grows large — a single big string value can
 * produce a 100KB+ URI, and the command then fires with every argument
 * `undefined`. So the hover never embeds the (potentially huge) content in the
 * URI; it stashes the content here and embeds only a short token, which the
 * command handler trades back via `takePendingOpen`.
 *
 * CodeLens does NOT need this — its `command.arguments` travel over the host
 * RPC channel, which carries large payloads fine.
 */
export type PendingOpen = { content: string; keyPath: string; kind: OpenKind };

export const MAX_PENDING_OPENS = 200;

const pendingOpens = new Map<string, PendingOpen>();
let pendingOpenSeq = 0;

export function stashPendingOpen(open: PendingOpen): string {
  const token = String(pendingOpenSeq++);
  pendingOpens.set(token, open);
  // Bound memory: a hover that is shown but never clicked would otherwise leak.
  // Insertion order is preserved, so the oldest tokens are evicted first; the
  // most recent entries (the one the user is about to click) always survive.
  while (pendingOpens.size > MAX_PENDING_OPENS) {
    const oldest = pendingOpens.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    pendingOpens.delete(oldest);
  }
  return token;
}

export function takePendingOpen(token: string): PendingOpen | undefined {
  // Intentionally not deleted on read: the same hover link can be clicked more
  // than once. The FIFO bound in `stashPendingOpen` is what reclaims memory.
  return pendingOpens.get(token);
}

export function sanitize(keyPath: string | undefined): string {
  const safe = (keyPath ?? '').replace(/[^A-Za-z0-9._-]/g, '_');
  return safe.length > 0 ? safe : 'root';
}

export function clearPendingOpens(): void {
  pendingOpens.clear();
}
