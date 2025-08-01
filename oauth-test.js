// Script de prueba OAuth2 para Franbot Extension
// Ejecutar en la consola del desarrollador de la extensión

console.log('🔍 Iniciando diagnóstico OAuth2...');

// Verificar contexto de extensión
if (typeof chrome !== 'undefined' && chrome.identity) {
  console.log('✅ Contexto de extensión Chrome detectado');
  
  // Mostrar redirect URI
  const redirectUri = chrome.identity.getRedirectURL();
  console.log('📍 Redirect URI:', redirectUri);
  
  // Extraer ID de la extensión
  const extensionId = redirectUri.split('://')[1].split('/')[0];
  console.log('🆔 ID de la extensión:', extensionId);
  
  // Configuración actual
  const clientId = '571791803428-gbl2p0i1sab5jk1dd4g9fs2b7rj51nko.apps.googleusercontent.com';
  const scopes = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
  
  console.log('🔑 Client ID:', clientId);
  console.log('📋 Scopes:', scopes);
  
  // Construir URL de autorización
  const authUrl = 'https://accounts.google.com/oauth/authorize?' + 
    new URLSearchParams({
      client_id: clientId,
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      include_granted_scopes: 'true',
      state: 'franbot_test_' + Date.now()
    }).toString();
  
  console.log('🌐 URL de autorización:', authUrl);
  
  // Verificar si la URL es accesible
  console.log('🧪 Probando accesibilidad de la URL...');
  fetch(authUrl, { method: 'HEAD', mode: 'no-cors' })
    .then(() => console.log('✅ URL de autorización accesible'))
    .catch(error => console.log('❌ Error al acceder a URL:', error));
  
  console.log('📝 Pasos siguientes:');
  console.log('1. Copia el ID de la extensión:', extensionId);
  console.log('2. Ve a Google Cloud Console');
  console.log('3. Actualiza las credenciales OAuth2 con este ID');
  console.log('4. Asegúrate de que el tipo sea "Aplicación de Chrome"');
  console.log('5. Recarga la extensión y prueba el login');
  
} else {
  console.log('❌ No se detectó contexto de extensión Chrome');
  console.log('Este script debe ejecutarse en la consola de la extensión');
}

console.log('🔍 Diagnóstico completado');