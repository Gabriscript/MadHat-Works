# Veikkaus Translator — Istruzioni di setup (una tantum)

App personale che traduce l'app Veikkaus dal finlandese all'italiano tramite overlay.
100% offline: nessun permesso Internet, nessun dato lascia il telefono.

---

## PARTE 1 — Creare il repository su GitHub (5 min)

1. Vai su **github.com** e fai login col tuo account personale
2. In alto a destra: **+** → **New repository**
3. Repository name: `veikkaus-translator`
4. Visibilità: **Public** (o Private, funziona uguale)
5. NON spuntare "Add a README" (il progetto ha già i suoi file)
6. Clicca **Create repository**

## PARTE 2 — Caricare i file del progetto (5 min)

1. Sul tuo PC, estrai lo zip `veikkaus-translator.zip` in una cartella
2. Nella pagina del repo appena creato, clicca il link **"uploading an existing file"**
3. Apri Esplora Risorse nella cartella estratta, seleziona TUTTO il contenuto
   (compresa la cartella nascosta `.github` — su Windows si vede normalmente)
4. Trascina tutto nell'area di upload di GitHub
5. Verifica che nell'elenco compaia anche `.github/workflows/build.yml`
   — se manca, il build automatico non parte
6. In basso: **Commit changes**

⚠️ NON caricare il file `SEGRETI-NON-CARICARE-SU-GITHUB.txt` — quello resta solo sul tuo PC.

## PARTE 3 — Inserire i 4 Secrets (5 min)

1. Nel repo: **Settings** (tab in alto) → menu laterale **Secrets and variables** → **Actions**
2. Clicca **New repository secret**
3. Apri il file `SEGRETI-NON-CARICARE-SU-GITHUB.txt` sul tuo PC
4. Crea i 4 secrets uno alla volta, copiando ESATTAMENTE Name e Value dal file:
   - `KEYSTORE_B64`
   - `KEYSTORE_PASSWORD`
   - `KEY_ALIAS`
   - `KEY_PASSWORD`

## PARTE 4 — Compilare l'APK (3 min di attesa)

1. Tab **Actions** del repo
2. Se GitHub chiede di abilitare i workflow, clicca **"I understand… enable them"**
3. A sinistra clicca **Build APK** → a destra bottone **Run workflow** → **Run workflow** (verde)
4. Aspetta ~3-5 minuti che il pallino diventi ✅ verde
5. Clicca sulla run completata → sezione **Artifacts** in basso → scarica **veikkaus-translator-apk**
6. È uno zip: estrailo, dentro c'è **app-release.apk**

## PARTE 5 — Installare sul OnePlus (5 min)

1. Trasferisci `app-release.apk` sul telefono (cavo USB, Google Drive, o email a te stesso)
2. Sul telefono, apri il file APK (dall'app File o dalle notifiche download)
3. Android chiederà di consentire l'installazione da questa fonte → **Consenti** → **Installa**
4. Apri l'app **Veikkaus Translator**
5. Tocca **"Apri impostazioni Accessibilità"** → trova **Veikkaus Translator**
   nell'elenco → attivalo → conferma l'avviso di sistema
6. Torna nell'app: deve dire **"✅ Servizio ATTIVO"**

### Passo anti-OnePlus (importante!)
OxygenOS chiude aggressivamente i servizi in background:
1. Impostazioni → **Batteria** → **Gestione batteria delle app** (o cerca "batteria" nelle impostazioni)
2. Trova **Veikkaus Translator** → imposta **"Senza restrizioni"** / **"Non ottimizzare"**

## PARTE 6 — Uso quotidiano

1. Apri Veikkaus normalmente: le parole nel dizionario appaiono tradotte in italiano
   (etichette scure sopra il testo originale)
2. Le parole finlandesi NON riconosciute vengono raccolte automaticamente
3. Ogni tanto: apri Veikkaus Translator → **"Copia elenco"** → incolla la lista
   nella chat con Claude → ricevi il JSON aggiornato

## PARTE 7 — Aggiornare il dizionario (2 min, da browser, anche da telefono)

1. Su GitHub apri `app/src/main/assets/dictionary.json`
2. Clicca l'icona **matita** (Edit this file)
3. Incolla il nuovo contenuto che ti ha dato Claude (o aggiungi righe a mano
   nel formato: `"Parola finlandese": "Traduzione italiana",`)
4. **Commit changes** → il build parte da solo
5. Dopo ~4 minuti: Actions → scarica il nuovo APK → installalo sopra quello esistente
   (stessa firma = si aggiorna senza disinstallare, impostazioni conservate)

---

## Risoluzione problemi

| Problema | Soluzione |
|---|---|
| Nessuna traduzione appare | Verifica "✅ Servizio ATTIVO" nell'app + switch "Traduzione attiva" acceso |
| Il servizio si spegne da solo | Rifai il passo anti-OnePlus (batteria senza restrizioni) |
| Etichette leggermente spostate | Dimmelo: si tara con un offset nel codice |
| Build fallita su GitHub (❌ rossa) | Apri la run, copia le righe rosse di errore, incollale a Claude |
| "Ultima app osservata" non mostra mai veikkaus | Il package name è diverso dal previsto: dimmi cosa mostra quel campo mentre Veikkaus è aperta |
