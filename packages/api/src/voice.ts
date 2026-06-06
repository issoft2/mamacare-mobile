/**
 * Voice endpoints for phone-friendly speech input and read-aloud.
 *
 * Expected backend contract:
 * - POST /voice/transcribe multipart/form-data with `file`
 *   -> { text: string }
 * - POST /voice/speech JSON { text, voice_style }
 *   -> audio blob, preferably audio/mpeg
 */

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "./client";

export type TranscribeVoiceResponse = {
  text: string;
};

export type TranscribeVoiceRequest = {
  audio: Blob;
  filename?: string;
};

export type TextToSpeechRequest = {
  text: string;
  voice_style?: "gentle_companion" | "calm" | "bright";
};

export function useTranscribeVoice() {
  return useMutation({
    mutationFn: async ({ audio, filename = "safeborn-voice.webm" }: TranscribeVoiceRequest) => {
      const form = new FormData();
      form.append("file", audio, filename);

      const response = await apiFetch("/voice/transcribe", {
        method: "POST",
        body: form,
      });

      return response.json() as Promise<TranscribeVoiceResponse>;
    },
  });
}

export function useTextToSpeech() {
  return useMutation({
    mutationFn: async ({
      text,
      voice_style = "gentle_companion",
    }: TextToSpeechRequest) => {
      const response = await apiFetch("/voice/speech", {
        method: "POST",
        body: JSON.stringify({ text, voice_style }),
        headers: {
          Accept: "audio/mpeg,audio/*",
        },
      });

      return response.blob();
    },
  });
}
