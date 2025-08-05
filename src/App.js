import React, { useState, useEffect } from 'react';
import { useAuthStore, useAppStore } from './store';
import { useAIConfig } from './hooks/useAIConfig';
import './App.css';

function App() {
  const { 
    isAuthenticated, 
    user, 
    isLoading: authLoading, 
    error: authError,
    login, 
    logout, 
    validateToken,
    clearError,
    debugOAuth 
  } = useAuthStore();
  
  const { 
    currentTab, 
    addMessage, 
    getCurrentTabInfo,
    clearChatHistory 
  } = useAppStore();

  // Hook personalizado para configuración de IA
  const {
    aiProvider,
    selectedModel,
    apiKey,
    tempAiProvider,
    tempSelectedModel,
    tempApiKey,
    isValidatingApi,
    apiValidationStatus,
    validationMessage,
    hasUnsavedChanges,
    aiProviders,
    handleTempProviderChange,
    handleTempModelChange,
    handleTempApiKeyChange,
    testApiConnection,
    saveConfiguration,
    resetToDefaults
  } = useAIConfig();

  const [isGoogleDocs, setIsGoogleDocs] = useState(false);



  // Verificar si estamos en Google Docs
  const checkGoogleDocs = () => {
    if (currentTab && currentTab.url) {
      const isGoogleDocsUrl = currentTab.url.includes('docs.google.com/document/') ||
                             currentTab.url.includes('docs.google.com/spreadsheets/') ||
                             currentTab.url.includes('docs.google.com/presentation/');
      setIsGoogleDocs(isGoogleDocsUrl);
    }
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        const isValid = await validateToken();
        if (!isValid) {
          logout();
        }
      }
      
      // Obtener información de la pestaña actual
      await getCurrentTabInfo();
    };
    
    checkAuth();
  }, []);

  // Verificar Google Docs cuando cambie la información de la pestaña
  useEffect(() => {
    checkGoogleDocs();
  }, [currentTab]);

  const handleDebugOAuth = async () => {
    addMessage({
      text: '🔍 Iniciando diagnóstico OAuth...',
      sender: 'bot',
      type: 'info'
    });
    
    const result = await debugOAuth();
    
    if (result.success) {
      let message = `✅ Debug OAuth exitoso!\n\n📋 Información:\n- Extension ID: ${result.extensionId}\n- Client ID: ${result.clientId}\n- Método: ${result.method}`;
      
      if (result.method === 'getAuthToken') {
        message += `\n- Token obtenido: ${result.token ? 'Sí' : 'No'}`;
      } else if (result.method === 'launchWebAuthFlow') {
        message += `\n- Response URL: ${result.responseUrl ? 'Sí' : 'No'}`;
        message += `\n- Auth URL: ${result.authUrl}`;
      }
      
      addMessage({
        text: message,
        sender: 'bot',
        type: 'success'
      });
    } else {
      let message = `❌ Debug OAuth falló:\n\n🔍 Información de debug:\n- Extension ID: ${result.extensionId || 'No disponible'}\n- Client ID: ${result.clientId || 'No disponible'}\n- Método: ${result.method || 'No especificado'}\n- Error: ${result.error}`;
      
      if (result.authUrl) {
        message += `\n- Auth URL: ${result.authUrl}`;
      }
      
      message += `\n\n💡 Pasos siguientes:\n1. Verifica la configuración en Google Cloud Console\n2. Asegúrate de que el Extension ID esté correcto\n3. Recarga la extensión y vuelve a intentar`;
      
      addMessage({
        text: message,
        sender: 'bot',
        type: 'error'
      });
    }
  };

  const handleLogin = async () => {
    clearError();
    const result = await login();
    
    if (result.success) {
      // Agregar mensaje de bienvenida
      addMessage({
        text: `¡Hola ${result.user.name}! Bienvenido a Franbot. Ahora puedes usar todas las funciones avanzadas.`,
        sender: 'bot',
        type: 'welcome'
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    clearChatHistory();
    addMessage({
      text: 'Has cerrado sesión. Algunas funciones estarán limitadas hasta que vuelvas a iniciar sesión.',
      sender: 'bot',
      type: 'info'
    });
  };



  if (authLoading) {
    return (
      <div className="franbot-container">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loading-text">
            <h3>Franbot Assistant</h3>
            <p>Iniciando tu asistente inteligente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="franbot-container">
      {/* Verificar si estamos en Google Docs */}
      {!isGoogleDocs ? (
        <div className="google-docs-required">
          <div className="restriction-content">
            <div className="restriction-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h2>Franbot Assistant</h2>
            <p>Esta extensión solo puede ser utilizada en Google Docs.</p>
            <p>Por favor, abre un documento de Google Docs, Sheets o Presentations para usar Franbot.</p>
            <div className="supported-apps">
              <div className="app-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>Google Docs</span>
              </div>
              <div className="app-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z"/>
                </svg>
                <span>Google Sheets</span>
              </div>
              <div className="app-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19M17,12H7V10H17V12Z"/>
                </svg>
                <span>Google Presentations</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header moderno */}
          <div className="franbot-header">
            <div className="header-content">
              <div className="brand">
                <div className="brand-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21ZM14 10V12H16V10H14ZM16 14H14V16H16V14ZM20 15L18 17H22L20 15ZM20 10V8L18 10H22L20 10Z"/>
                  </svg>
                </div>
                <div className="brand-text">
                  <h1>Franbot</h1>
                  <span>AI Assistant</span>
                </div>
              </div>
              
              <div className="header-actions">
                {isAuthenticated ? (
                  <div className="user-profile">
                    <img src={user?.picture} alt={user?.name} className="user-avatar" />
                    <div className="user-info">
                      <span className="user-name">{user?.name}</span>
                      <span className="user-status">Conectado</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="auth-actions">
                    <button onClick={handleLogin} className="login-btn">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Iniciar con Google
                    </button>
                    <button onClick={handleDebugOAuth} className="debug-btn" title="Debug OAuth">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error message mejorado */}
          {authError && (
            <div className="error-banner">
              <div className="error-content">
                <svg viewBox="0 0 24 24" fill="currentColor" className="error-icon">
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                <span>{authError}</span>
              </div>
              <button onClick={clearError} className="error-close">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
          )}



          {/* Contenido principal */}
          <div className="main-content">
            {/* Configuración */}
            <div className="settings-section">
                <div className="settings-group">
                  <h3>Configuración de IA</h3>
                  
                  {/* Selector de Proveedor */}
                  <div className="setting-item">
                    <label htmlFor="ai-provider">Proveedor de IA</label>
                    <select 
                      id="ai-provider"
                      className="setting-select"
                      value={tempAiProvider}
                      onChange={(e) => handleTempProviderChange(e.target.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                    </select>
                  </div>

                  {/* Selector de Modelo */}
                  <div className="setting-item">
                    <label htmlFor="ai-model">Modelo</label>
                    <select 
                      id="ai-model"
                      className="setting-select"
                      value={tempSelectedModel}
                      onChange={(e) => handleTempModelChange(e.target.value)}
                    >
                      {aiProviders[tempAiProvider].models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* Input de API Key */}
                  <div className="setting-item">
                    <label htmlFor="api-key">API Key</label>
                    <div className="api-key-container">
                      <input
                        id="api-key"
                        type="password"
                        className="setting-input api-key-input"
                        placeholder={`Ingresa tu API key de ${aiProviders[tempAiProvider].name}`}
                        value={tempApiKey}
                        onChange={(e) => handleTempApiKeyChange(e.target.value)}
                      />
                      <div className="api-key-status">
                        {apiValidationStatus === 'success' ? (
                          <span className="status-configured">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                            </svg>
                            Validado
                          </span>
                        ) : apiValidationStatus === 'error' ? (
                          <span className="status-error">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                            </svg>
                            Error
                          </span>
                        ) : tempApiKey ? (
                          <span className="status-pending">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6Z"/>
                            </svg>
                            Pendiente
                          </span>
                        ) : (
                          <span className="status-missing">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                            </svg>
                            Requerido
                          </span>
                        )}
                      </div>
                    </div>
                    <small className="setting-help">
                      Tu API key se almacena localmente y nunca se comparte.
                    </small>
                  </div>

                  {/* Mensaje de validación */}
                  {validationMessage && (
                    <div className={`validation-message ${apiValidationStatus}`}>
                      {validationMessage}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="setting-actions">
                    <button 
                      onClick={saveConfiguration}
                      className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
                      disabled={isValidatingApi || !tempApiKey.trim()}
                      title="Probar API y guardar configuración"
                    >
                      {isValidatingApi ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="spinning">
                            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                          </svg>
                          Probando...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"/>
                          </svg>
                          {hasUnsavedChanges ? 'Probar y Guardar' : 'Configuración Guardada'}
                        </>
                      )}
                    </button>

                    <button 
                      onClick={resetToDefaults}
                      className="reset-btn"
                      title="Restaurar configuración por defecto"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.5L7,5.5L12,0.5V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z"/>
                      </svg>
                      Restaurar por defecto
                    </button>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Privacidad</h3>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Enviar datos de errores
                    </label>
                  </div>
                </div>

                <div className="settings-group">
                  <h3>Acerca de</h3>
                  <div className="about-info">
                    <p><strong>Franbot Assistant</strong></p>
                    <p>Versión 1.0.0</p>
                    <p>Tu asistente inteligente para Google Docs</p>
                  </div>
                </div>
              </div>
            </div>
        </>
      )}
    </div>
  ); 
}

export default App;
