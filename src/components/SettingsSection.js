import React from 'react';
import AIProviderConfig from './AIProviderConfig';

const SettingsSection = ({
  // Props para AIProviderConfig
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
  return (
    <div className="settings-section">
      <AIProviderConfig
        aiProviders={aiProviders}
        tempAiProvider={tempAiProvider}
        tempSelectedModel={tempSelectedModel}
        tempApiKey={tempApiKey}
        apiValidationStatus={apiValidationStatus}
        validationMessage={validationMessage}
        isValidatingApi={isValidatingApi}
        hasUnsavedChanges={hasUnsavedChanges}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onApiKeyChange={onApiKeyChange}
        onSaveConfiguration={onSaveConfiguration}
        onResetToDefaults={onResetToDefaults}
      />

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
  );
};

export default SettingsSection;