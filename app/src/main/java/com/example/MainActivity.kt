package com.example

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebResourceErrorCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val fileChooserLauncher =
      registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (filePathCallback != null) {
          val results =
              if (result.resultCode == RESULT_OK && result.data != null) {
                val dataUri = result.data?.data
                val clipData = result.data?.clipData
                when {
                  clipData != null -> {
                    val count = clipData.itemCount
                    Array(count) { i -> clipData.getItemAt(i).uri }
                  }
                  dataUri != null -> arrayOf(dataUri)
                  else -> null
                }
              } else {
                null
              }
          filePathCallback?.onReceiveValue(results)
          filePathCallback = null
        }
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      MyApplicationTheme {
        Box(
            modifier =
                Modifier.fillMaxSize()
                    .background(Color(0xFF0B0F19))
                    .statusBarsPadding()
                    .navigationBarsPadding()
                    .imePadding()
        ) {
          ResuMatchWebView(
              onShowFileChooser = { callback, fileChooserParams ->
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val intent =
                    fileChooserParams?.createIntent()
                        ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                          type = "*/*"
                          addCategory(Intent.CATEGORY_OPENABLE)
                        }
                try {
                  fileChooserLauncher.launch(intent)
                  true
                } catch (e: Exception) {
                  filePathCallback?.onReceiveValue(null)
                  filePathCallback = null
                  false
                }
              }
          )
        }
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ResuMatchWebView(
    onShowFileChooser: (ValueCallback<Array<Uri>>, WebChromeClient.FileChooserParams?) -> Boolean,
    modifier: Modifier = Modifier
) {
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var isLoading by remember { mutableStateOf(true) }

  BackHandler(enabled = webViewInstance?.canGoBack() == true) {
    webViewInstance?.goBack()
  }

  Box(modifier = modifier.fillMaxSize().background(Color(0xFF0B0F19))) {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
          val assetLoader =
              WebViewAssetLoader.Builder()
                  .setDomain("localhost")
                  .addPathHandler(
                      "/",
                      WebViewAssetLoader.AssetsPathHandler(context)
                  )
                  .build()

          WebView(context).apply {
            layoutParams =
                ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

            setBackgroundColor(android.graphics.Color.parseColor("#0B0F19"))

            settings.apply {
              javaScriptEnabled = true
              domStorageEnabled = true
              databaseEnabled = true
              allowFileAccess = true
              allowContentAccess = true
              mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
              useWideViewPort = true
              loadWithOverviewMode = true
              cacheMode = WebSettings.LOAD_DEFAULT
              userAgentString = "${userAgentString} ResuMatchMobileApp/1.0"
            }

            webViewClient = object : WebViewClientCompat() {
              override fun shouldInterceptRequest(
                  view: WebView?,
                  request: WebResourceRequest?
              ): WebResourceResponse? {
                val uri = request?.url ?: return null
                if (uri.host == "localhost") {
                  val path = uri.path ?: "/"
                  val assetPath =
                      if (path == "/" || path.isEmpty()) "public/index.html"
                      else "public${path}"
                  try {
                    val mimeType = when {
                      assetPath.endsWith(".html") -> "text/html"
                      assetPath.endsWith(".js") -> "application/javascript"
                      assetPath.endsWith(".css") -> "text/css"
                      assetPath.endsWith(".svg") -> "image/svg+xml"
                      assetPath.endsWith(".json") -> "application/json"
                      assetPath.endsWith(".png") -> "image/png"
                      assetPath.endsWith(".webp") -> "image/webp"
                      assetPath.endsWith(".woff2") -> "font/woff2"
                      assetPath.endsWith(".woff") -> "font/woff"
                      assetPath.endsWith(".ttf") -> "font/ttf"
                      else -> "application/octet-stream"
                    }
                    val inputStream = context.assets.open(assetPath)
                    return WebResourceResponse(mimeType, "UTF-8", inputStream)
                  } catch (e: Exception) {
                    try {
                      val inputStream = context.assets.open("public/index.html")
                      return WebResourceResponse("text/html", "UTF-8", inputStream)
                    } catch (_: Exception) {
                      return assetLoader.shouldInterceptRequest(uri)
                    }
                  }
                }
                return super.shouldInterceptRequest(view, request)
              }

              override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                isLoading = true
              }

              override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                isLoading = false
              }

              override fun onReceivedError(
                  view: WebView,
                  request: WebResourceRequest,
                  error: WebResourceErrorCompat
              ) {
                super.onReceivedError(view, request, error)
                Log.e("ResuMatchWebView", "WebView load error: ${error.description} for ${request.url}")
              }
            }

            webChromeClient = object : WebChromeClient() {
              override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(
                    "ResuMatchWebConsole",
                    "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}"
                )
                return true
              }

              override fun onShowFileChooser(
                  webView: WebView?,
                  filePathCallback: ValueCallback<Array<Uri>>?,
                  fileChooserParams: FileChooserParams?
              ): Boolean {
                return if (filePathCallback != null) {
                  onShowFileChooser(filePathCallback, fileChooserParams)
                } else {
                  false
                }
              }
            }

            loadUrl("https://localhost/index.html")
            webViewInstance = this
          }
        },
        update = { webViewInstance = it }
    )

    if (isLoading) {
      Box(
          modifier = Modifier.fillMaxSize().background(Color(0xFF0B0F19)),
          contentAlignment = Alignment.Center
      ) {
        CircularProgressIndicator(color = Color(0xFF10B981))
      }
    }
  }
}
