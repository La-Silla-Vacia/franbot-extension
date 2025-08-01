// Background script para Franbot
console.log('Franbot background script iniciado');

// Configuración inicial cuando se instala la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log('Franbot instalado correctamente');
  
  // Crear menú contextual
  chrome.contextMenus.create({
    id: 'franbot-analyze',
    title: 'Analizar con Franbot',
    contexts: ['selection', 'page']
  });
});

// Manejar clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'franbot-analyze') {
    // Abrir el popup o realizar alguna acción
    chrome.action.openPopup();
  }
});

// Manejar mensajes del content script y popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeText') {
    // Aquí se podría integrar con una API de IA
    const response = {
      analysis: `Análisis del texto: "${request.text}". Este es un análisis simulado.`,
      suggestions: ['Sugerencia 1', 'Sugerencia 2', 'Sugerencia 3']
    };
    sendResponse(response);
  }
  
  if (request.action === 'saveData') {
    // Guardar datos en el almacenamiento local
    chrome.storage.local.set({ franbotData: request.data }, () => {
      sendResponse({ success: true });
    });
  }
  
  if (request.action === 'getAccessToken') {
    // Obtener el token de acceso desde el almacenamiento
    chrome.storage.local.get(['accessToken', 'tokenExpiry'], (result) => {
      const now = Date.now();
      
      if (!result.accessToken) {
        // Token no encontrado
        sendResponse({
          success: false,
          error: 'No hay token de acceso disponible. Por favor, inicia sesión en la extensión.'
        });
        return;
      }
      
      // Verificar si el token ha expirado
      if (result.tokenExpiry && now >= result.tokenExpiry) {
        sendResponse({
          success: false,
          error: 'El token de acceso ha expirado. Por favor, vuelve a iniciar sesión en la extensión.'
        });
        return;
      }
      
      // Verificar permisos del token
      fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${result.accessToken}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Token inválido');
          }
          return response.json();
        })
        .then(tokenInfo => {
          const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
          
          // Verificar que tenga los scopes necesarios para Google Docs
          const requiredScopes = [
            'https://www.googleapis.com/auth/documents.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
          ];
          
          const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
          
          if (!hasRequiredScopes) {
            console.warn('⚠️ Token sin permisos suficientes para Google Docs');
            sendResponse({
              success: false,
              error: 'El token no tiene permisos para acceder a Google Docs. Por favor, vuelve a iniciar sesión en la extensión para otorgar los permisos necesarios.',
              missingScopes: requiredScopes.filter(scope => !tokenScopes.includes(scope))
            });
          } else {
            sendResponse({
              success: true,
              accessToken: result.accessToken,
              tokenExpiry: result.tokenExpiry,
              tokenScopes: tokenScopes
            });
          }
        })
        .catch(error => {
          console.error('Error al verificar token:', error);
          sendResponse({
            success: false,
            error: 'Error al verificar el token. Por favor, vuelve a iniciar sesión en la extensión.'
          });
        });
    });
    return true; // Mantener el canal abierto para respuesta asíncrona
  }
  
  return true; // Mantener el canal de mensaje abierto para respuestas asíncronas
});