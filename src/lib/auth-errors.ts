/** True only for auth/session failures — avoid matching unrelated API errors containing "token". */
export function isAuthSessionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    /unauthorized/.test(m) ||
    /session expired/.test(m) ||
    /invalid or expired token/.test(m) ||
    /missing or malformed authorization/.test(m) ||
    /jwt expired/.test(m) ||
    /invalid refresh token/.test(m)
  );
}
