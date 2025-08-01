import { useState, useEffect } from 'react';

// Configuración de modelos por proveedor
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  google: {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro']
  }
};

export const useAIConfig = () => {
  // Estados para configuración de IA con valores por defecto
  const [aiProvider, setAiProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [apiKey, setApiKey] = useState('');

  // Estados temporales para los inputs (no guardados hasta validar)
  const [tempAiProvider, setTempAiProvider] = useState('openai');
  const [tempSelectedModel, setTempSelectedModel] = useState('gpt-4');
  const [tempApiKey, setTempApiKey] = useState('');

  // Estados para validación y guardado
  const [isValidatingApi, setIsValidatingApi] = useState(false);
  const [apiValidationStatus, setApiValidationStatus] = useState(null); // null, 'success', 'error'
  const [validationMessage, setValidationMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Inicializar valores por defecto y cargar configuración desde localStorage
  useEffect(() => {
    const initializeDefaults = () => {
      // Valores por defecto
      const defaultProvider = 'openai';
      const defaultModel = AI_PROVIDERS[defaultProvider].models[0]; // 'gpt-4'
      const defaultApiKey = '';

      // Obtener valores guardados o usar por defecto
      const savedProvider = localStorage.getItem('franbot_ai_provider') || defaultProvider;
      const savedModel = localStorage.getItem('franbot_ai_model') || defaultModel;
      const savedApiKey = localStorage.getItem('franbot_api_key') || defaultApiKey;

      // Validar que el proveedor guardado existe
      const validProvider = AI_PROVIDERS[savedProvider] ? savedProvider : defaultProvider;
      
      // Validar que el modelo guardado existe para el proveedor
      const validModel = AI_PROVIDERS[validProvider].models.includes(savedModel) 
        ? savedModel 
        : AI_PROVIDERS[validProvider].models[0];

      // Establecer estados guardados
      setAiProvider(validProvider);
      setSelectedModel(validModel);
      setApiKey(savedApiKey);

      // Establecer estados temporales (para los inputs)
      setTempAiProvider(validProvider);
      setTempSelectedModel(validModel);
      setTempApiKey(savedApiKey);

      // Guardar valores por defecto en localStorage si no existían
      if (!localStorage.getItem('franbot_ai_provider')) {
        localStorage.setItem('franbot_ai_provider', validProvider);
      }
      if (!localStorage.getItem('franbot_ai_model')) {
        localStorage.setItem('franbot_ai_model', validModel);
      }
      if (!localStorage.getItem('franbot_api_key')) {
        localStorage.setItem('franbot_api_key', defaultApiKey);
      }

      // Asegurar consistencia si los valores guardados no son válidos
      if (validProvider !== savedProvider || validModel !== savedModel) {
        localStorage.setItem('franbot_ai_provider', validProvider);
        localStorage.setItem('franbot_ai_model', validModel);
      }
    };

    initializeDefaults();
  }, []);

  // Guardar configuración en localStorage cuando cambie
  const saveAiConfig = (provider, model, key) => {
    localStorage.setItem('franbot_ai_provider', provider);
    localStorage.setItem('franbot_ai_model', model);
    localStorage.setItem('franbot_api_key', key);
  };

  // Manejar cambio de proveedor temporal
  const handleTempProviderChange = (newProvider) => {
    setTempAiProvider(newProvider);
    const firstModel = AI_PROVIDERS[newProvider].models[0];
    setTempSelectedModel(firstModel);
    setHasUnsavedChanges(true);
    setApiValidationStatus(null);
    setValidationMessage('');
  };

  // Manejar cambio de modelo temporal
  const handleTempModelChange = (newModel) => {
    setTempSelectedModel(newModel);
    setHasUnsavedChanges(true);
    setApiValidationStatus(null);
    setValidationMessage('');
  };

  // Manejar cambio de API key temporal
  const handleTempApiKeyChange = (newApiKey) => {
    setTempApiKey(newApiKey);
    setHasUnsavedChanges(true);
    setApiValidationStatus(null);
    setValidationMessage('');
  };

  // Función para probar la API usando llamadas directas a cada proveedor
  const testApiConnection = async () => {
    console.log('🔍 [API Test] Iniciando validación de API');
    console.log('📋 [API Test] Configuración:', {
      provider: tempAiProvider,
      model: tempSelectedModel,
      hasApiKey: !!tempApiKey.trim()
    });

    if (!tempApiKey.trim()) {
      console.log('❌ [API Test] Error: API key vacía');
      setApiValidationStatus('error');
      setValidationMessage('Por favor, ingresa una API key válida');
      return false;
    }

    setIsValidatingApi(true);
    setApiValidationStatus(null);
    setValidationMessage('Probando conexión con la API...');
    console.log('⏳ [API Test] Iniciando prueba de conexión...');

    try {
      let response;
      
      console.log(`🔧 [API Test] Configurando proveedor: ${tempAiProvider}`);
      
      if (tempAiProvider === 'openai') {
        console.log('🤖 [API Test] Probando OpenAI API...');
        
        const requestBody = {
          model: tempSelectedModel,
          messages: [
            {
              role: "user",
              content: "Responde solo con 'OK' si puedes leer este mensaje."
            }
          ],
          max_tokens: 10,
          temperature: 0
        };

        console.log('📤 [API Test] Enviando request a OpenAI:', requestBody);

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tempApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 [API Test] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ [API Test] Error response:', errorData);
          throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 [API Test] OpenAI response:', data);

        if (data.choices && data.choices[0] && data.choices[0].message) {
          console.log('✅ [API Test] OpenAI prueba exitosa!');
          setApiValidationStatus('success');
          setValidationMessage('✅ API de OpenAI configurada correctamente');
          return true;
        } else {
          throw new Error('Respuesta inválida de OpenAI API');
        }

      } else if (tempAiProvider === 'anthropic') {
        console.log('🧠 [API Test] Probando Anthropic API...');
        
        const requestBody = {
          model: tempSelectedModel,
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: "Responde solo con 'OK' si puedes leer este mensaje."
            }
          ]
        };

        console.log('📤 [API Test] Enviando request a Anthropic:', requestBody);

        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': tempApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 [API Test] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ [API Test] Error response:', errorData);
          throw new Error(`Anthropic API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 [API Test] Anthropic response:', data);

        if (data.content && data.content[0] && data.content[0].text) {
          console.log('✅ [API Test] Anthropic prueba exitosa!');
          setApiValidationStatus('success');
          setValidationMessage('✅ API de Anthropic configurada correctamente');
          return true;
        } else {
          throw new Error('Respuesta inválida de Anthropic API');
        }

      } else if (tempAiProvider === 'google') {
        console.log('🔍 [API Test] Probando Google Gemini API...');
        
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: "Responde solo con 'OK' si puedes leer este mensaje."
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0
          }
        };

        console.log('📤 [API Test] Enviando request a Google:', requestBody);

        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${tempSelectedModel}:generateContent?key=${tempApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 [API Test] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ [API Test] Error response:', errorData);
          throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 [API Test] Google response:', data);

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          console.log('✅ [API Test] Google prueba exitosa!');
          setApiValidationStatus('success');
          setValidationMessage('✅ API de Google configurada correctamente');
          return true;
        } else {
          throw new Error('Respuesta inválida de Google API');
        }
      }

    } catch (error) {
      console.error('❌ [API Test] Error durante la prueba:', error);
      console.log('🔍 [API Test] Detalles del error:', {
        message: error.message,
        name: error.name
      });
      
      setApiValidationStatus('error');
      
      if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('invalid_api_key')) {
        console.log('🔑 [API Test] Error de autenticación detectado');
        setValidationMessage('❌ API key inválida o sin permisos');
      } else if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('model_not_found')) {
        console.log('🔍 [API Test] Modelo no encontrado');
        setValidationMessage('❌ Modelo no encontrado o no disponible');
      } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('rate_limit')) {
        console.log('💰 [API Test] Límite de cuota excedido');
        setValidationMessage('❌ Límite de cuota excedido');
      } else if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.log('🌐 [API Test] Error de conexión');
        setValidationMessage('❌ Error de conexión con la API');
      } else {
        console.log('❓ [API Test] Error desconocido');
        setValidationMessage(`❌ Error: ${error.message}`);
      }
      return false;
    } finally {
      setIsValidatingApi(false);
      console.log('🏁 [API Test] Finalizando validación de API');
    }
  };

  // Función para guardar la configuración después de validar
  const saveConfiguration = async () => {
    console.log('💾 [Save Config] Iniciando proceso de guardado');
    console.log('📋 [Save Config] Configuración a guardar:', {
      provider: tempAiProvider,
      model: tempSelectedModel,
      hasApiKey: !!tempApiKey.trim()
    });

    const isValid = await testApiConnection();
    
    if (isValid) {
      console.log('✅ [Save Config] API validada, guardando configuración...');
      
      // Guardar en estados principales
      setAiProvider(tempAiProvider);
      setSelectedModel(tempSelectedModel);
      setApiKey(tempApiKey);
      
      // Guardar en localStorage
      saveAiConfig(tempAiProvider, tempSelectedModel, tempApiKey);
      
      setHasUnsavedChanges(false);
      setValidationMessage('✅ Configuración guardada exitosamente');
      
      console.log('💾 [Save Config] Configuración guardada exitosamente en localStorage');
      console.log('📋 [Save Config] Estados actualizados:', {
        provider: tempAiProvider,
        model: tempSelectedModel,
        hasUnsavedChanges: false
      });
    } else {
      console.log('❌ [Save Config] API no válida, no se guardó la configuración');
    }
  };

  // Resetear configuración a valores por defecto
  const resetToDefaults = () => {
    const defaultProvider = 'openai';
    const defaultModel = AI_PROVIDERS[defaultProvider].models[0];
    const defaultApiKey = '';

    // Resetear estados principales
    setAiProvider(defaultProvider);
    setSelectedModel(defaultModel);
    setApiKey(defaultApiKey);

    // Resetear estados temporales
    setTempAiProvider(defaultProvider);
    setTempSelectedModel(defaultModel);
    setTempApiKey(defaultApiKey);

    // Resetear estados de validación
    setApiValidationStatus(null);
    setValidationMessage('');
    setHasUnsavedChanges(false);

    // Limpiar localStorage
    localStorage.removeItem('franbot_ai_provider');
    localStorage.removeItem('franbot_ai_model');
    localStorage.removeItem('franbot_api_key');

    // Guardar valores por defecto
    saveAiConfig(defaultProvider, defaultModel, defaultApiKey);
  };

  return {
    // Estados principales
    aiProvider,
    selectedModel,
    apiKey,
    
    // Estados temporales
    tempAiProvider,
    tempSelectedModel,
    tempApiKey,
    
    // Estados de validación
    isValidatingApi,
    apiValidationStatus,
    validationMessage,
    hasUnsavedChanges,
    
    // Configuración
    aiProviders: AI_PROVIDERS,
    
    // Funciones
    handleTempProviderChange,
    handleTempModelChange,
    handleTempApiKeyChange,
    testApiConnection,
    saveConfiguration,
    resetToDefaults
  };
};