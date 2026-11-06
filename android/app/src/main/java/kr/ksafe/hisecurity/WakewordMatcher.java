package kr.ksafe.hisecurity;

import java.text.Normalizer;
import java.util.List;

/** Pure Java whole-candidate matcher. Keeps no audio, transcript, or match history. */
public final class WakewordMatcher {
    private WakewordMatcher() { }

    public static boolean matches(List<String> candidates) {
        if (candidates == null) return false;
        for (String candidate : candidates) {
            if (candidate == null) continue;
            String composed = Normalizer.normalize(candidate, Normalizer.Form.NFC);
            StringBuilder compact = new StringBuilder();
            for (int i = 0; i < composed.length();) {
                int character = composed.codePointAt(i);
                i += Character.charCount(character);
                // Java's two whitespace predicates omit Unicode NEXT LINE (U+0085).
                if (!Character.isWhitespace(character) && !Character.isSpaceChar(character)
                        && character != 0x0085) {
                    compact.appendCodePoint(character);
                }
            }
            int start = 0;
            int end = compact.length();
            while (start < end && isPunctuation(compact.codePointAt(start))) {
                start += Character.charCount(compact.codePointAt(start));
            }
            while (start < end && isPunctuation(compact.codePointBefore(end))) {
                end -= Character.charCount(compact.codePointBefore(end));
            }
            // Only outer punctuation is removed; internal punctuation and extra words fail.
            String wholeCandidate = compact.substring(start, end);
            // The second spelling is a single explicit ASR alias, not general fuzzy matching.
            if ("하이보안관".equals(wholeCandidate) || "하이보완관".equals(wholeCandidate)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isPunctuation(int character) {
        switch (Character.getType(character)) {
            case Character.CONNECTOR_PUNCTUATION:
            case Character.DASH_PUNCTUATION:
            case Character.START_PUNCTUATION:
            case Character.END_PUNCTUATION:
            case Character.INITIAL_QUOTE_PUNCTUATION:
            case Character.FINAL_QUOTE_PUNCTUATION:
            case Character.OTHER_PUNCTUATION:
                return true;
            default: return false;
        }
    }
}
