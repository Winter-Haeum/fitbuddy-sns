package io.github.winterhaeum.fitbuddy

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * Health Connect의 "왜 이 권한이 필요한가요" 화면(그리고 Android 14+의
 * VIEW_PERMISSION_USAGE / HEALTH_PERMISSIONS 진입점)이 여는 Activity.
 *
 * Health Connect 공식 문서 요구사항: 이 화면은 앱이 공개한 것과 동일한 개인정보
 * 처리방침을 보여줘야 한다. 네이티브 문구를 별도로 두면 웹 /privacy 페이지와
 * 내용이 어긋날 수 있으므로, 단일 진실 공급원인 공개 privacy URL을 그대로 로드해
 * 보여준다(임의 JavaScript 브리지 없음, 표시 목적 외 기능 없음).
 */
class PermissionsRationaleActivity : AppCompatActivity() {

    companion object {
        // FitBuddy 웹/PWA의 실제 배포 주소(GitHub Pages, gh api repos/.../pages로 확인) 기준.
        private const val PRIVACY_URL = "https://winter-haeum.github.io/fitbuddy-sns/privacy"
        private const val FALLBACK_HTML =
            "<html><body style=\"font-family:sans-serif;padding:24px;color:#333;\">" +
                "<p>개인정보 처리방침을 불러오지 못했습니다.<br/>인터넷 연결을 확인한 뒤 다시 시도해주세요.</p>" +
                "</body></html>"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this)
        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // 메인 페이지 로드 실패일 때만 대체 화면을 보여준다(흰 화면 방지). 하위 리소스
                // 오류까지 대체 화면으로 덮어쓰지 않기 위해 isForMainFrame을 확인한다.
                if (request?.isForMainFrame == true) {
                    view?.loadData(FALLBACK_HTML, "text/html", "UTF-8")
                }
            }
        }
        setContentView(webView)
        webView.loadUrl(PRIVACY_URL)
    }
}
