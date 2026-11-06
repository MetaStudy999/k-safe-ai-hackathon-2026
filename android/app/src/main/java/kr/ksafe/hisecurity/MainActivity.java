package kr.ksafe.hisecurity;

import android.annotation.SuppressLint;
import android.Manifest;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SafeBrowsingResponse;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.List;

/** Platform APIs only. Remote content never receives a native JavaScript bridge. */
public final class MainActivity extends Activity {
    private static final int RC_RECORD_AUDIO = 401;
    private WakewordEngine wakewordEngine;
    private View voiceStart;
    private View voiceStop;
    private TextView voiceStatus;
    private boolean resumed;
    private boolean voiceSessionActive;
    private boolean permissionRequestInFlight;
    private boolean voiceStartRequested;
    private FrameLayout content;
    private View errorPanel;
    private View loadingStatus;
    private TextView errorMessage;
    private ProgressBar progress;
    private WebView webView;
    private final List<WebView> popups = new ArrayList<>();
    private String lastUrl = NavigationPolicy.HOME_URL;
    private boolean failed;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        content = findViewById(R.id.content);
        errorPanel = findViewById(R.id.error_panel);
        errorMessage = findViewById(R.id.error_message);
        loadingStatus = findViewById(R.id.loading_status);
        progress = findViewById(R.id.progress);
        setupVoicePanel();
        View root = findViewById(R.id.root);
        // API 35 enforces edge-to-edge. Keep toolbar, retry buttons and keyboard unobscured.
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()
                                | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets.consumeSystemWindowInsets();
        });
        root.requestApplyInsets();
        findViewById(R.id.reload).setOnClickListener(view -> load(lastUrl));
        findViewById(R.id.retry).setOnClickListener(view -> load(lastUrl));
        findViewById(R.id.home).setOnClickListener(view -> load(NavigationPolicy.HOME_URL));
        findViewById(R.id.browser).setOnClickListener(view -> openExternal(lastUrl));
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        if (state != null && NavigationPolicy.isInternal(state.getString("last_url"))) {
            lastUrl = state.getString("last_url");
        }
        load(lastUrl);
    }

    private void setupVoicePanel() {
        voiceStart = findViewById(R.id.voice_start);
        voiceStop = findViewById(R.id.voice_stop);
        voiceStatus = findViewById(R.id.voice_status);
        wakewordEngine = new WakewordEngine(this, new WakewordEngine.Listener() {
            @Override public void onStateChanged(WakewordEngine.State state) {
                int message;
                voiceSessionActive = false;
                switch (state) {
                    case CHECKING_SUPPORT:
                        voiceSessionActive = true;
                        message = R.string.voice_checking_support;
                        break;
                    case STARTING:
                        voiceSessionActive = true;
                        message = R.string.voice_starting;
                        break;
                    case READY:
                        voiceSessionActive = true;
                        message = R.string.voice_ready;
                        break;
                    case LISTENING:
                        voiceSessionActive = true;
                        message = R.string.voice_listening;
                        break;
                    case PROCESSING:
                        voiceSessionActive = true;
                        message = R.string.voice_processing;
                        break;
                    case DETECTED: message = R.string.voice_detected; break;
                    case PERMISSION_DENIED: message = R.string.voice_permission; break;
                    case UNSUPPORTED: message = R.string.voice_unsupported; break;
                    case NO_SPEECH: message = R.string.voice_no_speech; break;
                    case NO_MATCH: message = R.string.voice_no_match; break;
                    case WRONG_WAKEWORD: message = R.string.voice_wrong_wakeword; break;
                    case LANGUAGE_NOT_SUPPORTED: message = R.string.voice_language_not_supported; break;
                    case LANGUAGE_UNAVAILABLE: message = R.string.voice_language_unavailable; break;
                    case AUDIO_FAILURE: message = R.string.voice_audio_failure; break;
                    case ENGINE_BUSY: message = R.string.voice_engine_busy; break;
                    case ENGINE_ERROR: message = R.string.voice_engine_error; break;
                    case TIMED_OUT: message = R.string.voice_timed_out; break;
                    case IDLE:
                    default: message = R.string.voice_idle; break;
                }
                if (voiceSessionActive && state != WakewordEngine.State.CHECKING_SUPPORT
                        && !wakewordEngine.isModelSupportVerified()) {
                    voiceStatus.setText(getString(R.string.voice_status_unverified, getString(message)));
                } else {
                    voiceStatus.setText(message);
                }
                updateVoiceControls();
            }

            @Override public void onDetected() {
                // Only the explicit session in this resumed, unlocked Activity may navigate.
                if (isVoiceForeground()) load(NavigationPolicy.HOME_URL);
            }
        });
        voiceStart.setOnClickListener(view -> requestVoiceSession());
        voiceStop.setOnClickListener(view -> {
            voiceStartRequested = false;
            wakewordEngine.stop();
        });
        updateVoiceControls();
    }

    private boolean isVoiceForeground() {
        KeyguardManager keyguard = getSystemService(KeyguardManager.class);
        return resumed && !isFinishing() && !isDestroyed()
                && keyguard != null && !keyguard.isKeyguardLocked();
    }

    private void updateVoiceControls() {
        voiceStart.setEnabled(resumed && !permissionRequestInFlight && !voiceSessionActive);
        voiceStop.setEnabled(resumed && (voiceSessionActive || voiceStartRequested));
    }

    private void requestVoiceSession() {
        if (!isVoiceForeground() || permissionRequestInFlight || voiceSessionActive) return;
        // Unsupported devices never request permission or create a microphone session.
        if (!WakewordEngine.isSupported(this)) {
            voiceStatus.setText(R.string.voice_unsupported);
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED) {
            startVoiceSession();
            return;
        }
        permissionRequestInFlight = true;
        voiceStartRequested = true;
        voiceStatus.setText(R.string.voice_permission_request);
        updateVoiceControls();
        try {
            requestPermissions(new String[] {Manifest.permission.RECORD_AUDIO}, RC_RECORD_AUDIO);
        } catch (RuntimeException exception) {
            permissionRequestInFlight = false;
            voiceStartRequested = false;
            voiceStatus.setText(R.string.voice_permission);
            updateVoiceControls();
        }
    }

    private void startVoiceSession() {
        if (!isVoiceForeground() || voiceSessionActive) return;
        voiceSessionActive = true;
        updateVoiceControls();
        wakewordEngine.start();
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions,
            int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != RC_RECORD_AUDIO || !permissionRequestInFlight) return;
        permissionRequestInFlight = false;
        boolean requested = voiceStartRequested;
        voiceStartRequested = false;
        if (isFinishing() || isDestroyed()) return;
        boolean granted = permissions.length == 1 && grantResults.length == 1
                && Manifest.permission.RECORD_AUDIO.equals(permissions[0])
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        updateVoiceControls();
        if (!granted) {
            voiceStatus.setText(R.string.voice_permission);
        } else if (requested && isVoiceForeground()) {
            startVoiceSession();
        } else {
            // A permission dialog can pause the Activity. Never defer a start to onResume.
            voiceStatus.setText(R.string.voice_permission_granted);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        webView = content.findViewById(R.id.web_view);
        if (webView == null) {
            // A renderer crash removes the old view; recreate it in the same content layer.
            webView = new WebView(this);
            webView.setId(R.id.web_view);
            content.addView(webView, 0, new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        }
        webView.setContentDescription(getString(R.string.web_content));
        WebSettings settings = webView.getSettings();
        // Required by the existing Next.js app, restricted to the trusted HTTPS origin below.
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        webView.setWebViewClient(new SecureClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                if (!failed) progress.setProgress(value);
            }

            @Override public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }

            @Override public boolean onShowFileChooser(WebView view,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                callback.onReceiveValue(null);
                toast(R.string.file_not_supported);
                return true;
            }

            @Override public boolean onCreateWindow(WebView view, boolean dialog,
                    boolean userGesture, Message message) {
                if (!userGesture) return false;
                // A transport WebView captures target=_blank without running popup scripts.
                WebView popup = new WebView(MainActivity.this);
                popup.getSettings().setAllowFileAccess(false);
                popup.getSettings().setAllowContentAccess(false);
                popup.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
                popup.setWebViewClient(new WebViewClient() {
                    @Override public boolean shouldOverrideUrlLoading(WebView target,
                            WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        if (request.isForMainFrame()) {
                            if (NavigationPolicy.isInternal(url)) load(url);
                            else openExternal(url);
                        }
                        target.post(() -> disposePopup(target));
                        return true;
                    }

                    @Override public WebResourceResponse shouldInterceptRequest(WebView target,
                            WebResourceRequest request) {
                        // Also deny POST and any request that skips the navigation callback.
                        return blockedResponse();
                    }
                });
                popups.add(popup);
                ((WebView.WebViewTransport) message.obj).setWebView(popup);
                message.sendToTarget();
                popup.postDelayed(() -> disposePopup(popup), 5000);
                return true;
            }
        });
        webView.setDownloadListener((url, agent, disposition, mime, length) -> {
            // Never download or execute files in the app. Browser handles HTTPS after a tap.
            new android.app.AlertDialog.Builder(this)
                    .setMessage(R.string.download_browser)
                    .setPositiveButton(R.string.open_browser, (dialog, which) -> openExternal(url))
                    .setNegativeButton(android.R.string.cancel, null).show();
        });
    }

    private void disposePopup(WebView popup) {
        if (popups.remove(popup)) popup.destroy();
    }

    private void load(String url) {
        if (!NavigationPolicy.isInternal(url)) {
            showError(R.string.error_unsafe);
            return;
        }
        if (webView == null) createWebView();
        lastUrl = url;
        failed = false;
        errorPanel.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        progress.setProgress(0);
        progress.setVisibility(View.VISIBLE);
        loadingStatus.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private void showError(int message) {
        failed = true;
        if (webView != null) {
            webView.stopLoading();
            webView.setVisibility(View.INVISIBLE);
        }
        progress.setVisibility(View.GONE);
        loadingStatus.setVisibility(View.GONE);
        errorMessage.setText(message);
        errorPanel.setVisibility(View.VISIBLE);
    }

    private void toast(int message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    private void openExternal(String url) {
        NavigationPolicy.Destination destination = NavigationPolicy.classify(url);
        Intent intent;
        switch (destination) {
            case INTERNAL:
            case BROWSER:
                intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                break;
            case DIALER:
                intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                break;
            case MAIL:
            case SMS:
                intent = new Intent(Intent.ACTION_SENDTO, Uri.parse(url));
                break;
            default:
                toast(R.string.blocked_link);
                return;
        }
        // Construct fresh intents; never parse intent:// or copy flags/extras from web content.
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException exception) {
            toast(R.string.no_external_app);
        }
    }

    private static WebResourceResponse blockedResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked",
                java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    private final class SecureClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            if (NavigationPolicy.isInternal(url)) return false;
            // Subframes and automatic redirects must never launch another app.
            if (request.isForMainFrame() && request.hasGesture()) openExternal(url);
            else if (request.isForMainFrame()) showError(R.string.error_unsafe);
            return true;
        }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view,
                WebResourceRequest request) {
            String url = request.getUrl().toString();
            boolean allowed = request.isForMainFrame() ? NavigationPolicy.isInternal(url)
                    : "https".equalsIgnoreCase(request.getUrl().getScheme());
            if (allowed) return null;
            if (request.isForMainFrame()) view.post(() -> showError(R.string.error_unsafe));
            return blockedResponse();
        }

        @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
            if (!NavigationPolicy.isInternal(url)) {
                showError(R.string.error_unsafe);
                return;
            }
            lastUrl = url;
            failed = false;
            errorPanel.setVisibility(View.GONE);
            view.setVisibility(View.VISIBLE);
            progress.setVisibility(View.VISIBLE);
            loadingStatus.setVisibility(View.VISIBLE);
        }

        @Override public void onPageFinished(WebView view, String url) {
            if (!failed && NavigationPolicy.isInternal(url)) {
                progress.setVisibility(View.GONE);
                loadingStatus.setVisibility(View.GONE);
            }
        }

        @Override public void onReceivedError(WebView view, WebResourceRequest request,
                WebResourceError error) {
            if (request.isForMainFrame()) showError(error.getErrorCode() == ERROR_FAILED_SSL_HANDSHAKE
                    ? R.string.error_tls : R.string.error_network);
        }

        @Override public void onReceivedHttpError(WebView view, WebResourceRequest request,
                WebResourceResponse response) {
            if (request.isForMainFrame()) showError(R.string.error_http);
        }

        @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            showError(R.string.error_tls);
        }

        @Override public void onSafeBrowsingHit(WebView view, WebResourceRequest request,
                int threatType, SafeBrowsingResponse callback) {
            // SafeBrowsingResponse is available only from Android 8.1 (API 27).
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                callback.backToSafety(true);
            }
            showError(R.string.error_unsafe);
        }

        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            content.removeView(view);
            webView = null;
            view.destroy();
            showError(R.string.error_renderer);
            return true;
        }
    }

    private void handleBack() {
        if (webView != null && webView.canGoBack()) {
            android.webkit.WebBackForwardList history = webView.copyBackForwardList();
            String previous = history.getItemAtIndex(history.getCurrentIndex() - 1).getUrl();
            if (NavigationPolicy.isInternal(previous)) {
                failed = false;
                errorPanel.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                webView.goBack();
                return;
            }
        }
        finish();
    }

    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { handleBack(); }

    @Override protected void onSaveInstanceState(Bundle state) {
        // Restore only a validated URL, never serialized page data or untrusted history.
        state.putString("last_url", lastUrl);
        super.onSaveInstanceState(state);
    }

    @Override protected void onResume() {
        super.onResume();
        resumed = true;
        updateVoiceControls();
        if (webView != null) webView.onResume();
    }

    @Override protected void onPause() {
        resumed = false;
        voiceStartRequested = false;
        wakewordEngine.stop();
        updateVoiceControls();
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override protected void onDestroy() {
        resumed = false;
        voiceStartRequested = false;
        wakewordEngine.close();
        for (WebView popup : new ArrayList<>(popups)) disposePopup(popup);
        if (webView != null) {
            content.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
