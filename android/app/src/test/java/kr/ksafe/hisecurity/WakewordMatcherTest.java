package kr.ksafe.hisecurity;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** JDK 17 main-based tests using synthetic fixtures only; no Android/JUnit dependencies. */
public final class WakewordMatcherTest {
    private static int count;

    private static void expect(boolean expected, String... candidates) {
        expectList(expected, Arrays.asList(candidates));
    }

    private static void expectList(boolean expected, List<String> candidates) {
        count++;
        if (WakewordMatcher.matches(candidates) != expected) {
            // Report only the fixture number, never candidate contents.
            throw new AssertionError("WakewordMatcher case " + count + " failed");
        }
    }

    public static void main(String[] args) {
        expect(true, "하이보안관");
        expect(true, "하이 보안관");
        expect(true, " 하이 보안관 ");
        expect(true, "하 이 보 안 관");
        expect(true, "하이보완관");
        expect(true, "하이 보완관");
        expect(true, "“하이 보안관!”");
        expect(true, "'하이보안관'");
        expect(true, "\"하이보안관\"");
        expect(true, "…(하이보안관)?!");
        expect(true, "「하이 보완관。」");
        expect(true, " \t“ 하이 보안관 ! ”\n");
        expect(true, Normalizer.normalize("하이보안관", Normalizer.Form.NFD));
        expect(true, Normalizer.normalize("하이 보안관", Normalizer.Form.NFD));
        expect(true, Normalizer.normalize("“하이 보완관!”", Normalizer.Form.NFD));

        expectList(false, null);
        expectList(false, Collections.emptyList());
        expect(false, (String) null);
        expect(false, "");
        expect(false, " \t\n\u0085\u00a0\u3000");
        expect(false, "“”?!…");
        expect(false, "하이보안관 도와줘");
        expect(false, "하이 보완관 도와줘");
        expect(false, "도와줘 하이보안관");
        expect(false, "하이,보안관");
        expect(false, "하이, 보안관");
        expect(false, "하이!보안관");
        expect(false, "하이-보안관");
        expect(false, "하이‘보안관’");
        expect(false, "보안관");
        expect(false, "하이");
        expect(false, "안녕하세요");
        expect(false, "하이보안관리자");
        expect(false, "하이보안관님");
        expect(false, "하이보완관리자");
        expect(false, "하이보안관 하이보안관");
        expect(false, "하이보안관123");
        expect(false, "123하이보안관");
        expect(false, "하이보안간");
        expect(false, "하의보안관");
        expect(false, "하이보안광");
        expect(false, "하이보안");
        expect(false, "하이보안관😀");
        expect(false, "😀하이보안관");
        expect(false, "+하이보안관+");
        expect(false, "하이\u200b보안관"); // Zero-width space is not Unicode whitespace.
        expect(false, "\ufeff하이보안관"); // BOM is not Unicode whitespace.
        expect(false, Normalizer.normalize("하이보안관 도와줘", Normalizer.Form.NFD));
        expect(false, Normalizer.normalize("하이,보안관", Normalizer.Form.NFD));

        expect(true, "하이보안관 도와줘", "하이보안관");
        expect(true, "안녕하세요", "하이보완관");
        expect(true, null, "하이보안관리자", "“하이 보안관!”");
        expect(true, "하이보안관", null, "하이");
        expect(false, null, "하이보안관 도와줘", "하이보안관리자");
        expect(false, "하이", "보안관"); // Never join different hypotheses.
        expect(false, "하이", "보완관", "하이,보안관");
        expect(false, null, "", "?!");

        // Every code point in Unicode White_Space, including non-breaking spaces/NEL.
        int[] spaces = {0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x0085,
                0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005,
                0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f,
                0x205f, 0x3000};
        for (int codePoint : spaces) {
            String space = new String(Character.toChars(codePoint));
            expect(true, space + "하이" + space + "보안관" + space);
            expect(true, "하이" + space + "보완관");
        }
        System.out.println("WakewordMatcher: " + count + " cases passed");
    }
}
