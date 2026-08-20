// Shared cookie names for vendor auth tokens.
// Kept in their own module (not auth.ts) so api.ts can read them without a circular import.
export const ACCESS_TOKEN_COOKIE = "vendor_access_token";
export const REFRESH_TOKEN_COOKIE = "vendor_refresh_token";
export const USER_COOKIE = "vendor_user";
