import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado de autenticación
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Función de debug para OAuth
      debugOAuth: async () => {
        try {
          console.log('🔍 === DIAGNÓSTICO OAUTH INICIADO ===');
          
          // Verificar contexto de extensión
          if (!chrome || !chrome.identity) {
            throw new Error('No se detectó contexto de extensión de Chrome');
          }
          
          // Configuración
          const clientId = '571791803428-h5qdt3rdtbk3g1p5ut2k8fvioh59h8qp.apps.googleusercontent.com';
          const redirectUri = chrome.identity.getRedirectURL('google');
          const extensionId = redirectUri.split('://')[1].split('/')[0];
          
          console.log('📋 Configuración detectada:');
          console.log('- Extension ID (real):', extensionId);
          console.log('- Client ID:', clientId);
          console.log('- Redirect URI:', redirectUri);
          console.log('- Redirect URI esperado en Google Cloud Console:', `https://${extensionId}.chromiumapp.org/google`);
          
          // Construir URL de autorización para test
          const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
            new URLSearchParams({
              client_id: clientId,
              response_type: 'token',
              redirect_uri: redirectUri,
              scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
              include_granted_scopes: 'true',
              state: 'debug_test_' + Date.now()
            }).toString();

          console.log('🔗 Auth URL construida:', authUrl);
          
          // Intentar launchWebAuthFlow
          console.log('🚀 Probando launchWebAuthFlow...');
          
          const responseUrl = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
              {
                url: authUrl,
                interactive: true
              },
              (responseUrl) => {
                if (chrome.runtime.lastError) {
                  console.error('❌ Error en launchWebAuthFlow:', chrome.runtime.lastError);
                  reject(new Error(chrome.runtime.lastError.message || 'Error de autorización'));
                } else if (!responseUrl) {
                  reject(new Error('No se recibió URL de respuesta'));
                } else {
                  console.log('✅ Response URL recibida:', responseUrl);
                  resolve(responseUrl);
                }
              }
            );
          });

          // Analizar respuesta
          const urlFragment = responseUrl.split('#')[1];
          if (urlFragment) {
            const urlParams = new URLSearchParams(urlFragment);
            const accessToken = urlParams.get('access_token');
            const error = urlParams.get('error');
            
            if (error) {
              console.error('❌ Error en OAuth:', error, urlParams.get('error_description'));
              return {
                success: false,
                method: 'launchWebAuthFlow',
                error: `${error}: ${urlParams.get('error_description') || 'Error desconocido'}`,
                extensionId,
                clientId,
                authUrl
              };
            }
            
            if (accessToken) {
              console.log('✅ Token obtenido exitosamente');
              return {
                success: true,
                method: 'launchWebAuthFlow',
                tokenStatus: 'obtenido',
                responseUrl,
                extensionId,
                clientId,
                authUrl
              };
            }
          }
          
          return {
            success: false,
            method: 'launchWebAuthFlow',
            error: 'No se pudo extraer token de la respuesta',
            responseUrl,
            extensionId,
            clientId,
            authUrl
          };
          
        } catch (error) {
          console.error('❌ Error en debugOAuth:', error);
          return {
            success: false,
            error: error.message,
            extensionId: 'No disponible',
            clientId: '571791803428-gbl2p0i1sab5jk1dd4g9fs2b7rj51nko.apps.googleusercontent.com'
          };
        }
      },

      // Acciones de autenticación
      login: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Verificar que estamos en un contexto de extensión
          if (!chrome || !chrome.identity) {
            throw new Error('Esta funcionalidad solo está disponible en extensiones de Chrome');
          }

          console.log('🔑 Iniciando proceso de autenticación con launchWebAuthFlow...');

          // Configuración OAuth2 para Chrome Extensions
          const clientId = '571791803428-h5qdt3rdtbk3g1p5ut2k8fvioh59h8qp.apps.googleusercontent.com';
          const redirectUri = chrome.identity.getRedirectURL('google');
          const scopes = [
            'https://www.googleapis.com/auth/userinfo.email', 
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/documents.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
          ];
          
          console.log('📋 Configuración OAuth:');
          console.log('- Redirect URI:', redirectUri);
          console.log('- Client ID:', clientId);
          console.log('- Scopes:', scopes);
          
          // Construir URL de autorización
          const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
            new URLSearchParams({
              client_id: clientId,
              response_type: 'token',
              redirect_uri: redirectUri,
              scope: scopes.join(' '),
              include_granted_scopes: 'true',
              state: 'franbot_auth_' + Date.now()
            }).toString();

          console.log('🔗 Auth URL:', authUrl);

          // Usar launchWebAuthFlow para Chrome Extensions
          const responseUrl = await new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
              {
                url: authUrl,
                interactive: true
              },
              (responseUrl) => {
                if (chrome.runtime.lastError) {
                  console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
                  reject(new Error(chrome.runtime.lastError.message || 'Error de autorización'));
                } else if (!responseUrl) {
                  reject(new Error('No se recibió URL de respuesta'));
                } else {
                  console.log('✅ Response URL recibida:', responseUrl);
                  resolve(responseUrl);
                }
              }
            );
          });

          // Extraer el token de acceso de la URL de respuesta
          const urlFragment = responseUrl.split('#')[1];
          if (!urlFragment) {
            throw new Error('No se encontró fragmento en la URL de respuesta');
          }

          const urlParams = new URLSearchParams(urlFragment);
          const accessToken = urlParams.get('access_token');
          const error = urlParams.get('error');
          
          if (error) {
            throw new Error(`Error de OAuth: ${error} - ${urlParams.get('error_description') || 'Error desconocido'}`);
          }
          
          if (!accessToken) {
            throw new Error('No se pudo obtener el token de acceso');
          }

          console.log('✅ Access token obtenido exitosamente');

          // Calcular tiempo de expiración (los tokens de Google suelen durar 1 hora)
          const expiresIn = urlParams.get('expires_in') || '3600'; // 1 hora por defecto
          const tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);

          // Guardar token en el almacenamiento local de Chrome para el background script
          if (chrome && chrome.storage) {
            try {
              await new Promise((resolve, reject) => {
                chrome.storage.local.set({
                  accessToken: accessToken,
                  tokenExpiry: tokenExpiry
                }, () => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve();
                  }
                });
              });
              console.log('✅ Token guardado en almacenamiento local de Chrome');
            } catch (error) {
              console.warn('⚠️ No se pudo guardar el token en almacenamiento local:', error);
            }
          }

          // Obtener información del usuario
          console.log('👤 Obteniendo información del usuario...');
          const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
          
          if (!userResponse.ok) {
            throw new Error(`Error al obtener información del usuario: ${userResponse.status}`);
          }
          
          const userInfo = await userResponse.json();
          console.log('✅ Información del usuario obtenida:', userInfo);

          set({
            isAuthenticated: true,
            user: userInfo,
            accessToken: accessToken,
            isLoading: false,
            error: null
          });

          return { success: true, user: userInfo };
        } catch (error) {
          console.error('❌ Error en login:', error);
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { accessToken } = get();
          
          if (accessToken) {
            // Revocar el token en Google
            try {
              await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              });
            } catch (error) {
              console.warn('Error al revocar token:', error);
            }
          }

          // Limpiar token del almacenamiento local de Chrome
          if (chrome && chrome.storage) {
            try {
              await new Promise((resolve, reject) => {
                chrome.storage.local.remove(['accessToken', 'tokenExpiry'], () => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve();
                  }
                });
              });
              console.log('✅ Token eliminado del almacenamiento local de Chrome');
            } catch (error) {
              console.warn('⚠️ No se pudo eliminar el token del almacenamiento local:', error);
            }
          }

          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          return { success: false, error: error.message };
        }
      },

      // Verificar si el token sigue siendo válido
      validateToken: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          return false;
        }

        try {
          const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
          return response.ok;
        } catch (error) {
          return false;
        }
      },

      // Verificar permisos específicos del token
      checkTokenPermissions: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          return { hasPermissions: false, error: 'No hay token de acceso' };
        }

        try {
          // Verificar información del token
          const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
          
          if (!tokenInfoResponse.ok) {
            return { hasPermissions: false, error: 'Token inválido o expirado' };
          }
          
          const tokenInfo = await tokenInfoResponse.json();
          console.log('🔍 Información del token:', tokenInfo);
          
          // Verificar que tenga los scopes necesarios
          const requiredScopes = [
            'https://www.googleapis.com/auth/documents.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
          ];
          
          const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
          const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
          
          if (!hasRequiredScopes) {
            console.warn('⚠️ El token no tiene todos los permisos necesarios');
            console.log('Scopes requeridos:', requiredScopes);
            console.log('Scopes del token:', tokenScopes);
            return { 
              hasPermissions: false, 
              error: 'El token no tiene permisos para acceder a Google Docs. Es necesario renovar la autenticación.',
              requiredScopes,
              tokenScopes
            };
          }
          
          return { hasPermissions: true, tokenInfo, tokenScopes };
          
        } catch (error) {
          console.error('❌ Error al verificar permisos del token:', error);
          return { hasPermissions: false, error: error.message };
        }
      },

      // Renovar autenticación con permisos completos
      renewAuthentication: async () => {
        console.log('🔄 Renovando autenticación con permisos completos...');
        
        // Primero hacer logout para limpiar el token actual
        await get().logout();
        
        // Luego hacer login nuevamente
        return await get().login();
      },

      // Limpiar errores
      clearError: () => set({ error: null }),

      // Actualizar información del usuario
      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
    }),
    {
      name: 'franbot-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;