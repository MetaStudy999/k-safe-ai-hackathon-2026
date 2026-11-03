"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const BEFORE_TRANSFER_AUDIO = "/audio/before-transfer-ko-sunhi-v1-20261104.mp3";
type SpeechStatus = "idle" | "loading" | "playing" | "finished" | "stopped" | "error";

export function useGuideSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (startTimer.current !== null) clearTimeout(startTimer.current);
    startTimer.current = null;
  }, []);

  const cancel = useCallback(() => {
    const audio = audioRef.current;
    // Invalidate before pausing: old events and play() rejections must be ignored.
    audioRef.current = null;
    clearTimer();
    if (audio) {
      audio.onplaying = audio.onwaiting = audio.onpause = audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, [clearTimer]);

  const stop = useCallback(() => {
    cancel();
    setStatus("stopped");
  }, [cancel]);

  const speak = useCallback(() => {
    cancel();
    try {
      // A fresh element starts at zero and cannot inherit events from a previous run.
      const audio = new Audio(BEFORE_TRANSFER_AUDIO);
      audioRef.current = audio;
      const current = () => audioRef.current === audio;
      const fail = () => {
        if (!current()) return;
        cancel();
        setStatus("error");
      };
      const loading = () => {
        if (!current()) return;
        clearTimer();
        setStatus("loading");
        startTimer.current = setTimeout(fail, 15000);
      };
      audio.onplaying = () => {
        if (!current()) return;
        clearTimer();
        setStatus("playing");
      };
      audio.onwaiting = loading;
      audio.onpause = () => {
        if (!current() || audio.ended) return;
        clearTimer();
        setStatus("stopped");
      };
      audio.onended = () => {
        if (!current()) return;
        clearTimer();
        setStatus("finished");
      };
      audio.onerror = fail;
      loading();
      // Call synchronously in the user's click/keyboard activation for mobile playback.
      // Never fall back to browser speech synthesis on failure.
      void audio.play().catch(fail);
    } catch {
      cancel();
      setStatus("error");
    }
  }, [cancel, clearTimer]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", stop);
      cancel();
    };
  }, [cancel, stop]);

  return { status, speak, stop };
}
