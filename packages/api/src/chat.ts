/**
 * packages/api/src/chat.ts
 * TanStack Query hooks for chat_service endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  CreateSessionRequest,
  SendMessageRequest,
} from "@safeborn/types";

export const chatKeys = {
  all: ["chat"] as const,
  sessions: () => [...chatKeys.all, "sessions"] as const,
  session: (id: string) => [...chatKeys.all, "session", id] as const,
};

export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: () => apiRequest<ChatSession[]>("/chat/sessions"),
  });
}

export function useChatSession(id: string) {
  return useQuery({
    queryKey: chatKeys.session(id),
    queryFn: () => apiRequest<ChatSessionDetail>(`/chat/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionRequest) =>
      apiRequest<ChatSession>("/chat/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.sessions() }),
  });
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageRequest) =>
      apiRequest<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatKeys.session(sessionId) }),
  });
}
