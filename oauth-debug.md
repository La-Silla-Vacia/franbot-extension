# Debug OAuth2 - Lista de Verificación

## 🔍 Pasos para diagnosticar "Authorization page could not be loaded"

### 1. Verificar Client ID actual
- **Client ID en el código**: `571791803428-gbl2p0i1sab5jk1dd4g9fs2b7rj51nko.apps.googleusercontent.com`
- **¿Coincide con Google Cloud Console?**: [ ] Sí / [ ] No

### 2. Verificar ID de la extensión
- **Cargar extensión en Chrome**: `chrome://extensions/`
- **ID generado**: `_________________________`
- **¿Actualizado en Google Cloud Console?**: [ ] Sí / [ ] No

### 3. Verificar configuración en Google Cloud Console

#### Credenciales OAuth2:
- **Tipo de aplicación**: [ ] Aplicación de Chrome
- **ID de la aplicación**: `_________________________`
- **Estado**: [ ] Activo

#### Pantalla de consentimiento OAuth:
- **Tipo de usuario**: [ ] Externo
- **Estado**: [ ] En producción / [ ] En pruebas
- **Usuarios de prueba agregados**: [ ] Sí / [ ] No

#### APIs habilitadas:
- [ ] Google+ API
- [ ] People API (opcional)

### 4. Verificar scopes
- **Scopes en el código**:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- **¿Configurados en pantalla de consentimiento?**: [ ] Sí / [ ] No

### 5. Logs de debug
Cuando pruebes el login, revisa la consola del desarrollador para estos logs:
- `Redirect URI: chrome-extension://[ID]/`
- `Client ID: 571791803428-...`
- `Auth URL: https://accounts.google.com/oauth/authorize?...`

### 6. Errores comunes y soluciones

| Error | Causa probable | Solución |
|-------|----------------|----------|
| "Authorization page could not be loaded" | Client ID incorrecto | Verificar Client ID en Google Cloud Console |
| "Invalid redirect URI" | ID de extensión incorrecto | Actualizar ID en Google Cloud Console |
| "Access blocked" | Pantalla de consentimiento no configurada | Configurar pantalla de consentimiento |
| "Scope not authorized" | Scopes no habilitados | Agregar scopes en pantalla de consentimiento |

### 7. Pasos de verificación rápida

1. **Recargar la extensión** después de cualquier cambio
2. **Limpiar cache** de Chrome si es necesario
3. **Probar con usuario de prueba** si la app está en modo de pruebas
4. **Verificar que no hay bloqueadores de popup** activos

### 8. URLs importantes
- Google Cloud Console: https://console.cloud.google.com/
- Credenciales: https://console.cloud.google.com/apis/credentials
- Pantalla de consentimiento: https://console.cloud.google.com/apis/credentials/consent

---

## 📝 Notas adicionales
- El redirect URI se genera automáticamente: `chrome-extension://[EXTENSION_ID]/`
- No necesitas configurar redirect URIs manualmente en Google Cloud Console para extensiones de Chrome
- El Client ID debe ser exactamente el mismo en el código y en Google Cloud Console