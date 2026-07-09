package fi.madhat.veikkaustranslator

import android.accessibilityservice.AccessibilityService
import android.graphics.PixelFormat
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Servizio di accessibilità che:
 * 1. Riceve eventi quando il contenuto a schermo cambia (scroll, cambio pagina, ecc.)
 * 2. Se l'app in primo piano è Veikkaus, legge l'albero dei nodi UI
 * 3. Per ogni nodo di testo che matcha il dizionario, disegna un'etichetta overlay
 *    con la traduzione italiana ESATTAMENTE sopra il testo finlandese originale
 * 4. Le stringhe NON trovate nel dizionario vengono raccolte (UnmatchedStore)
 *    così l'utente può copiarle e farle tradurre per ampliare il dizionario
 */
class TranslatorService : AccessibilityService() {

    private var windowManager: WindowManager? = null
    private var overlay: FrameLayout? = null
    private val handler = Handler(Looper.getMainLooper())
    private val rescanRunnable = Runnable { rescan() }
    private var dictionary: Map<String, String> = emptyMap()

    // Limiti di sicurezza per non rallentare il telefono su schermate enormi
    private val maxDepth = 45
    private val maxMatches = 250

    override fun onServiceConnected() {
        super.onServiceConnected()
        dictionary = Dictionary.load(this)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        addOverlayWindow()
    }

    private fun addOverlayWindow() {
        if (overlay != null) return
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            // TYPE_ACCESSIBILITY_OVERLAY: riservato ai servizi di accessibilità,
            // NON richiede il permesso "disegna sopra altre app"
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            params.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        val container = FrameLayout(this)
        try {
            windowManager?.addView(container, params)
            overlay = container
        } catch (_: Exception) {
            overlay = null
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: return

        // Salviamo l'ultimo package visto (utile per debug nella MainActivity)
        if (pkg != packageName && !pkg.startsWith("com.android")) {
            Prefs.setLastPackage(this, pkg)
        }

        if (!pkg.contains("veikkaus", ignoreCase = true)) {
            // Siamo usciti da Veikkaus: pulisci l'overlay
            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                clearOverlay()
            }
            return
        }

        // Debounce: aspetta 200ms di calma prima di ri-scansionare,
        // altrimenti durante lo scroll faremmo 50 scansioni al secondo
        handler.removeCallbacks(rescanRunnable)
        handler.postDelayed(rescanRunnable, 200)
    }

    private fun rescan() {
        if (!Prefs.isEnabled(this)) {
            clearOverlay()
            return
        }
        val root = rootInActiveWindow ?: return
        val rootPkg = root.packageName?.toString() ?: ""
        if (!rootPkg.contains("veikkaus", ignoreCase = true)) {
            clearOverlay()
            return
        }

        val matches = ArrayList<Match>()
        val unmatched = HashSet<String>()
        walk(root, matches, unmatched, 0)

        if (unmatched.isNotEmpty()) {
            UnmatchedStore.addAll(this, unmatched)
        }
        render(matches)
    }

    private fun walk(
        node: AccessibilityNodeInfo?,
        out: MutableList<Match>,
        unmatched: MutableSet<String>,
        depth: Int
    ) {
        if (node == null || depth > maxDepth || out.size >= maxMatches) return

        if (node.isVisibleToUser) {
            val raw = node.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
                ?: node.contentDescription?.toString()?.trim()?.takeIf { it.isNotEmpty() }

            if (raw != null) {
                val translation = dictionary[Dictionary.normalize(raw)]
                if (translation != null) {
                    val bounds = Rect()
                    node.getBoundsInScreen(bounds)
                    if (bounds.width() > 8 && bounds.height() > 8) {
                        out.add(Match(bounds, translation))
                    }
                } else if (Dictionary.looksTranslatable(raw)) {
                    unmatched.add(raw)
                }
            }
        }

        for (i in 0 until node.childCount) {
            walk(node.getChild(i), out, unmatched, depth + 1)
        }
    }

    private fun render(matches: List<Match>) {
        val container = overlay ?: return
        handler.post {
            container.removeAllViews()
            for (m in matches) {
                val tv = TextView(this).apply {
                    text = m.translation
                    setTextColor(0xFFFFFFFF.toInt())
                    setBackgroundResource(R.drawable.overlay_bg)
                    gravity = Gravity.CENTER
                    maxLines = 3
                    setPadding(6, 2, 6, 2)
                    // Il testo si rimpicciolisce da solo per stare nel box originale
                    setAutoSizeTextTypeUniformWithConfiguration(
                        8, 15, 1, TypedValue.COMPLEX_UNIT_SP
                    )
                }
                val lp = FrameLayout.LayoutParams(m.bounds.width(), m.bounds.height())
                lp.leftMargin = m.bounds.left
                lp.topMargin = m.bounds.top
                container.addView(tv, lp)
            }
        }
    }

    private fun clearOverlay() {
        handler.post { overlay?.removeAllViews() }
    }

    override fun onInterrupt() {
        clearOverlay()
    }

    override fun onDestroy() {
        handler.removeCallbacks(rescanRunnable)
        try {
            overlay?.let { windowManager?.removeView(it) }
        } catch (_: Exception) {
        }
        overlay = null
        super.onDestroy()
    }

    private data class Match(val bounds: Rect, val translation: String)
}
