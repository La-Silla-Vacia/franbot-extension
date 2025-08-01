# Configuración de Google OAuth2 para Franbot Extension

Esta guía te ayudará a configurar Google OAuth2 para la extensión Franbot de Chrome.

## Pasos para configurar OAuth2

### 1. Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el ID del proyecto para referencia futura

### 2. Habilitar las APIs necesarias

1. En el menú lateral, ve a **APIs y servicios** > **Biblioteca**
2. Busca y habilita las siguientes APIs:
   - **Google+ API** (para información del perfil)
   - **People API** (alternativa moderna)

### 3. Configurar la pantalla de consentimiento OAuth

1. Ve a **APIs y servicios** > **Pantalla de consentimiento OAuth**
2. Selecciona **Externo** como tipo de usuario
3. Completa la información requerida:
   - **Nombre de la aplicación**: Franbot Extension
   - **Correo electrónico de soporte**: tu correo electrónico
   - **Dominio autorizado**: (opcional para desarrollo)
   - **Correo electrónico del desarrollador**: tu correo electrónico

### 4. Crear credenciales OAuth2

1. Ve a **APIs y servicios** > **Credenciales**
2. Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente OAuth 2.0**
3. Selecciona **Aplicación de Chrome** como tipo de aplicación
4. Ingresa un nombre para el cliente OAuth
5. En **ID de la aplicación**, ingresa el ID de tu extensión de Chrome

### 5. Obtener el ID de la extensión

Para obtener el ID real de tu extensión:

1. Carga la extensión en modo desarrollador en Chrome:
   - Ve a `chrome://extensions/`
   - Activa el "Modo de desarrollador"
   - Haz clic en "Cargar extensión sin empaquetar"
   - Selecciona la carpeta `build` de tu proyecto
2. Copia el ID de la extensión que aparece en la tarjeta de la extensión
3. Vuelve a Google Cloud Console y actualiza las credenciales con este ID real

### 6. Configurar la extensión

El código ya está configurado para usar `chrome.identity.launchWebAuthFlow` que es el método correcto para extensiones de Chrome. No necesitas agregar configuración OAuth2 en el manifest.json.

### 7. Configuración del Client ID

Actualiza el `clientId` en `src/store/authStore.js` con tu ID de cliente real:

```javascript
const clientId = 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com';
```

### 6. Obtener el Extension ID real

#### Para desarrollo local:
1. Ve a `chrome://extensions/`
2. Activa el **Developer mode**
3. Haz clic en **Load unpacked** y selecciona la carpeta `build/` de tu proyecto
4. Copia el **Extension ID** que aparece en la tarjeta de tu extensión

#### Para producción:
1. Empaqueta tu extensión en un archivo .zip
2. Sube la extensión al Chrome Web Store
3. El Extension ID será generado automáticamente

### 7. Actualizar las credenciales con el Extension ID real

1. Regresa a **Google Cloud Console** > **APIs & Services** > **Credentials**
2. Edita tu OAuth client ID
3. Reemplaza el placeholder con el **Extension ID real**
4. Guarda los cambios

### 8. Variables de entorno y configuración

Crea un archivo `.env.local` en la raíz del proyecto (opcional, para desarrollo):

```env
REACT_APP_GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
REACT_APP_GOOGLE_PROJECT_ID=tu_project_id_aqui
```

### 9. Configuración adicional para desarrollo

Si quieres probar la autenticación en desarrollo:

1. **Dominio autorizado**: En Google Cloud Console, ve a **OAuth consent screen** > **Authorized domains** y agrega `chrome-extension://` (aunque no es estrictamente necesario para extensiones)

2. **Test users**: Si tu app está en modo "Testing", agrega usuarios de prueba en **OAuth consent screen** > **Test users**

### 10. Verificar la configuración

Para verificar que todo está configurado correctamente:

1. Carga la extensión en Chrome
2. Abre el popup de la extensión
3. Haz clic en "Iniciar Sesión con Google"
4. Deberías ver la pantalla de consentimiento de Google
5. Después de autorizar, deberías ver tu información de usuario en la extensión

## Información importante

### Scopes utilizados:
- `openid`: Identificación básica del usuario
- `email`: Acceso al email del usuario
- `profile`: Acceso al nombre y foto de perfil

### URLs de las APIs utilizadas:
- **Token info**: `https://www.googleapis.com/oauth2/v1/tokeninfo`
- **User info**: `https://www.googleapis.com/oauth2/v2/userinfo`

### Limitaciones de desarrollo:
- En modo "Testing", solo los usuarios agregados como "Test users" pueden usar la autenticación
- Para uso público, necesitas solicitar verificación de Google (proceso que puede tomar varios días)

### Troubleshooting común:

1. **Error "redirect_uri_mismatch"**: Verifica que el Extension ID en Google Cloud Console coincida con el real
2. **Error "access_denied"**: Verifica que los scopes estén correctamente configurados
3. **Error "invalid_client"**: Verifica que el Client ID en manifest.json sea correcto

## Solución de problemas

### Error: "Authorization page could not be loaded"

Este error indica un problema con la configuración de las credenciales OAuth2. Sigue estos pasos para solucionarlo:

1. **Verifica el Client ID**:
   - Asegúrate de que el Client ID en `src/store/authStore.js` sea exactamente el mismo que aparece en Google Cloud Console
   - No debe tener espacios extra ni caracteres adicionales

2. **Configura correctamente las credenciales en Google Cloud Console**:
   - Ve a **APIs y servicios** > **Credenciales**
   - Edita tu ID de cliente OAuth 2.0
   - En **Tipo de aplicación**, debe estar configurado como **Aplicación de Chrome**
   - En **ID de la aplicación**, ingresa el ID real de tu extensión (no un placeholder)

3. **Obtén el ID real de la extensión**:
   ```
   1. Ve a chrome://extensions/
   2. Activa el "Modo de desarrollador"
   3. Carga la extensión desde la carpeta build/
   4. Copia el ID que aparece (formato: abcdefghijklmnopqrstuvwxyzabcdef)
   5. Actualiza este ID en Google Cloud Console
   ```

4. **Verifica los scopes**:
   - Los scopes deben estar habilitados en la pantalla de consentimiento OAuth
   - Scopes utilizados: `userinfo.email` y `userinfo.profile`

5. **Revisa la consola del desarrollador**:
   - Abre las herramientas de desarrollador en la extensión
   - Busca mensajes de error específicos en la consola
   - Los logs mostrarán la URL de autorización y el redirect URI

### Error: "Custom URI scheme is not supported on Chrome apps"

Este error ocurre cuando se intenta usar configuración OAuth2 incorrecta en el manifest.json. La solución es:

1. **NO** incluir el bloque `oauth2` en `manifest.json`
2. Usar `chrome.identity.launchWebAuthFlow` en lugar de `chrome.identity.getAuthToken`
3. Configurar las credenciales como "Aplicación de Chrome" en Google Cloud Console

### Error: "Invalid redirect URI"

1. Asegúrate de que el ID de la aplicación en Google Cloud Console coincida exactamente con el ID de tu extensión
2. El redirect URI se genera automáticamente con `chrome.identity.getRedirectURL()`

### Error: "Access blocked"

1. Verifica que la pantalla de consentimiento OAuth esté configurada correctamente
2. Asegúrate de que las APIs necesarias estén habilitadas
3. Verifica que los scopes solicitados estén permitidos

## Flujo de autenticación

La extensión usa el siguiente flujo:

1. El usuario hace clic en "Iniciar sesión"
2. Se abre una ventana de autorización de Google
3. El usuario autoriza la aplicación
4. Google redirige a la URL de la extensión con el token
5. La extensión extrae el token y obtiene la información del usuario
6. El estado se guarda en Zustand con persistencia

## Scopes utilizados

- `openid`: Identificación básica
- `email`: Acceso al correo electrónico
- `profile`: Acceso a información básica del perfil

## Seguridad

- Los tokens se almacenan localmente usando la API de storage de Chrome
- Los tokens se revocan correctamente al cerrar sesión
- No se almacenan credenciales sensibles en el código

## Próximos pasos

Una vez configurado OAuth2, podrás:

1. **Integrar APIs de IA**: Usar el token de autenticación para llamar a APIs como OpenAI, Anthropic, etc.
2. **Almacenamiento en la nube**: Sincronizar datos del usuario entre dispositivos
3. **Funciones premium**: Desbloquear características avanzadas para usuarios autenticados
4. **Analytics**: Rastrear uso de la extensión por usuario (respetando la privacidad)

## Archivos modificados

Los siguientes archivos han sido actualizados con la integración de OAuth2:

- `manifest.json`: Permisos y configuración OAuth2
- `src/store/authStore.js`: Store de Zustand para autenticación
- `src/store/appStore.js`: Store de Zustand para estado de la aplicación
- `src/App.js`: Componente principal con UI de autenticación
- `src/App.css`: Estilos para los elementos de autenticación
- `public/content.js`: Script de contenido con análisis avanzado de páginas

¡La extensión está lista para usar autenticación con Google OAuth2!