import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import { ApiRequestError } from "@mumcare/api";

/** True when `POST /v1/client/sign_ins` (or sign_ups) fails with a client that already has a session. */
export function isClerkSessionExistsError(err: unknown): boolean {
  if (!isClerkAPIResponseError(err)) {
    return false;
  }
  return (err.errors ?? []).some((e) => e.code === "session_exists");
}

/**
 * User-facing string for API failures, Clerk `errors[0].message`, or generic throws.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiRequestError) {
    return err.body.error?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "errors" in err) {
    const first = (err as { errors?: { message?: string; long_message?: string }[] }).errors?.[0];
    if (first?.long_message) {
      return first.long_message;
    }
    if (first?.message) {
      return first.message;
    }
  }
  return fallback;
}
