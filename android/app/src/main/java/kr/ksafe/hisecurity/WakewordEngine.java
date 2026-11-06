package kr.ksafe.hisecurity;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognitionSupport;
import android.speech.RecognitionSupportCallback;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import java.util.List;

/** One explicit foreground tap, one on-device session. Never restarts itself. */
public final class WakewordEngine implements AutoCloseable {
    public enum State {
        IDLE, CHECKING_SUPPORT, STARTING, READY, LISTENING, PROCESSING, DETECTED,
        PERMISSION_DENIED, UNSUPPORTED, NO_SPEECH, NO_MATCH, WRONG_WAKEWORD,
        LANGUAGE_NOT_SUPPORTED, LANGUAGE_UNAVAILABLE, AUDIO_FAILURE,
        ENGINE_BUSY, ENGINE_ERROR, TIMED_OUT
    }

    public interface Listener {
        void onStateChanged(State state);
        void onDetected();
    }

    private final Context context;
    private final Listener listener;
    private final Handler main = new Handler(Looper.getMainLooper());
    // All mutable state and recognizer operations are confined to the main thread.
    private Session current;
    private boolean closed;

    public WakewordEngine(Context context, Listener listener) {
        this.context = context.getApplicationContext();
        this.listener = listener;
    }

    /** Availability is checked before permission is requested and again before creation. */
    public static boolean isSupported(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false;
        try {
            return SpeechRecognizer.isOnDeviceRecognitionAvailable(context);
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public void start() { onMain(this::startOnMain); }

    /** Main-thread UI diagnostic only; availability is never inferred from permission. */
    public boolean isModelSupportVerified() {
        return current != null && current.modelSupportVerified;
    }

    public void stop() {
        onMain(() -> {
            if (closed) return;
            releaseCurrent();
            listener.onStateChanged(State.IDLE);
        });
    }

    @Override public void close() {
        onMain(() -> {
            if (closed) return;
            closed = true;
            releaseCurrent();
        });
    }

    private void onMain(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) action.run();
        else main.post(action);
    }

    private void startOnMain() {
        if (closed || current != null) return;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || !isSupported(context)) {
            listener.onStateChanged(State.UNSUPPORTED);
            return;
        }
        if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            listener.onStateChanged(State.PERMISSION_DENIED);
            return;
        }
        Session session = new Session();
        current = session;
        try {
            // Never use createSpeechRecognizer(), even when offline recognition fails.
            session.recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context);
            session.recognizer.setRecognitionListener(session);
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                listener.onStateChanged(State.CHECKING_SUPPORT);
                if (current == session && !closed) session.checkSupport(intent);
            } else {
                session.beginListening(intent);
            }
        } catch (SecurityException exception) {
            finish(session, State.PERMISSION_DENIED);
        } catch (RuntimeException exception) {
            finish(session, State.ENGINE_ERROR);
        }
    }

    private void finish(Session session, State state) {
        if (closed || current != session) return;
        releaseCurrent();
        listener.onStateChanged(state);
        if (state == State.DETECTED && !closed) listener.onDetected();
    }

    private void releaseCurrent() {
        Session session = current;
        // Invalidate first: cancel/destroy may themselves trigger callbacks.
        current = null;
        if (session == null) return;
        main.removeCallbacks(session.supportTimeout);
        main.removeCallbacks(session.listeningTimeout);
        main.removeCallbacks(session.resultTimeout);
        SpeechRecognizer recognizer = session.recognizer;
        session.recognizer = null;
        if (recognizer == null) return;
        try {
            recognizer.cancel();
        } catch (RuntimeException ignored) {
            // Still destroy if a disconnected provider rejects cancellation.
        } finally {
            try {
                recognizer.destroy();
            } catch (RuntimeException ignored) {
                // No reuse, retry, fallback, or transcript logging.
            }
        }
    }

    private static boolean hasRecognizedText(List<String> candidates) {
        if (candidates == null) return false;
        for (String candidate : candidates) {
            if (candidate != null && candidate.codePoints().anyMatch(Character::isLetterOrDigit)) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsKorean(List<String> languages) {
        if (languages == null) return false;
        for (String language : languages) {
            if (language == null) continue;
            String tag = language.trim().replace('_', '-');
            if ("ko-KR".equalsIgnoreCase(tag) || "ko".equalsIgnoreCase(tag)) return true;
        }
        return false;
    }

    private static State stateForError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return State.NO_SPEECH;
            case SpeechRecognizer.ERROR_NO_MATCH: return State.NO_MATCH;
            case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED: return State.LANGUAGE_NOT_SUPPORTED;
            case SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE: return State.LANGUAGE_UNAVAILABLE;
            case SpeechRecognizer.ERROR_AUDIO: return State.AUDIO_FAILURE;
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
            case SpeechRecognizer.ERROR_TOO_MANY_REQUESTS: return State.ENGINE_BUSY;
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return State.PERMISSION_DENIED;
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return State.TIMED_OUT;
            // Includes client, network, server/disconnection and unknown provider errors.
            default: return State.ENGINE_ERROR;
        }
    }

    private final class Session implements RecognitionListener {
        private SpeechRecognizer recognizer;
        private boolean ended;
        private boolean awaitingSupport;
        private boolean listeningStarted;
        private boolean speechBegan;
        private boolean modelSupportVerified;
        private Intent recognizerIntent;
        // Session identity is checked by finish; phase guards reject obsolete timers.
        private final Runnable supportTimeout = () -> {
            if (awaitingSupport) finish(this, State.TIMED_OUT);
        };
        private final Runnable listeningTimeout = () -> {
            if (listeningStarted && !ended) finish(this, State.TIMED_OUT);
        };
        private final Runnable resultTimeout = () -> {
            if (ended) finish(this, State.TIMED_OUT);
        };

        private void checkSupport(Intent intent) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                beginListening(intent);
                return;
            }
            awaitingSupport = true;
            recognizerIntent = intent;
            main.postDelayed(supportTimeout, 10000);
            recognizer.checkRecognitionSupport(intent, context.getMainExecutor(),
                    new RecognitionSupportCallback() {
                        @Override public void onSupportResult(RecognitionSupport support) {
                            dispatch(() -> {
                                if (!awaitingSupport) return;
                                List<String> installed = support == null ? null
                                        : support.getInstalledOnDeviceLanguages();
                                if (containsKorean(installed)) {
                                    modelSupportVerified = true;
                                } else if (installed != null && (containsKorean(
                                        support.getSupportedOnDeviceLanguages()) || containsKorean(
                                        support.getPendingOnDeviceLanguages()))) {
                                    // Supported/pending is not installed. Never download or fall back.
                                    finish(Session.this, State.LANGUAGE_UNAVAILABLE);
                                    return;
                                }
                                // Empty/inconclusive lists do not prove Korean is unsupported.
                                beginListening(intent);
                            });
                        }

                        @Override public void onError(int error) {
                            dispatch(() -> {
                                if (!awaitingSupport) return;
                                if (error == SpeechRecognizer.ERROR_CANNOT_CHECK_SUPPORT) {
                                    beginListening(intent); // Unverified, still on-device only.
                                } else {
                                    finish(Session.this, stateForError(error));
                                }
                            });
                        }
                    });
        }

        private void beginListening(Intent intent) {
            if (closed || current != this || listeningStarted) return;
            awaitingSupport = false;
            main.removeCallbacks(supportTimeout);
            recognizerIntent = null;
            listeningStarted = true;
            listener.onStateChanged(State.STARTING);
            if (closed || current != this) return;
            try {
                recognizer.startListening(intent);
                // Support lookup never consumes listening time. A synchronous callback
                // may already have ended/released this session, so do not re-arm it.
                if (!closed && current == this && !ended) {
                    main.postDelayed(listeningTimeout, 15000);
                }
            } catch (SecurityException exception) {
                finish(this, State.PERMISSION_DENIED);
            } catch (RuntimeException exception) {
                finish(this, State.ENGINE_ERROR);
            }
        }

        private void dispatch(Runnable action) {
            onMain(() -> {
                if (closed || current != this) return;
                try {
                    action.run();
                } catch (SecurityException exception) {
                    finish(this, State.PERMISSION_DENIED);
                } catch (RuntimeException exception) {
                    // Includes malformed provider results; never expose exception text.
                    finish(this, State.ENGINE_ERROR);
                }
            });
        }

        @Override public void onReadyForSpeech(Bundle params) {
            dispatch(() -> {
                // A late readiness callback must not overwrite actual speech detection.
                if (listeningStarted && !speechBegan && !ended) {
                    listener.onStateChanged(State.READY);
                }
            });
        }

        @Override public void onBeginningOfSpeech() {
            dispatch(() -> {
                if (listeningStarted && !speechBegan && !ended) {
                    speechBegan = true;
                    listener.onStateChanged(State.LISTENING);
                }
            });
        }

        @Override public void onEndOfSpeech() {
            dispatch(() -> {
                if (!listeningStarted || ended) return;
                ended = true;
                // The endpointer stops listening automatically. Keep the recognizer
                // for onResults/onError; destroying here would lose final results.
                main.removeCallbacks(listeningTimeout);
                main.postDelayed(resultTimeout, 8000);
                listener.onStateChanged(State.PROCESSING);
            });
        }

        @Override public void onError(int error) {
            dispatch(() -> {
                // Some providers deliver support errors through RecognitionListener too.
                if (awaitingSupport && error == SpeechRecognizer.ERROR_CANNOT_CHECK_SUPPORT) {
                    beginListening(recognizerIntent);
                } else {
                    finish(this, stateForError(error));
                }
            });
        }

        @Override public void onResults(Bundle results) {
            dispatch(() -> {
                if (!listeningStarted) return;
                List<String> candidates = results == null ? null
                        : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                finish(this, WakewordMatcher.matches(candidates) ? State.DETECTED
                        : hasRecognizedText(candidates) ? State.WRONG_WAKEWORD : State.NO_MATCH);
            });
        }

        // Raw audio and partial transcripts are never consumed, logged, stored, or sent.
        @Override public void onRmsChanged(float rmsdB) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onPartialResults(Bundle partialResults) { }
        @Override public void onEvent(int eventType, Bundle params) { }
    }
}
