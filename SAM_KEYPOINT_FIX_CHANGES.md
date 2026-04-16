# SAM KeyPoint Duplicazione - Modifiche Applicate

**Data**: 8 Gennaio 2026
**Issue**: Duplicazione annotazioni quando si usa SAM con KeyPoint tool

## Sommario del Problema

Quando si crea un'annotazione tramite SAM/Magic KeyPoint:
1. Il keypoint viene creato e marcato come `dynamic: true`
2. SAM restituisce una brush suggestion che include ANCHE il result del keypoint originale
3. La brush risulta con 2 results (brushlabels + keypointlabels) invece di 1
4. Nel pannello UI appaiono 2 annotazioni invece di 1

---

## File Modificati

### 1. `web/libs/editor/src/tools/KeyPoint.js`

**Scopo**: Fix principale - Marcare il keypoint come `dynamic` quando SAM è attivo

**Modifica** (Riga ~49):
```javascript
// PRIMA (BUG):
dynamic: self.dynamic

// DOPO (FIX):
const isDynamic = self.dynamic || c.smartEnabled;
// ...
dynamic: isDynamic,
negative: isDynamic && ev.altKey,
```

**Tipo**: ✅ **FIX PERMANENTE** - Da mantenere

**Spiegazione**: Quando SAM è attivo (`c.smartEnabled`), il keypoint deve essere marcato come `dynamic: true` per essere eliminato automaticamente dopo che la suggestion brush viene accettata.

---

### 2. `web/libs/editor/src/stores/Annotation/Annotation.js`

#### Modifica 2.1: Fix Ordine Operazioni in `acceptSuggestion()`

**Scopo**: Prevenire rendering duplicato rimuovendo la suggestion prima di aggiungerla ad areas

**Modifica** (Riga ~1511-1570):
```javascript
// PRIMA (BUG):
self.areas.set(itemId, itemData);  // Prima aggiunge ad areas
self.suggestions.delete(id);        // Poi rimuove da suggestions
// → Momento con duplicato: region esiste in entrambe le liste

// DOPO (FIX):
const itemData = { ...itemJSON, id: itemId, fromSuggestion: true };
self.suggestions.delete(id);        // Prima rimuove da suggestions
self.areas.set(itemId, itemData);   // Poi aggiunge ad areas
// → Nessun momento con duplicato
```

**Tipo**: ✅ **FIX PERMANENTE** - Da mantenere

---

#### Modifica 2.2: Filtrare keypointlabels dalla Suggestion

**Scopo**: Rimuovere i results di tipo `keypointlabels` dalla suggestion brush prima di accettarla

**Modifica** (Riga ~1515-1545):
```javascript
const itemJSON = item.toJSON();

// CRITICAL FIX: Filter out keypointlabels results
if (itemJSON.results && Array.isArray(itemJSON.results)) {
  const originalResultsCount = itemJSON.results.length;
  itemJSON.results = itemJSON.results.filter(r => {
    const shouldKeep = r.type !== 'keypointlabels';
    console.log('[Annotation] acceptSuggestion - Filtering result:', {
      id: r.id,
      type: r.type,
      shouldKeep
    });
    return shouldKeep;
  });

  console.log('[Annotation] acceptSuggestion - After filtering:', {
    originalCount: originalResultsCount,
    filteredCount: itemJSON.results.length,
    removedCount: originalResultsCount - itemJSON.results.length
  });
}

const itemData = { ...itemJSON, id: itemId, fromSuggestion: true };
```

**Tipo**: ⚠️ **FIX PARZIALE** - Da mantenere ma rimuovere i console.log quando funziona

**Note**: Questo fix filtra i keypointlabels PRIMA che la brush venga aggiunta alle areas. I console.log possono essere rimossi dopo la verifica.

---

#### Modifica 2.3: Pulizia Results Orfani in `deleteAllDynamicregions()`

**Scopo**: Rimuovere i results del keypoint dalle regions rimanenti dopo la sua eliminazione

**Modifica** (Riga ~1395-1475):
```javascript
deleteAllDynamicregions(silent = false) {
  const regionsToDelete = [];
  const resultsToClean = new Set(); // Track result IDs from dynamic regions

  // Collect results IDs from dynamic regions
  self.regions.forEach((r) => {
    if (r.dynamic) {
      regionsToDelete.push(r);
      if (r.results) {
        r.results.forEach((result) => {
          if (result.id) {
            resultsToClean.add(result.id);
            console.log('[Annotation] Will clean result:', result.id, 'type:', result.type);
          }
        });
      }
    }
  });

  // Delete dynamic regions
  regionsToDelete.forEach((r) => {
    try {
      self.unselectAll(true);
      self.relationStore.deleteNodeRelation(r);
      destroy(r);
    } catch (e) {
      console.error('[Annotation] Error destroying region:', r.id, e);
    }
  });

  // Clean orphaned results from remaining regions
  if (resultsToClean.size > 0) {
    console.log('[Annotation] Cleaning orphaned results from remaining regions...');
    console.log('[Annotation] Result IDs to clean:', Array.from(resultsToClean));

    self.regions.forEach((r) => {
      console.log('[Annotation] Checking region for cleanup:', {
        id: r.id,
        type: r.type,
        resultsLength: r.results?.length,
        resultIds: r.results?.map(res => res.id)
      });

      if (r.results && r.results.length > 0) {
        const originalResultsCount = r.results.length;
        const filteredResults = r.results.filter((result) => {
          const shouldRemove = resultsToClean.has(result.id);
          if (shouldRemove) {
            console.log('[Annotation] Found result to remove:', {
              resultId: result.id,
              resultType: result.type,
              fromRegion: r.id
            });
          }
          return !shouldRemove;
        });

        if (filteredResults.length < originalResultsCount) {
          console.log('[Annotation] Cleaning region:', r.id, 'from', originalResultsCount, 'to', filteredResults.length, 'results');
          r.results.replace(filteredResults);
        } else {
          console.log('[Annotation] No results to clean from region:', r.id);
        }
      }
    });
  }
}
```

**Tipo**: ⚠️ **FIX SPERIMENTALE** - Da testare, rimuovere tutti i console.log dopo verifica

**Note**: Questo fix tenta di rimuovere i results orfani dopo l'eliminazione del keypoint. Potrebbe non funzionare se i results vengono aggiunti DOPO questo step.

---

#### Modifica 2.4: Logging Debug Vari

**Aggiunti in vari punti per debugging**:

- `createResult()` - Riga ~944-995: Logging creazione regions con stack trace
- `setSuggestions()` - Riga ~1131-1161: Logging deserializzazione suggestions
- `acceptAllSuggestions()` - Riga ~1378-1384: Logging accettazione suggestions
- `acceptSuggestion()` - Riga ~1455-1570: Logging dettagliato di tutto il processo
- `deleteAllDynamicregions()` - Varie righe: Logging eliminazione e pulizia

**Tipo**: 🗑️ **DEBUG TEMPORANEO** - Da rimuovere completamente dopo il fix

---

### 3. `web/libs/editor/src/components/ImageView/ImageView.jsx`

**Scopo**: Logging per debugging rendering

**Modifica** (Riga ~1320-1328):
```javascript
console.log('[StageContent] Rendering breakdown:', {
  regions: regions.length,
  suggestions: item.suggestions?.length || 0,
  brushRegions: brushRegions.length,
  shapeRegions: shapeRegions.length,
  suggestedBrushRegions: suggestedBrushRegions.length,
  suggestedShapeRegions: suggestedShapeRegions.length,
  allSuggestions: item.suggestions?.map(s => ({ id: s.id, type: s.type }))
});
```

**Tipo**: 🗑️ **DEBUG TEMPORANEO** - Da rimuovere completamente dopo il fix

---

## Piano di Pulizia

### Step 1: Verificare il Fix
1. Testare il flusso SAM KeyPoint
2. Verificare che la brush finale ha solo 1 result (brushlabels)
3. Verificare che non ci sono duplicati nel pannello UI

### Step 2: Pulizia Logging Debug (se fix funziona)

**File da pulire**:

1. `Annotation.js`:
   - Rimuovere TUTTI i `console.log` aggiunti nelle funzioni:
     - `createResult()`
     - `setSuggestions()`
     - `acceptAllSuggestions()`
     - `acceptSuggestion()` (mantenere solo la logica di filtro)
     - `deleteAllDynamicregions()` (mantenere solo la logica di pulizia)

2. `ImageView.jsx`:
   - Rimuovere il `console.log` in `StageContent` (riga ~1320-1328)

3. `KeyPoint.js`:
   - Rimuovere il `console.log` di creazione keypoint (riga ~49-50, 70)

### Step 3: Testing Finale
Dopo la pulizia, testare di nuovo per assicurarsi che tutto funzioni senza i log.

---

## Fix Finali da Mantenere (Sintesi)

1. ✅ `KeyPoint.js`: `const isDynamic = self.dynamic || c.smartEnabled;`
2. ✅ `Annotation.js`: Invertire ordine `suggestions.delete()` prima di `areas.set()`
3. ⚠️ `Annotation.js`: Filtrare `keypointlabels` dalla suggestion (se necessario)
4. ⚠️ `Annotation.js`: Pulire results orfani in `deleteAllDynamicregions()` (se necessario)

**Note**: I fix 3 e 4 potrebbero essere ridondanti se il problema viene risolto a monte. Da valutare in base ai test.

---

## Problemi Aperti

### ❌ Problema Principale CONFERMATO (8 Gen 2026 - 17:00)

**Sintomo**: La brush finale ha 2 results invece di 1:
```javascript
// Brush finale (7c63#0YpLQ):
{
  results: [
    { id: 'tag@7c63#0YpLQ', type: 'brushlabels', from_name: 'tag' },      // ✅ CORRETTO
    { id: 'MYWvimoYvV', type: 'keypointlabels', from_name: 'tag2' }        // ❌ SBAGLIATO!
  ]
}
```

**Scoperte Cruciali**:

1. ✅ **La suggestion SAM è corretta**: Ha solo 1 result (brushlabels), NON contiene keypointlabels
   - Log: `resultsCount: 1, removedCount: 0` durante il filtro
   - Quindi il fix 2.2 (filtrare keypointlabels dalla suggestion) è ridondante ma innocuo

2. ✅ **Il keypoint originale viene eliminato correttamente**
   - Log: `Will clean result: UjnBW1ITkT type: keypointlabels`
   - Region count finale: 2 (rectangle + brush), il keypoint è stato distrutto

3. ❌ **La brush NON ha il keypointlabels al momento della pulizia**
   - Log: `No results to clean from region: 7c63#0YpLQ`
   - La brush ha solo il brushlabels result quando viene controllata

4. 🔥 **IL PROBLEMA: Un NUOVO keypointlabels result viene CREATO DOPO**
   - Result originale del keypoint: `UjnBW1ITkT`
   - Result sulla brush finale: `MYWvimoYvV` ← **ID DIVERSO!**
   - Questo conferma che è un nuovo result, non quello del keypoint

### 🎯 Root Cause Identificato

**QUANDO**: Il nuovo result viene creato DOPO `deleteAllDynamicregions()`, probabilmente durante:
- Il tool switching automatico (KeyPointTool → BrushTool)
- La ri-selezione delle labels sulla region
- Il syncing del `CustomLabelingMenu` con le selected labels

**DOVE**: Probabile colpevole in `Image.js` righe 877-890:
```javascript
// Dopo il tool switch, riseleziona le labels
selectedLabels.forEach(label => {
  const labelControlType = label?.parent?.type;

  if (labelControlType === currentControlType && label.setSelected && !label.selected) {
    label.setSelected(true);  // ← QUESTO potrebbe creare il result!
  }
});
```

**PERCHÉ**: Il control tag `tag2` (keypointlabels) sta creando un result sulla brush anche se:
- La brush è di tipo `brushregion`
- Dovrebbe accettare solo `brushlabels`, non `keypointlabels`
- C'è un check `labelControlType === currentControlType` ma potrebbe non funzionare

### 📋 Prossimi Step per Domani

1. **Trovare dove viene creato il result `MYWvimoYvV`**
   - Aggiungere logging in `label.setSelected()` per vedere se è il colpevole
   - Controllare `CustomLabelingMenu` per vedere se crea results quando synca le labels
   - Verificare se `region.setValue()` o `region.labeling.setSelectedValues()` crea results

2. **Bloccare la creazione di results incompatibili**
   - Una `brushregion` NON dovrebbe accettare `keypointlabels` results
   - Aggiungere validazione: solo results del tipo corretto possono essere aggiunti
   - Possibile fix: Controllare il `control.resultType` vs `region.type` prima di creare result

3. **File da investigare domani**:
   - `web/libs/editor/src/tags/control/Label.jsx` - Metodo `setSelected()`
   - `web/libs/editor/src/components/CustomLabelingMenu.jsx` - Sync labels con region
   - `web/libs/editor/src/regions/Area.js` - Metodi `setValue()`, `addResult()`
   - `web/libs/editor/src/mixins/AreaMixin.js` - Validazione control tags vs region type

4. **Test da fare**:
   ```javascript
   // Dopo l'annotazione, verificare quale control tag ha creato il result extra
   const ann = window.Htx.annotationStore.selected;
   const brush = ann.regions.find(r => r.type === 'brushregion');

   brush.results.forEach(r => {
     console.log('Result:', r.id, 'Type:', r.type);
     console.log('From control:', r.from_name.name, 'Type:', r.from_name.type);
     console.log('Compatible?', r.from_name.type === 'brushlabels');
   });
   ```

### 💡 Possibile Soluzione Finale

**Opzione A - Preventiva**: Bloccare la creazione del result alla fonte
- Quando `label.setSelected(true)` viene chiamato
- Verificare se la region attiva è compatibile con il control tag della label
- Non creare il result se incompatibile

**Opzione B - Reattiva**: Pulire i results incompatibili dopo la creazione
- Dopo `deleteAllDynamicregions()`, aggiungere un secondo cleanup
- Rimuovere TUTTI i results di tipo `keypointlabels` da regions di tipo `brushregion`
- Generalizzare: rimuovere results non compatibili con il tipo di region

**Opzione C - Architetturale**: Fix nel sistema di labeling
- Modificare il sistema per cui solo i control tags compatibili con la region possono creare results
- Implementare validazione stretta tra `control.resultType` e `region.type`

---

## Comandi per Testing

```javascript
// Dopo l'annotazione SAM, verificare lo stato:
const ann = window.Htx.annotationStore.selected;
const region = ann.regions[0];
console.log('Final region state:', {
  id: region.id,
  type: region.type,
  resultsCount: region.results?.length,
  results: region.results?.map(r => ({
    id: r.id,
    from_name: r.from_name.name,
    type: r.type
  }))
});

// Dovrebbe mostrare:
// resultsCount: 1
// results: [{ type: 'brushlabels' }]  ← Solo questo, NON keypointlabels!
```

---

## 📊 Stato Attuale (8 Gen 2026 - 17:00)

### ✅ Fix Completati e Funzionanti
1. **KeyPoint dynamic flag** - Il keypoint viene correttamente marcato come dynamic quando SAM è attivo
2. **Eliminazione keypoint** - Il keypoint dynamic viene correttamente eliminato dopo l'accettazione della suggestion
3. **Ordine operazioni** - Le suggestions vengono rimosse prima di essere aggiunte ad areas (previene ghost rendering)

### ⚠️ Fix Applicati ma Ridondanti
1. **Filtro keypointlabels dalla suggestion** - La suggestion SAM è già corretta, non contiene keypointlabels
2. **Pulizia results orfani** - Non trova nulla da pulire perché il nuovo result viene creato DOPO

### ❌ Problema Ancora Aperto
**Un nuovo keypointlabels result viene creato DOPO `deleteAllDynamicregions()`** sulla brush, causando la duplicazione nel pannello UI.

### 🎯 Prossima Sessione
**Focus**: Trovare e bloccare la creazione del result incompatibile `MYWvimoYvV` (keypointlabels su brushregion)

**Files da controllare**:
- `Label.jsx` → `setSelected()` method
- `CustomLabelingMenu.jsx` → label syncing logic
- `Area.js` / `AreaMixin.js` → result validation

**Approccio raccomandato**: **Opzione B (Reattiva)** - Aggiungere un cleanup finale dopo `deleteAllDynamicregions()` che rimuove TUTTI i results incompatibili con il tipo di region.

```javascript
// Pseudo-codice per il fix finale
deleteAllDynamicregions(silent = false) {
  // ... codice esistente ...

  // NUOVO: Cleanup finale per results incompatibili
  self.regions.forEach((r) => {
    if (r.results && r.results.length > 0) {
      const compatibleResults = r.results.filter((result) => {
        // Una brushregion dovrebbe avere solo brushlabels
        if (r.type === 'brushregion' && result.type !== 'brushlabels') {
          console.log('[Annotation] Removing incompatible result:', result.type, 'from', r.type);
          return false;
        }
        // Generalizzare per altri tipi...
        return true;
      });

      if (compatibleResults.length < r.results.length) {
        r.results.replace(compatibleResults);
      }
    }
  });
}
```

---

**Ultimo aggiornamento**: 8 Gennaio 2026 - 17:00 - Root cause identificato, fix finale da implementare domani.
