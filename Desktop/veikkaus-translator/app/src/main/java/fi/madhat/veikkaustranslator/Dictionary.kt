package fi.madhat.veikkaustranslator

import android.content.Context
import org.json.JSONObject
import java.util.Locale

/**
 * Gestione del dizionario finlandese -> italiano.
 * Il file sorgente è app/src/main/assets/dictionary.json:
 * per aggiungere parole basta modificare quel file su GitHub e ricompilare.
 */
object Dictionary {

    fun load(context: Context): Map<String, String> {
        return try {
            val json = context.assets.open("dictionary.json")
                .bufferedReader(Charsets.UTF_8)
                .use { it.readText() }
            val obj = JSONObject(json)
            val map = HashMap<String, String>(obj.length() * 2)
            val keys = obj.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                map[normalize(k)] = obj.getString(k)
            }
            map
        } catch (_: Exception) {
            emptyMap()
        }
    }

    /** Conta le voci senza tenere la mappa in memoria (per la MainActivity) */
    fun count(context: Context): Int = load(context).size

    /**
     * Normalizzazione per il matching: trim, spazi multipli -> singolo, minuscolo.
     * Così "Kirjaudu  sisään " matcha la chiave "Kirjaudu sisään".
     */
    fun normalize(s: String): String =
        s.trim().replace(Regex("\\s+"), " ").lowercase(Locale.ROOT)

    /**
     * Decide se una stringa non tradotta vale la pena di essere raccolta.
     * Filtra: quote numeriche (2,15), orari, stringhe solo-simboli, testi enormi.
     */
    fun looksTranslatable(s: String): Boolean {
        if (s.length < 2 || s.length > 120) return false
        val letters = s.count { it.isLetter() }
        if (letters == 0) return false
        // Almeno un terzo del contenuto deve essere lettere
        // (esclude "2,15", "18:30", "1 X 2" ecc.)
        return letters * 3 >= s.length
    }
}
