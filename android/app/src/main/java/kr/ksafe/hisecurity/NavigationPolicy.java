package kr.ksafe.hisecurity;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/** Strict parsing shared by navigation, resource interception, restore and JVM tests. */
public final class NavigationPolicy {
    public static final String HOME_URL = "https://k-safe-ai-hackathon-2026.vercel.app/";
    private static final String APP_HOST = "k-safe-ai-hackathon-2026.vercel.app";

    public enum Destination { INTERNAL, BROWSER, DIALER, MAIL, SMS, BLOCKED }

    private NavigationPolicy() { }

    public static Destination classify(String value) {
        if (value == null || value.isEmpty() || value.indexOf('\\') >= 0) {
            return Destination.BLOCKED;
        }
        // Reject controls instead of letting Android and Chromium normalize differently.
        for (int i = 0; i < value.length(); i++) {
            if (Character.isISOControl(value.charAt(i))) return Destination.BLOCKED;
        }
        final URI uri;
        try {
            uri = new URI(value);
        } catch (URISyntaxException exception) {
            return Destination.BLOCKED;
        }
        if (uri.getScheme() == null) return Destination.BLOCKED;
        String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        if (scheme.equals("https") || scheme.equals("http")) {
            if (!scheme.equals("https")) return Destination.BLOCKED;
            if (uri.isOpaque() || uri.getHost() == null || uri.getRawUserInfo() != null
                    || uri.getPort() > 65535) return Destination.BLOCKED;
            // Require a canonical authority for the trusted origin (including port).
            if (scheme.equals("https") && APP_HOST.equalsIgnoreCase(uri.getHost())
                    && (APP_HOST.equalsIgnoreCase(uri.getRawAuthority())
                    || (APP_HOST + ":443").equalsIgnoreCase(uri.getRawAuthority()))) {
                return Destination.INTERNAL;
            }
            return Destination.BROWSER;
        }
        String part = uri.getRawSchemeSpecificPart();
        if (part == null || part.isEmpty() || part.startsWith("//")) return Destination.BLOCKED;
        switch (scheme) {
            // Never hand service codes, query parameters or encoded commands to a dialer.
            case "tel": return part.matches("[+0-9().-]+") && uri.getRawFragment() == null
                    ? Destination.DIALER : Destination.BLOCKED;
            case "mailto": return Destination.MAIL;
            case "sms": return Destination.SMS;
            default: return Destination.BLOCKED;
        }
    }

    public static boolean isInternal(String value) {
        return classify(value) == Destination.INTERNAL;
    }
}
