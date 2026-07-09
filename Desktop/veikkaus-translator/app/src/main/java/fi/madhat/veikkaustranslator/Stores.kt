package fi.madhat.veikkaustranslator

import android.content.Context

/**
 * Raccoglie le stringhe finlandesi viste a schermo ma NON presenti nel dizionario.
 * L'utente le copia dalla MainActivity, le manda a Claude, riceve le traduzioni,
 * aggiorna dictionary.json su GitHub -> nuova APK con dizionario ampliato.
 */
object UnmatchedStore {
    private const val PREF = "unmatched"
    private const val KEY = "list"
    private const val CAP = 800

    fun addAll(context: Context, items: Set<String>) {
        if (items.isEmpty()) return
        val sp = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
        val current = HashSet(sp.getStringSet(KEY, emptySet()) ?: emptySet())
        var changed = false
        for (item in items) {
            if (current.size >= CAP) break
            if (current.add(item)) changed = true
        }
        if (changed) sp.edit().putStringSet(KEY, current).apply()
    }

    fun getAll(context: Context): List<String> {
        val sp = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
        return (sp.getStringSet(KEY, emptySet()) ?: emptySet()).sorted()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .edit().remove(KEY).apply()
    }
}

/** Preferenze semplici dell'app */
object Prefs {
    private const val PREF = "prefs"

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .getBoolean("enabled", true)

    fun setEnabled(context: Context, value: Boolean) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .edit().putBoolean("enabled", value).apply()
    }

    fun lastPackage(context: Context): String =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .getString("last_pkg", "-") ?: "-"

    fun setLastPackage(context: Context, pkg: String) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .edit().putString("last_pkg", pkg).apply()
    }
}
