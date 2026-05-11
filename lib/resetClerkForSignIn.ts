/**
 * Clears stuck Clerk client state (e.g. `session_exists` with `status: "pending"` and tasks
 * like `setup-mfa`). A plain `signOut()` is not always enough for a pending session.
 */
type ClerkForReset = {
  signOut: (options?: { sessionId?: string }) => Promise<void>;
  client?: {
    sessions: Array<{ id: string }>;
    removeSessions: () => Promise<unknown>;
  };
};

export async function resetClerkForSignIn(clerk: ClerkForReset): Promise<void> {
  if (clerk.client?.removeSessions) {
    try {
      await clerk.client.removeSessions();
    } catch {
      /* */
    }
  }
  const sessions = clerk.client?.sessions;
  if (sessions?.length) {
    for (const s of sessions) {
      try {
        await clerk.signOut({ sessionId: s.id });
      } catch {
        /* */
      }
    }
  }
  try {
    await clerk.signOut();
  } catch {
    /* */
  }
}
