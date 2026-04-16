# Debug SAM - Perché funziona solo su un browser?

## Test da fare nel Browser (F12 Developer Console)

### 1. Controlla i Cookie
```javascript
// Nel tuo browser funzionante
console.log('Cookies:', document.cookie);
```

### 2. Controlla localStorage
```javascript
// Nel tuo browser funzionante
console.log('localStorage:', JSON.stringify(localStorage));
```

### 3. Controlla sessionStorage
```javascript
// Nel tuo browser funzionante
console.log('sessionStorage:', JSON.stringify(sessionStorage));
```

### 4. Controlla le richieste SAM nella Network Tab
1. Apri Network tab (F12)
2. Filtra per "interactive-annotating"
3. Fai un'annotazione SAM
4. Guarda la richiesta:
   - **Request Headers**: Cerca "Authorization" o "Cookie"
   - **Response**: Guarda se c'è un errore CORS o 401/403

### 5. Controlla configurazione ML Backend
```javascript
// Nella console, se c'è accesso a window.Htx
if (window.Htx && window.Htx.annotationStore) {
  const store = window.Htx.annotationStore;
  console.log('Project ML backends:', store.project);
}
```

## Possibili Cause

### A. CORS + Credentials
Il backend ML potrebbe richiedere credenziali (cookies) che:
- Vengono inviate dal tuo browser normale
- NON vengono inviate in modalità incognito
- NON vengono inviate da altri browser

**Fix**: Controllare la configurazione CORS del backend ML (192.168.2.136)

### B. Cookie di Sessione
Il server SAM potrebbe:
- Richiedere un cookie di sessione specifico
- Il tuo browser ha questo cookie
- Altri browser no

**Fix**: Implementare autenticazione corretta nel backend ML

### C. Token nel localStorage
Anche se non ho trovato token SAM nel codice, potrebbe essere:
- Salvato da qualche script personalizzato
- Aggiunto manualmente per testing

**Fix**: Controllare localStorage e trovare il token

## Cosa controllare sul Backend

### 1. Label Studio - CORS Settings
File: `label_studio/core/settings/label_studio.py`

Cerca:
```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [...]
```

### 2. SAM Server (192.168.2.136) - CORS Settings
Il server SAM deve permettere richieste cross-origin da Label Studio.

### 3. ML Backend Auth
Controlla se il backend ML è configurato con autenticazione:
```sql
-- Nel database Label Studio
SELECT id, title, url, auth_method, is_interactive
FROM ml_mlbackend
WHERE is_interactive = 1;
```

## Come Riprodurre per Tutti

1. **Disabilita CORS check** (temporaneo per testing):
   - Chrome: Lancia con `--disable-web-security --user-data-dir=/tmp/chrome`
   - Firefox: about:config → `security.fileuri.strict_origin_policy` = false

2. **Configura correttamente CORS sul server SAM**:
   ```python
   # Nel server SAM
   from flask import Flask
   from flask_cors import CORS

   app = Flask(__name__)
   CORS(app, supports_credentials=True, origins=['http://192.168.2.37:8080'])
   ```

3. **Verifica autenticazione ML Backend**:
   - Se usa Basic Auth, tutti devono avere le stesse credenziali
   - Se usa Token, il token deve essere configurato nel backend, non nel browser
