"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechStatus = "idle" | "loading" | "playing" | "finished" | "stopped" | "unsupported" | "error";

export function useGuideSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    const utterance = utteranceRef.current;
    // Ignore delayed events from an utterance that was stopped or replaced.
    utteranceRef.current = null;
    if (startTimer.current !== null) clearTimeout(startTimer.current);
    startTimer.current = null;
    if (utterance) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    cancel();
    setStatus("stopped");
  }, [cancel]);

  const speak = useCallback((text: string) => {
    cancel();
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      const synthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      const koreanVoices = synthesis.getVoices().filter((voice) => /^ko(?:[-_]|$)/i.test(voice.lang));
      const voice = koreanVoices.find((voice) => voice.localService) ?? koreanVoices[0];
      if (voice) utterance.voice = voice;
      // The browser can still select Korean when its voice list has not loaded yet.
      utterance.lang = "ko-KR";
      utterance.rate = 0.95;
      utteranceRef.current = utterance;
      setStatus("loading");
      utterance.onstart = () => {
        if (utteranceRef.current !== utterance) return;
        if (startTimer.current !== null) clearTimeout(startTimer.current);
        startTimer.current = null;
        setStatus("playing");
      };
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        if (startTimer.current !== null) clearTimeout(startTimer.current);
        startTimer.current = null;
        setStatus("finished");
      };
      utterance.onerror = () => {
        if (utteranceRef.current !== utterance) return;
        cancel();
        setStatus("error");
      };
      startTimer.current = setTimeout(() => {
        if (utteranceRef.current !== utterance) return;
        cancel();
        setStatus("error");
      }, 8000);
      // Start directly in the user's click, including on mobile browsers.
      synthesis.speak(utterance);
    } catch {
      cancel();
      setStatus("error");
    }
  }, [cancel]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", stop);
    // Prime asynchronously loaded voice lists before the first selection.
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", stop);
      cancel();
    };
  }, [cancel, stop]);

  return { status, speak, stop };
}
