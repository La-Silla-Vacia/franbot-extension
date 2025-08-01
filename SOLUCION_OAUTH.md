# Solución al Error "Authorization page could not be loaded"

## 🎯 Problema Identificado

El error **"Authorization page could not be loaded"** en extensiones de Chrome ocurre principalmente por una configuración incorrecta en Google Cloud Console. Después de investigar la documentación oficial y casos exitosos, la solución requiere:

1. **Configurar el OAuth Client como "Web application"** (NO como "Chrome Extension")
2. **Usar el redirect URI específico**: `https://<extension-id>.chromiumapp.org/google`
3. **Usar `chrome.identity.getRedirectURL('google')`** para obtener el URI correcto

## ✅ Solución Implementada

### 1. Cambios en el código (authStore.js)
- ✅ Uso exclusivo de `chrome.identity.launchWebAuthFlow`
- ✅ Redirect URI correcto: `chrome.identity.getRedirectURL('google')`
- ✅ URL de autorización actualizada: `https://accounts.google.com/o/oauth2/v2/auth`
- ✅ Obtención dinámica del Extension ID real
- ✅ Debug mejorado con información específica

### 2. Configuración en Google Cloud Console

**IMPORTANTE**: Debes configurar tu OAuth Client como **"Web application"**, NO como "Chrome Extension".

#### Pasos para configurar correctamente:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs y servicios > Credenciales**
4. **Edita tu ID de cliente OAuth 2.0** o crea uno nuevo
5. **Tipo de aplicación**: Selecciona **"Aplicación web"**
6. En **"URIs de redirección autorizados"**, agrega:
   ```
   https://<EXTENSION-ID-REAL>.chromiumapp.org/google
   ```

#### ⚠️ Cómo obtener el Extension ID correcto:

1. Recarga la extensión en `chrome://extensions/`
2. Haz clic en **"Debug OAuth"** en la extensión
3. Abre la consola del desarrollador (F12)
4. Busca la línea que dice: **"Redirect URI esperado en Google Cloud Console"**
5. Copia exactamente esa URL y úsala en Google Cloud Console

### 3. Verificación de APIs habilitadas

Asegúrate de que estas APIs estén habilitadas en tu proyecto:
- **Google+ API** (para información de perfil)
- **People API** (alternativa moderna)

## 🚀 Pasos Inmediatos

1. **Recarga la extensión** en `chrome://extensions/`
2. **Haz clic en "Debug OAuth"** para obtener el Extension ID correcto
3. **Ve a Google Cloud Console** y actualiza las credenciales:
   - Tipo: **"Aplicación web"**
   - Redirect URI: El que aparece en el debug (formato: `https://xxx.chromiumapp.org/google`)
4. **Espera 5-10 minutos** para que los cambios se propaguen
5. **Prueba el login normal**

## 🚨 Errores Comunes y Soluciones

### Error: "Authorization page could not be loaded"
- **Causa**: Extension ID incorrecto en Google Cloud Console
- **Solución**: Usar el Extension ID real obtenido con Debug OAuth

### Error: "Custom URI scheme is not supported"
- **Causa**: Configuración `oauth2` en manifest.json
- **Solución**: ✅ **YA SOLUCIONADO** - Removida configuración oauth2

### Error: "redirect_uri_mismatch"
- **Causa**: Tipo de aplicación incorrecto en Google Cloud Console
- **Solución**: Cambiar a **"Aplicación web"** y usar el redirect URI correcto

### Error: "invalid_client"
- **Causa**: Client ID incorrecto o no configurado
- **Solución**: Verificar que el Client ID en el código coincida con Google Cloud Console

## 📋 Archivos Modificados

1. **`src/store/authStore.js`**: 
   - Uso de `chrome.identity.getRedirectURL('google')`
   - URL de autorización actualizada
   - Debug mejorado

2. **`manifest.json`**: 
   - ✅ Sin configuración `oauth2` (removida)
   - ✅ Permisos `identity` mantenidos

## 🔍 Debug y Verificación

La función `debugOAuth()` ahora proporciona:
- Extension ID real y dinámico
- Redirect URI correcto para Google Cloud Console
- URL de autorización construida
- Información detallada de errores

## 📚 Referencias

Basado en la documentación oficial de Google y casos exitosos de la comunidad:
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- Casos exitosos en Stack Overflow con configuración "Web application"

---

**Nota importante**: El Extension ID cambia en modo desarrollador. Siempre usa el Debug OAuth para obtener el ID correcto antes de configurar Google Cloud Console.