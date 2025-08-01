import React from 'react';

const AIProviderConfig = ({
  aiProviders,
  tempAiProvider,
  tempSelectedModel,
  tempApiKey,
  apiValidationStatus,
  validationMessage,
  isValidatingApi,
  hasUnsavedChanges,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onSaveConfiguration,
  onResetToDefaults
}) => {
  const getStatusIcon = () => {
    switch (apiValidationStatus) {
      case 'success':
        return (
          <span className="status-configured">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
            </svg>
            Validado
          </span>
        );
      case 'error':
        return (
          <span className="status-error">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            Error
          </span>
        );
      default:
        return tempApiKey ? (
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
        );
    }
  };

  return (
    <div className="settings-group">
      <h3>Configuración de IA</h3>
      
      {/* Selector de Proveedor */}
      <div className="setting-item">
        <label htmlFor="ai-provider">Proveedor de IA</label>
        <select 
          id="ai-provider"
          className="setting-select"
          value={tempAiProvider}
          onChange={(e) => onProviderChange(e.target.value)}
        >
          {Object.entries(aiProviders).map(([key, provider]) => (
            <option key={key} value={key}>{provider.name}</option>
          ))}
        </select>
      </div>

      {/* Selector de Modelo */}
      <div className="setting-item">
        <label htmlFor="ai-model">Modelo</label>
        <select 
          id="ai-model"
          className="setting-select"
          value={tempSelectedModel}
          onChange={(e) => onModelChange(e.target.value)}
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
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <div className="api-key-status">
            {getStatusIcon()}
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
          onClick={onSaveConfiguration}
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
          onClick={onResetToDefaults}
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
  );
};

export default AIProviderConfig;