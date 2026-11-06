package kr.ksafe.hisecurity;

import static kr.ksafe.hisecurity.NavigationPolicy.Destination.*;

/** JVM assertions against production policy, without Android or test libraries. */
public final class NavigationPolicyTest {
    private static int count;
    private static void expect(String value, NavigationPolicy.Destination expected) {
        NavigationPolicy.Destination actual = NavigationPolicy.classify(value);
        if (actual != expected) throw new AssertionError(value + ": " + actual + " != " + expected);
        count++;
    }
    public static void main(String[] args) {
        expect(NavigationPolicy.HOME_URL, INTERNAL);
        expect("https://k-safe-ai-hackathon-2026.vercel.app/lab?q=hello#section", INTERNAL);
        expect("HTTPS://K-SAFE-AI-HACKATHON-2026.VERCEL.APP:443/", INTERNAL);
        expect("https://www.fss.or.kr/", BROWSER);
        expect("https://k-safe-ai-hackathon-2026.vercel.app.evil.test/", BROWSER);
        expect("https://k-safe-ai-hackathon-2026.vercel.app:444/", BROWSER);
        expect("https://k-safe-ai-hackathon-2026.vercel.app@evil.test/", BLOCKED);
        expect("https://evil.test@k-safe-ai-hackathon-2026.vercel.app/", BLOCKED);
        expect("https://example.com:65536/", BLOCKED);
        expect("https://example.com\\@k-safe-ai-hackathon-2026.vercel.app/", BLOCKED);
        expect("http://k-safe-ai-hackathon-2026.vercel.app/", BLOCKED);
        expect("http://example.com/", BLOCKED);
        expect("https://example.com/\nnext", BLOCKED);
        expect("tel:112", DIALER);
        expect("tel:+82-2-1234-5678", DIALER);
        expect("tel:*123%23", BLOCKED);
        expect("tel:112?anything=1", BLOCKED);
        expect("tel:112#123", BLOCKED);
        expect("mailto:help@example.com", MAIL);
        expect("sms:118", SMS);
        for (String value : new String[]{null, "", "/lab", "//example.com/", "https:example.com",
                "javascript:alert(1)", "file:///etc/passwd", "content://private/file",
                "data:text/html,hello", "intent://scan/#Intent;end", "blob:https://example.com/id",
                "tel://112", "tel:"}) expect(value, BLOCKED);
        System.out.println("NavigationPolicy: " + count + " cases passed");
    }
}
