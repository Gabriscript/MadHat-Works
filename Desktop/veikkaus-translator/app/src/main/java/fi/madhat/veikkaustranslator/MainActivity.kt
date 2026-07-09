package fi.madhat.veikkaustranslator

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat

class MainActivity : AppCompatActivity() {

    private lateinit var tvStatus: TextView
    private lateinit var tvInfo: TextView
    private lateinit var tvUnmatched: TextView
    private lateinit var swEnabled: SwitchCompat

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        tvInfo = findViewById(R.id.tvInfo)
        tvUnmatched = findViewById(R.id.tvUnmatched)
        swEnabled = findViewById(R.id.swEnabled)

        findViewById<Button>(R.id.btnAccessibility).setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        swEnabled.isChecked = Prefs.isEnabled(this)
        swEnabled.setOnCheckedChangeListener { _, checked ->
            Prefs.setEnabled(this, checked)
        }

        findViewById<Button>(R.id.btnCopy).setOnClickListener {
            val list = UnmatchedStore.getAll(this)
            if (list.isEmpty()) {
                Toast.makeText(this, "Nessuna parola da copiare", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val cm = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(
                ClipData.newPlainText("veikkaus-unmatched", list.joinToString("\n"))
            )
            Toast.makeText(
                this,
                "Copiate ${list.size} parole. Incollale nella chat con Claude.",
                Toast.LENGTH_LONG
            ).show()
        }

        findViewById<Button>(R.id.btnClear).setOnClickListener {
            UnmatchedStore.clear(this)
            refresh()
            Toast.makeText(this, "Elenco svuotato", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        val serviceOn = isAccessibilityServiceEnabled()
        tvStatus.text = if (serviceOn) {
            "✅ Servizio ATTIVO"
        } else {
            "❌ Servizio NON attivo\nTocca il bottone qui sotto e attiva \"Veikkaus Translator\""
        }

        val dictCount = Dictionary.count(this)
        val unmatchedList = UnmatchedStore.getAll(this)
        tvInfo.text = buildString {
            append("Voci nel dizionario: ").append(dictCount).append('\n')
            append("Parole non ancora tradotte raccolte: ").append(unmatchedList.size).append('\n')
            append("Ultima app osservata: ").append(Prefs.lastPackage(this@MainActivity))
        }

        tvUnmatched.text = if (unmatchedList.isEmpty()) {
            "(vuoto — usa Veikkaus con il servizio attivo e le parole sconosciute compariranno qui)"
        } else {
            unmatchedList.joinToString("\n")
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val enabled = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabled.contains(packageName)
    }
}
