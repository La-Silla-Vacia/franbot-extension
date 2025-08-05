// Background script para Franbot
console.log("Franbot background script iniciado");

// Configuración inicial cuando se instala la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log("Franbot instalado correctamente");

  // Crear menú contextual
  chrome.contextMenus.create({
    id: "franbot-analyze",
    title: "Analizar con Franbot",
    contexts: ["selection", "page"],
  });

  // Función de prueba para obtener texto de Google Docs
  setTimeout(() => {
    testGoogleDocsAPI();
  }, 2000); // Esperar 2 segundos para que se inicialice todo
});

// Manejar clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "franbot-analyze") {
    // Abrir el popup o realizar alguna acción
    chrome.action.openPopup();
  }
});

// Manejar mensajes del content script y popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeText") {
    // Aquí se podría integrar con una API de IA
    const response = {
      analysis: `Análisis del texto: "${request.text}". Este es un análisis simulado.`,
      suggestions: ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"],
    };
    sendResponse(response);
  }

  if (request.action === "saveData") {
    // Guardar datos en el almacenamiento local
    chrome.storage.local.set({ franbotData: request.data }, () => {
      sendResponse({ success: true });
    });
  }

  if (request.action === "getAccessToken") {
    // Obtener el token de acceso usando la función auxiliar
    handleGetAccessToken((response) => {
      sendResponse(response);
    });
    return true; // Mantener el canal abierto para respuesta asíncrona
  }

  if (request.action === "getGoogleDocText") {
    const documentId = request.documentId;
    console.log("🚀 === INICIANDO PROCESO DE ANÁLISIS DE GOOGLE DOC ===");
    console.log("📄 ID del documento:", documentId);
    console.log("🕐 Timestamp:", new Date().toISOString());

    // Paso 1: Obtener y validar token de acceso
    console.log("🔑 Paso 1/4: Obteniendo token de acceso...");
    handleGetAccessToken((tokenResponse) => {
      if (!tokenResponse.success) {
        console.error("❌ Error en Paso 1 - Token de acceso:", tokenResponse.error);
        sendResponse({
          success: false,
          error: tokenResponse.error,
          step: "authentication",
          stepDescription: "Obtención y validación del token de acceso",
          errorDetails: {
            timestamp: new Date().toISOString(),
            phase: "authentication"
          }
        });
        return;
      }

      console.log("✅ Paso 1 completado - Token validado");
      console.log("👤 Usuario autenticado:", tokenResponse.user);
      const accessToken = tokenResponse.accessToken;

      // Paso 2: Obtener texto del documento de Google Docs
      console.log("📥 Paso 2/4: Extrayendo texto del documento...");
      getDocumentText(documentId, accessToken)
        .then((documentText) => {
          console.log("✅ Paso 2 completado - Texto extraído");
          console.log("📊 Estadísticas del documento:");
          console.log(`   - Caracteres totales: ${documentText.length}`);
          console.log(`   - Palabras aproximadas: ${documentText.split(/\s+/).length}`);
          console.log(`   - Líneas aproximadas: ${documentText.split('\n').length}`);
          console.log("📝 Muestra del contenido:");
          console.log("=".repeat(50));
          console.log(documentText.substring(0, 200) + (documentText.length > 200 ? '...' : ''));
          console.log("=".repeat(50));
          
          // Paso 3: Analizar texto con la API de nombres
          console.log("🤖 Paso 3/4: Analizando texto con IA...");
          return analyzeTextWithAPI(documentText);
        })
        .then((analysisResult) => {
          console.log("✅ Paso 3 completado - Análisis de IA finalizado");
          
          // Paso 4: Preparar y enviar respuesta final
          console.log("📤 Paso 4/4: Preparando respuesta final...");
          
          const finalResponse = {
            success: true,
            documentText: analysisResult.data.texto_analizado,
            documentId: documentId,
            user: tokenResponse.user,
            analysis: analysisResult,
            processingTime: Date.now(),
            steps: {
              authentication: "✅ Completado",
              textExtraction: "✅ Completado", 
              aiAnalysis: "✅ Completado",
              responsePreparation: "✅ Completado"
            }
          };
          
          console.log("🎉 === PROCESO COMPLETADO EXITOSAMENTE ===");
          console.log("📈 Resumen del análisis:");
          console.log(`   - Nombres analizados: ${analysisResult.data?.busquedas_realizadas?.length || 0}`);
          console.log(`   - Coincidencias encontradas: ${analysisResult.data?.busquedas_realizadas?.filter(s => s.output.total_coincidencias > 0).length || 0}`);
          
          sendResponse(finalResponse);
        })
        .catch((error) => {
          console.error("❌ Error en el proceso:");
          console.error("   Paso fallido:", error.step || "Desconocido");
          console.error("   Tipo de error:", error.name);
          console.error("   Mensaje:", error.message);
          console.error("   Stack completo:", error.stack);
          
          // Determinar en qué paso ocurrió el error
          let errorStep = "unknown";
          let stepDescription = "Paso desconocido";
          
          if (error.message.includes("Google Docs") || error.message.includes("documents")) {
            errorStep = "textExtraction";
            stepDescription = "Extracción de texto del documento de Google Docs";
          } else if (error.message.includes("API de análisis") || error.message.includes("search-names")) {
            errorStep = "aiAnalysis";
            stepDescription = "Análisis de texto con inteligencia artificial";
          } else if (error.message.includes("fetch") || error.message.includes("network")) {
            errorStep = "networkError";
            stepDescription = "Error de conectividad de red";
          }
          
          sendResponse({
            success: false,
            error: error.message,
            step: errorStep,
            stepDescription: stepDescription,
            errorDetails: {
              name: error.name,
              message: error.message,
              timestamp: new Date().toISOString(),
              phase: errorStep,
              stack: error.stack
            }
          });
        });
    });

    return true; // Mantener el canal abierto para respuesta asíncrona
  }

  if (request.action === "applyLinkToDocument") {
    const { documentId, textToFind, linkUrl } = request.data;
    
    console.log("🔗 Solicitud para aplicar enlace:");
    console.log(`   Documento: ${documentId}`);
    console.log(`   Texto: "${textToFind}"`);
    console.log(`   URL: ${linkUrl}`);
    
    // Obtener token de acceso
    handleGetAccessToken((tokenResponse) => {
      if (!tokenResponse.success) {
        console.error("❌ Error al obtener token:", tokenResponse.error);
        sendResponse({
          success: false,
          error: tokenResponse.error
        });
        return;
      }
      
      // Aplicar el enlace al documento
      applyLinkToDocument(documentId, textToFind, linkUrl, tokenResponse.accessToken)
        .then((result) => {
          console.log("✅ Enlace aplicado exitosamente");
          sendResponse({
            success: true,
            appliedCount: result.appliedCount,
            message: `Enlace aplicado a ${result.appliedCount} ocurrencia${result.appliedCount > 1 ? 's' : ''}`
          });
        })
        .catch((error) => {
          console.error("❌ Error al aplicar enlace:", error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
    });
    
    return true; // Mantener el canal abierto para respuesta asíncrona
  }

  if (request.action === "clearAuthToken") {
    console.log("🗑️ Eliminando token de autenticación...");
    
    // Eliminar token del almacenamiento local de Chrome
    chrome.storage.local.remove(["accessToken", "tokenExpiry"], () => {
      if (chrome.runtime.lastError) {
        console.error("❌ Error al eliminar token:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log("✅ Token eliminado exitosamente del almacenamiento local");
        sendResponse({ success: true });
      }
    });
    
    return true; // Mantener el canal abierto para respuesta asíncrona
  }

  if (request.action === "openExtensionPopup") {
    console.log("🔧 Intentando abrir popup de la extensión...");
    
    // Intentar abrir el popup de la extensión
    try {
      chrome.action.openPopup();
      sendResponse({ success: true });
    } catch (error) {
      console.error("❌ Error al abrir popup:", error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true;
  }

  if (request.action === "applyCorrectionToDocument") {
    console.log("🔧 Aplicando corrección al documento...");
    
    // Primero obtener el token de acceso
    handleGetAccessToken(async (authResult) => {
      if (!authResult.success) {
        sendResponse({
          success: false,
          error: authResult.error
        });
        return;
      }
      
      try {
         const result = await applyCorrectionToDocument(
           request.data.documentId,
           request.data.textToFind,
           request.data.replacement,
           authResult.accessToken
         );
         sendResponse(result);
       } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    });
    
    return true; // Mantener el canal abierto para respuesta asíncrona
  }

  return true; // Mantener el canal de mensaje abierto para respuestas asíncronas
});

// Función auxiliar para obtener y validar el token de acceso
function handleGetAccessToken(callback) {
  chrome.storage.local.get(["accessToken"]).then((result) => {
    try {
      const accessToken = result["accessToken"];
      
      console.log("🔑 Token encontrado, verificando validez...");

      // Verificar permisos del token
      fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Token inválido");
          }
          return response.json();
        })
        .then((tokenInfo) => {
          console.log("✅ Token info:", tokenInfo);

          const tokenScopes = tokenInfo.scope ? tokenInfo.scope.split(" ") : [];

          // Verificar que tenga los scopes necesarios para Google Docs
          const requiredScopes = [
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/drive.readonly",
          ];

          const hasRequiredScopes = requiredScopes.every((scope) =>
            tokenScopes.includes(scope)
          );

          if (!hasRequiredScopes) {
            console.warn("⚠️ Token sin permisos suficientes para Google Docs");
            callback({
              success: false,
              error:
                "El token no tiene permisos para acceder a Google Docs. Por favor, vuelve a iniciar sesión en la extensión para otorgar los permisos necesarios.",
              missingScopes: requiredScopes.filter(
                (scope) => !tokenScopes.includes(scope)
              ),
            });
          } else {
            console.log("✅ Token válido con permisos correctos");
            callback({
              success: true,
              accessToken: accessToken,
              user: tokenInfo.email,
              tokenScopes: tokenScopes,
            });
          }
        })
        .catch((error) => {
          console.error("❌ Error al verificar token:", error);
          callback({
            success: false,
            error:
              "Error al verificar el token. Por favor, vuelve a iniciar sesión en la extensión.",
          });
        });
    } catch (error) {
      console.error("❌ Error al procesar datos de autenticación:", error);
      callback({
        success: false,
        error: "Error al procesar los datos de autenticación.",
      });
    }
  });
}

// Función para analizar texto con la API de nombres
async function analyzeTextWithAPI(text) {
  try {
    console.log('🚀 Iniciando análisis de nombres...');
    console.log(`📊 Texto a analizar: ${text.length} caracteres`);
    console.log(`📝 Muestra del texto: "${text.substring(0, 100)}..."`);
    
    console.log('🌐 Enviando solicitud a la API de análisis...');
    const startTime = Date.now();
    
    const response = await fetch('https://worker-ai-prompts-execute-franbot.lasillavacia-com-account9262.workers.dev/search-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      })
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Tiempo de respuesta de la API: ${responseTime}ms`);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP de la API: ${response.status} ${response.statusText}`);
      throw new Error(`Error de la API de análisis: ${response.status} ${response.statusText}`);
    }
    
    console.log('📥 Procesando respuesta de la API...');
    const analysisData = await response.json();
    
    if (analysisData.status !== 'ok') {
      console.error('❌ Error en el estado de la respuesta:', analysisData.message);
      throw new Error(`Error en el análisis: ${analysisData.message || 'Error desconocido'}`);
    }
    
    // Log detallado de los resultados
    const totalSearches = analysisData.data?.busquedas_realizadas?.length || 0;
    const searchesWithResults = analysisData.data?.busquedas_realizadas?.filter(
      search => search.output.total_coincidencias > 0
    ).length || 0;
    
    console.log('✅ Análisis completado exitosamente');
    console.log(`🔍 Total de nombres analizados: ${totalSearches}`);
    console.log(`🎯 Nombres con coincidencias: ${searchesWithResults}`);
    console.log(`📈 Tasa de éxito: ${totalSearches > 0 ? Math.round((searchesWithResults / totalSearches) * 100) : 0}%`);
    
    if (searchesWithResults > 0) {
      console.log('🔗 Nombres encontrados:');
      analysisData.data.busquedas_realizadas
        .filter(search => search.output.total_coincidencias > 0)
        .forEach((search, index) => {
          console.log(`   ${index + 1}. ${search.input.nombre} (${search.output.total_coincidencias} coincidencias)`);
        });
    }
    
    return analysisData;
    
  } catch (error) {
    console.error('❌ Error detallado en analyzeTextWithAPI:');
    console.error('   Tipo de error:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    // Proporcionar información adicional según el tipo de error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('💡 Posible problema de conectividad o CORS');
    } else if (error.message.includes('404')) {
      console.error('💡 Endpoint de la API no encontrado');
    } else if (error.message.includes('500')) {
      console.error('💡 Error interno del servidor de la API');
    }
    
    throw error;
  }
}

// Función para obtener el texto de un documento de Google Docs
async function getDocumentText(documentId, accessToken) {
  try {
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error de la API de Google Docs: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const documentData = await response.json();

    // Extraer el texto del documento
    const documentText = extractTextFromDocument(documentData);

    return documentText;
  } catch (error) {
    console.error("Error en getDocumentText:", error);
    throw error;
  }
}

// Función auxiliar para extraer texto del documento de Google Docs
function extractTextFromDocument(documentData) {
  let text = "";

  if (!documentData.body || !documentData.body.content) {
    return "Documento vacío o sin contenido";
  }

  function extractTextFromElement(element) {
    let elementText = "";

    if (element.paragraph) {
      if (element.paragraph.elements) {
        element.paragraph.elements.forEach((paragraphElement) => {
          if (paragraphElement.textRun && paragraphElement.textRun.content) {
            elementText += paragraphElement.textRun.content;
          }
        });
      }
    } else if (element.table) {
      // Extraer texto de tablas
      element.table.tableRows.forEach((row) => {
        row.tableCells.forEach((cell) => {
          if (cell.content) {
            cell.content.forEach((cellElement) => {
              elementText += extractTextFromElement(cellElement);
            });
          }
        });
      });
    } else if (element.tableOfContents) {
      // Extraer texto de tabla de contenidos
      if (element.tableOfContents.content) {
        element.tableOfContents.content.forEach((tocElement) => {
          elementText += extractTextFromElement(tocElement);
        });
      }
    }

    return elementText;
  }

  // Procesar todo el contenido del documento
  documentData.body.content.forEach((element) => {
    text += extractTextFromElement(element);
  });

  // Limpiar el texto (remover saltos de línea excesivos, etc.)
  text = text.replace(/\n\s*\n/g, "\n\n").trim();

  return text || "No se pudo extraer texto del documento";
}

// Función para aplicar un enlace en el documento de Google Docs
async function applyLinkToDocument(documentId, textToFind, linkUrl, accessToken) {
  try {
    console.log(`🔗 Aplicando enlace en documento ${documentId}`);
    console.log(`   Texto a buscar: "${textToFind}"`);
    console.log(`   URL del enlace: ${linkUrl}`);
    
    // Primero, obtener el contenido del documento para encontrar las posiciones del texto
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al obtener documento: ${errorData.error?.message || response.statusText}`
      );
    }

    const documentData = await response.json();
    
    // Buscar las posiciones del texto en el documento
    const textPositions = findTextPositionsInDocument(documentData, textToFind);
    
    if (textPositions.length === 0) {
      throw new Error(`No se encontró el texto "${textToFind}" en el documento`);
    }
    
    console.log(`📍 Encontradas ${textPositions.length} ocurrencias del texto`);
    
    // Crear las solicitudes para aplicar el enlace
    const requests = [];
    
    // Procesar las posiciones en orden inverso para evitar problemas con los índices
    textPositions.reverse().forEach((position, index) => {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: position.startIndex,
            endIndex: position.endIndex
          },
          textStyle: {
            link: {
              url: linkUrl
            },
            foregroundColor: {
              color: {
                rgbColor: {
                  red: 0.0,
                  green: 0.0,
                  blue: 1.0
                }
              }
            },
            underline: true
          },
          fields: 'link,foregroundColor,underline'
        }
      });
    });
    
    // Ejecutar las solicitudes de formato
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: requests
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(
        `Error al aplicar enlace: ${errorData.error?.message || updateResponse.statusText}`
      );
    }
    
    const result = await updateResponse.json();
    console.log(`✅ Enlace aplicado exitosamente a ${textPositions.length} ocurrencias`);
    
    return {
      success: true,
      appliedCount: textPositions.length,
      result: result
    };
    
  } catch (error) {
    console.error('❌ Error al aplicar enlace:', error);
    throw error;
  }
}

// Función para aplicar una corrección (reemplazar texto) en el documento de Google Docs
async function applyCorrectionToDocument(documentId, textToFind, replacement, accessToken) {
  try {
    console.log(`🔧 Aplicando corrección en documento ${documentId}`);
    console.log(`   Texto a buscar: "${textToFind}"`);
    console.log(`   Reemplazo: "${replacement}"`);
    
    // Primero, obtener el contenido del documento para encontrar las posiciones del texto
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al obtener documento: ${errorData.error?.message || response.statusText}`
      );
    }

    const documentData = await response.json();
    
    // Buscar las posiciones del texto en el documento
    const textPositions = findTextPositionsInDocument(documentData, textToFind);
    
    if (textPositions.length === 0) {
      throw new Error(`No se encontró el texto "${textToFind}" en el documento`);
    }
    
    console.log(`📍 Encontradas ${textPositions.length} ocurrencias del texto`);
    
    // Crear las solicitudes para reemplazar el texto
    const requests = [];
    
    // Procesar las posiciones en orden inverso para evitar problemas con los índices
    textPositions.reverse().forEach((position, index) => {
      // Primero eliminar el texto original
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: position.startIndex,
            endIndex: position.endIndex
          }
        }
      });
      
      // Luego insertar el texto de reemplazo
      requests.push({
        insertText: {
          location: {
            index: position.startIndex
          },
          text: replacement
        }
      });
    });
    
    // Ejecutar las solicitudes de reemplazo
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: requests
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(
        `Error al aplicar corrección: ${errorData.error?.message || updateResponse.statusText}`
      );
    }
    
    const result = await updateResponse.json();
    console.log(`✅ Corrección aplicada exitosamente a ${textPositions.length} ocurrencias`);
    
    return {
      success: true,
      appliedCount: textPositions.length,
      result: result
    };
    
  } catch (error) {
    console.error('❌ Error al aplicar corrección:', error);
    throw error;
  }
}

// Función auxiliar para encontrar posiciones de texto en el documento
function findTextPositionsInDocument(document, textToFind) {
  const positions = [];
  
  if (!document.body || !document.body.content) {
    return positions;
  }
  
  let currentIndex = 1; // Los documentos de Google Docs empiezan en índice 1
  
  function searchInContent(content) {
    content.forEach(element => {
      if (element.paragraph) {
        element.paragraph.elements.forEach(paragraphElement => {
          if (paragraphElement.textRun) {
            const text = paragraphElement.textRun.content;
            const lowerText = text.toLowerCase();
            const lowerTarget = textToFind.toLowerCase();
            
            let searchIndex = 0;
            while (true) {
              const foundIndex = lowerText.indexOf(lowerTarget, searchIndex);
              if (foundIndex === -1) break;
              
              positions.push({
                startIndex: currentIndex + foundIndex,
                endIndex: currentIndex + foundIndex + textToFind.length
              });
              
              searchIndex = foundIndex + 1;
            }
            
            currentIndex += text.length;
          }
        });
      } else if (element.table) {
        // Buscar en tablas
        element.table.tableRows.forEach(row => {
          row.tableCells.forEach(cell => {
            if (cell.content) {
              searchInContent(cell.content);
            }
          });
        });
      }
    });
  }
  
  searchInContent(document.body.content);
  return positions;
}

// Función de prueba para demostrar la obtención de texto de Google Docs
async function testGoogleDocsAPI() {
  console.log("🧪 Iniciando prueba de API de Google Docs...");

  try {
    // Obtener el token de acceso desde localStorage
    chrome.storage.local.get(["franbot-auth-storage"], async (result) => {
      try {
        const authData = result["franbot-auth-storage"];

        if (
          !authData ||
          !authData.state ||
          !authData.state.isAuthenticated ||
          !authData.state.accessToken
        ) {
          console.log("❌ No hay token de acceso disponible para la prueba");
          console.log("💡 Para probar la funcionalidad:");
          console.log("   1. Inicia sesión en la extensión");
          console.log(
            '   2. Usa chrome.runtime.sendMessage({action: "getGoogleDocText", documentId: "TU_DOCUMENT_ID"})'
          );
          return;
        }

        const accessToken = authData.state.accessToken;
        const user = authData.state.user;

        console.log("✅ Token de acceso encontrado");
        console.log("👤 Usuario autenticado:", user.email);
        console.log("🔑 Token:", accessToken.substring(0, 20) + "...");

        // Ejemplo de ID de documento (puedes cambiarlo por un documento real)
        // Para obtener el ID de un documento, toma la URL: https://docs.google.com/document/d/DOCUMENT_ID/edit
        const exampleDocumentId =
          "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"; // Documento de ejemplo público

        console.log(
          "📄 Intentando obtener texto del documento:",
          exampleDocumentId
        );

        try {
          const documentText = await getDocumentText(
            exampleDocumentId,
            accessToken
          );
          console.log("🎉 ¡Prueba exitosa! Texto obtenido del documento.");
        } catch (error) {
          console.log(
            "⚠️ Error en la prueba (esto es normal si el documento no existe o no tienes permisos):"
          );
          console.log("   Error:", error.message);
          console.log("💡 Para probar con un documento real:");
          console.log("   1. Abre un documento de Google Docs");
          console.log("   2. Copia el ID del documento de la URL");
          console.log(
            '   3. Usa: chrome.runtime.sendMessage({action: "getGoogleDocText", documentId: "TU_DOCUMENT_ID"})'
          );
        }
      } catch (error) {
        console.error("❌ Error en la prueba:", error);
      }
    });
  } catch (error) {
    console.error("❌ Error al inicializar la prueba:", error);
  }
}
