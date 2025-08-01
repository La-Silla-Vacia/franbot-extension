// Content script para Franbot
console.log('Franbot content script cargado');

// Función para inicializar Google Docs
function initializeGoogleDocs() {
  // Verificar si estamos en Google Docs
  if (!window.location.hostname.includes('docs.google.com')) {
    return;
  }
  
  console.log('🔧 Inicializando soporte para Google Docs...');
  
  // Forzar modo HTML en lugar de canvas para mejor compatibilidad
  try {
    // Obtener el ID de la extensión desde el manifest
    const extensionId = chrome.runtime.id;
    
    // Forzar renderizado HTML en lugar de canvas
    window._docs_force_html_by_ext = extensionId;
    
    console.log('📄 Modo HTML forzado para Google Docs');
  } catch (error) {
    console.warn('⚠️ No se pudo forzar el modo HTML:', error);
  }
  
  // Esperar a que el documento se cargue completamente
  const waitForGoogleDocsLoad = () => {
    const checkInterval = setInterval(() => {
      const docContainer = document.querySelector('.kix-page, .kix-lineview, [contenteditable="true"]');
      if (docContainer) {
        console.log('✅ Google Docs cargado completamente');
        clearInterval(checkInterval);
        
        // Agregar observer para cambios en el documento
        observeGoogleDocsChanges();
      }
    }, 1000);
    
    // Timeout después de 30 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  };
  
  // Iniciar la espera
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGoogleDocsLoad);
  } else {
    waitForGoogleDocsLoad();
  }
}

// Función para observar cambios en Google Docs
function observeGoogleDocsChanges() {
  const docContainer = document.querySelector('.kix-page, .kix-lineview, [contenteditable="true"]');
  if (!docContainer) return;
  
  const observer = new MutationObserver((mutations) => {
    // Verificar si nuestros highlights siguen intactos
    const highlights = document.querySelectorAll('.franbot-highlight');
    if (highlights.length === 0) return;
    
    // Si hay cambios significativos, podríamos necesitar re-marcar el texto
    let significantChange = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        significantChange = true;
      }
    });
    
    if (significantChange) {
      console.log('📝 Detectado cambio en Google Docs');
      // Aquí podríamos re-aplicar los highlights si es necesario
    }
  });
  
  observer.observe(docContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('👀 Observer de Google Docs activado');
}

// Inicializar Google Docs si estamos en la página
initializeGoogleDocs();

// ========== FUNCIONES DE LA API DE GOOGLE DOCS ==========

// Variable global para almacenar el token de acceso
let googleDocsAccessToken = null;
let currentDocumentId = null;

// Función para obtener el ID del documento de Google Docs
function extractDocumentIdFromUrl(url = window.location.href) {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Función para autenticarse con Google Docs API
async function authenticateGoogleDocs() {
  try {
    console.log('🔐 Iniciando autenticación con Google Docs API...');
    
    // Usar la API de Chrome Identity para obtener el token
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
    
    googleDocsAccessToken = token;
    currentDocumentId = extractDocumentIdFromUrl();
    
    console.log('✅ Autenticación exitosa con Google Docs API');
    return true;
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return false;
  }
}

// Función para obtener el contenido del documento usando la API
async function getDocumentContent() {
  if (!googleDocsAccessToken || !currentDocumentId) {
    console.warn('⚠️ No hay token de acceso o ID de documento');
    return null;
  }
  
  try {
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${currentDocumentId}`, {
      headers: {
        'Authorization': `Bearer ${googleDocsAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const document = await response.json();
    console.log('📄 Contenido del documento obtenido:', document);
    return document;
  } catch (error) {
    console.error('❌ Error al obtener contenido del documento:', error);
    return null;
  }
}

// Función para aplicar formato de subrayado rojo usando la API
async function applyRedUnderlineToText(textToFind, suggestionId) {
  if (!googleDocsAccessToken || !currentDocumentId) {
    console.warn('⚠️ No hay token de acceso o ID de documento');
    return false;
  }
  
  try {
    console.log(`🎯 Aplicando subrayado rojo a: "${textToFind}"`);
    
    // Primero, obtener el contenido del documento para encontrar las posiciones del texto
    const document = await getDocumentContent();
    if (!document) return false;
    
    // Buscar el texto en el contenido del documento
    const textPositions = findTextPositionsInDocument(document, textToFind);
    
    if (textPositions.length === 0) {
      console.warn(`⚠️ No se encontró el texto "${textToFind}" en el documento`);
      return false;
    }
    
    // Crear las solicitudes de formato para cada posición encontrada
    const requests = [];
    
    textPositions.forEach(position => {
      // Solicitud para aplicar subrayado rojo con fondo rojo claro
      // NOTA: El subrayado será rojo porque el texto será rojo (limitación de la API)
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: position.startIndex,
            endIndex: position.endIndex
          },
          textStyle: {
            underline: true,
            foregroundColor: {
              color: {
                rgbColor: {
                  red: 1.0,    // Texto rojo para que el subrayado sea rojo
                  green: 0.0,
                  blue: 0.0
                }
              }
            },
            backgroundColor: {
              color: {
                rgbColor: {
                  red: 1.0,    // Fondo rojo muy claro
                  green: 0.9,
                  blue: 0.9
                }
              }
            }
          },
          fields: 'underline,foregroundColor,backgroundColor'
        }
      });
      
      // Crear un named range para poder rastrear y limpiar después
      requests.push({
        createNamedRange: {
          name: `franbot-suggestion-${suggestionId}-${position.startIndex}`,
          range: {
            startIndex: position.startIndex,
            endIndex: position.endIndex
          }
        }
      });
    });
    
    // Ejecutar las solicitudes de formato
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${currentDocumentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleDocsAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: requests
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Formato aplicado exitosamente:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Error al aplicar formato:', error);
    return false;
  }
}

// Función para encontrar posiciones de texto en el documento
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

// Función para limpiar formatos aplicados por la extensión
async function clearRedUnderlines() {
  if (!googleDocsAccessToken || !currentDocumentId) {
    return false;
  }
  
  try {
    console.log('🧹 Limpiando subrayados rojos...');
    
    // Obtener todos los named ranges de la extensión
    const document = await getDocumentContent();
    if (!document || !document.namedRanges) return false;
    
    const requests = [];
    
    // Buscar named ranges que empiecen con 'franbot-suggestion-'
    Object.keys(document.namedRanges).forEach(rangeName => {
      if (rangeName.startsWith('franbot-suggestion-')) {
        const range = document.namedRanges[rangeName].namedRanges[0].range;
        
        // Solicitud para quitar el formato
        requests.push({
          updateTextStyle: {
            range: range,
            textStyle: {
              underline: false,
              foregroundColor: {
                color: {
                  rgbColor: {
                    red: 0.0,
                    green: 0.0,
                    blue: 0.0
                  }
                }
              }
            },
            fields: 'underline,foregroundColor'
          }
        });
        
        // Eliminar el named range
        requests.push({
          deleteNamedRange: {
            name: rangeName
          }
        });
      }
    });
    
    if (requests.length > 0) {
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${currentDocumentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleDocsAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: requests
        })
      });
      
      if (response.ok) {
        console.log('✅ Subrayados rojos limpiados');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error al limpiar subrayados:', error);
    return false;
  }
}

// ========== FIN FUNCIONES API GOOGLE DOCS ==========



// Función para extraer contenido de la página
function extractPageContent() {
  const content = {
    title: document.title,
    url: window.location.href,
    selectedText: window.getSelection().toString(),
    
    // Extraer metadatos
    meta: {
      description: document.querySelector('meta[name="description"]')?.content || '',
      keywords: document.querySelector('meta[name="keywords"]')?.content || '',
      author: document.querySelector('meta[name="author"]')?.content || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
    },
    
    // Extraer headings
    headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent.trim(),
      id: h.id || null
    })).filter(h => h.text.length > 0),
    
    // Extraer párrafos principales
    paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim())
      .filter(text => text.length > 50)
      .slice(0, 10), // Limitar a 10 párrafos
    
    // Extraer enlaces
    links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
      text: a.textContent.trim(),
      href: a.href,
      title: a.title || null
    })).filter(link => link.text.length > 0).slice(0, 20), // Limitar a 20 enlaces
    
    // Extraer imágenes
    images: Array.from(document.querySelectorAll('img[src]')).map(img => ({
      src: img.src,
      alt: img.alt || '',
      title: img.title || '',
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height
    })).slice(0, 10), // Limitar a 10 imágenes
    
    // Información de la página
    pageInfo: {
      domain: window.location.hostname,
      path: window.location.pathname,
      protocol: window.location.protocol,
      language: document.documentElement.lang || 'unknown',
      charset: document.characterSet || 'unknown',
      lastModified: document.lastModified,
      wordCount: document.body.textContent.trim().split(/\s+/).length,
      hasVideo: document.querySelectorAll('video').length > 0,
      hasAudio: document.querySelectorAll('audio').length > 0,
      hasForm: document.querySelectorAll('form').length > 0,
      hasTable: document.querySelectorAll('table').length > 0
    },
    
    // Extraer texto principal (heurística simple)
    mainContent: extractMainContent(),
    
    // Timestamp del análisis
    analyzedAt: new Date().toISOString()
  };
  
  return content;
}

// Función para extraer el contenido principal de la página
function extractMainContent() {
  // Intentar encontrar el contenido principal usando selectores comunes
  const selectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    'article',
    '.container .content',
    '#content',
    '#main'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 200) {
        return text.substring(0, 2000) + (text.length > 2000 ? '...' : '');
      }
    }
  }
  
  // Si no se encuentra contenido principal, extraer del body
  const bodyText = document.body.textContent.trim();
  return bodyText.substring(0, 2000) + (bodyText.length > 2000 ? '...' : '');
}

// Función para comunicarse con el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'getPageInfo':
        const pageInfo = {
          title: document.title,
          url: window.location.href,
          selectedText: window.getSelection().toString()
        };
        sendResponse(pageInfo);
        break;
        
      case 'extractPageContent':
        const content = extractPageContent();
        sendResponse(content);
        break;
        
      case 'highlightText':
        highlightText(request.text).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('Error al resaltar texto:', error);
          sendResponse({ success: false, error: error.message });
        });
        break;
        
      case 'clearHighlights':
        clearHighlights().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('Error al limpiar highlights:', error);
          sendResponse({ success: false, error: error.message });
        });
        break;
        
      case 'scrollToElement':
        scrollToElement(request.selector);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Acción no reconocida' });
    }
  } catch (error) {
    console.error('Error en content script:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Mantener el canal de respuesta abierto para respuestas asíncronas
});

// Función para resaltar texto en la página
async function highlightText(text) {
  if (!text) return;
  
  // Limpiar highlights anteriores
  await clearHighlights();
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    if (parent.classList.contains('franbot-highlight')) return; // Evitar doble highlight
    
    const regex = new RegExp(`(${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlightedHTML = textNode.textContent.replace(regex, '<span class="franbot-highlight" style="background-color: #667eea; color: white; padding: 2px 4px; border-radius: 3px;">$1</span>');
    
    if (highlightedHTML !== textNode.textContent) {
      const wrapper = document.createElement('span');
      // Crear elementos de manera segura en lugar de usar innerHTML
      const parts = textNode.textContent.split(regex);
      const matches = textNode.textContent.match(regex) || [];
      
      let matchIndex = 0;
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // Texto normal
          if (part) wrapper.appendChild(document.createTextNode(part));
        } else {
          // Texto a resaltar
          const highlight = createSafeElement('span', 'background-color: #667eea; color: white; padding: 2px 4px; border-radius: 3px;', part);
          highlight.className = 'franbot-highlight';
          wrapper.appendChild(highlight);
        }
      });
      
      parent.replaceChild(wrapper, textNode);
    }
  });
}

// Función para limpiar highlights
async function clearHighlights() {
  const highlights = document.querySelectorAll('.franbot-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Combinar nodos de texto adyacentes
  });
  
  // Limpiar tooltip triggers (modo híbrido)
  const triggers = document.querySelectorAll('.franbot-tooltip-trigger');
  triggers.forEach(trigger => {
    const parent = trigger.parentNode;
    parent.replaceChild(document.createTextNode(trigger.textContent), trigger);
    parent.normalize();
  });
  
  // Si estamos en Google Docs, limpiar también los subrayados rojos de la API
  const isGoogleDocs = window.location.href.includes('docs.google.com/document');
  if (isGoogleDocs && googleDocsAccessToken) {
    console.log('🧹 Limpiando subrayados rojos de Google Docs API...');
    await clearRedUnderlines();
  }
}

// Función para hacer scroll a un elemento
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Resaltar temporalmente el elemento
    const originalStyle = element.style.cssText;
    element.style.cssText += 'outline: 3px solid #667eea; outline-offset: 2px;';
    
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 3000);
  }
}

// Observar cambios en la página para actualizar el análisis
const observer = new MutationObserver((mutations) => {
  // Notificar al popup si hay cambios significativos
  const hasSignificantChanges = mutations.some(mutation => 
    mutation.type === 'childList' && mutation.addedNodes.length > 0
  );
  
  if (hasSignificantChanges) {
    chrome.runtime.sendMessage({
      action: 'pageContentChanged',
      url: window.location.href
    }).catch(() => {
      // Ignorar errores si el popup no está abierto
    });
  }
});

// Iniciar observación
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

// Función para extraer texto usando la API de Google Docs
async function extractPageTextWithAPI() {
  try {
    // Verificar que estamos en Google Docs
    if (!window.location.hostname.includes('docs.google.com')) {
      throw new Error('Esta funcionalidad solo está disponible en Google Docs');
    }
    
    // Extraer el ID del documento de la URL
    const urlMatch = window.location.href.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (!urlMatch) {
      throw new Error('No se pudo extraer el ID del documento de la URL');
    }
    
    const documentId = urlMatch[1];
    console.log('📄 ID del documento extraído:', documentId);
    
    // Solicitar el token de acceso al popup/background script
    const authResponse = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getAccessToken'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (!authResponse.success || !authResponse.accessToken) {
      // Mostrar mensaje específico según el tipo de error
      let userMessage = 'No se pudo obtener el token de acceso. Por favor, inicia sesión en la extensión.';
      
      if (authResponse.missingScopes) {
        userMessage = 'Permisos insuficientes. Faltan: ' + authResponse.missingScopes.join(', ') + 
                     '. Por favor, cierra sesión y vuelve a iniciar sesión para otorgar todos los permisos necesarios.';
      }
      
      throw new Error(userMessage);
    }
    
    const accessToken = authResponse.accessToken;
    
    // Verificar que el token no esté expirado
    if (authResponse.tokenExpiry && new Date(authResponse.tokenExpiry) < new Date()) {
      throw new Error('El token de acceso ha expirado. Por favor, vuelve a iniciar sesión en la extensión.');
    }
    
    console.log('🔑 Token de acceso obtenido con permisos:', authResponse.tokenScopes || 'No especificados');
    
    // Llamar a la API de Google Docs con parámetros optimizados
    const apiUrl = `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response from API:', errorText);
      
      if (response.status === 401) {
        throw new Error('Token de acceso expirado o inválido. Por favor, vuelve a iniciar sesión en la extensión.');
      } else if (response.status === 403) {
        throw new Error('No tienes permisos para acceder a este documento. Verifica que tengas acceso de lectura.');
      } else if (response.status === 404) {
        throw new Error('Documento no encontrado. Verifica que el ID del documento sea correcto.');
      } else if (response.status === 429) {
        throw new Error('Límite de solicitudes excedido. Intenta de nuevo en unos minutos.');
      } else {
        throw new Error(`Error de la API (${response.status}): ${response.statusText}. ${errorText}`);
      }
    }
    
    const docData = await response.json();
    console.log('📋 Datos del documento obtenidos de la API:', docData);
    
    // Extraer el texto del documento
    const extractedText = extractTextFromDocumentStructure(docData);
    
    console.log('✅ Texto extraído exitosamente de Google Docs API');
    console.log('📊 Información del documento:', {
      title: docData.title || 'Sin título',
      documentId: docData.documentId,
      revisionId: docData.revisionId,
      wordCount: extractedText.wordCount,
      paragraphs: extractedText.paragraphs.length,
      hasTabsStructure: !!(docData.tabs && docData.tabs.length > 0),
      tabsCount: docData.tabs ? docData.tabs.length : 0,
      suggestionsViewMode: docData.suggestionsViewMode,
      documentStyle: docData.documentStyle ? 'Presente' : 'No disponible'
    });
    
    // Log adicional para debugging si hay tabs
    if (docData.tabs && docData.tabs.length > 0) {
      console.log('📑 Estructura de tabs detectada:', docData.tabs.map(tab => ({
        tabId: tab.tabProperties?.tabId,
        title: tab.tabProperties?.title,
        index: tab.tabProperties?.index,
        hasDocumentTab: !!tab.documentTab
      })));
    }
    
    const documentData = {
      title: docData.title || 'Sin título',
      url: window.location.href,
      documentId: documentId,
      fullText: extractedText.fullText,
      paragraphs: extractedText.paragraphs,
      wordCount: extractedText.wordCount,
      extractedAt: new Date().toISOString(),
      source: 'Google Docs API',
      documentInfo: {
        revisionId: docData.revisionId,
        suggestionsViewMode: docData.suggestionsViewMode,
        documentStyle: docData.documentStyle
      }
    };

    return documentData;
  } catch (error) {
    console.error('❌ Error extrayendo texto con API:', error);
    throw error;
  }
}

// ===== FUNCIONES DE ANÁLISIS DE TEXTO =====
/**
 * Función principal para analizar el texto extraído
 * @param {Object} documentData - Datos del documento extraído
 */
function analyzeExtractedText(documentData) {
  console.log('🔍 === INICIANDO ANÁLISIS DE TEXTO ===');
  
  if (!documentData || documentData.error) {
    console.error('❌ No se pueden analizar los datos: datos inválidos o con errores');
    return {
      success: false,
      error: 'Datos de documento inválidos'
    };
  }
  
  console.log('📄 Información del documento:');
  console.log('  - Título:', documentData.title || 'Sin título');
  console.log('  - ID del documento:', documentData.documentId || 'No disponible');
  console.log('  - URL:', documentData.url || 'No disponible');
  console.log('  - Fuente:', documentData.source || 'No especificada');
  
  console.log('📊 Estadísticas del texto:');
  console.log('  - Número total de palabras:', documentData.wordCount || 0);
  console.log('  - Número de párrafos:', documentData.paragraphs ? documentData.paragraphs.length : 0);
  console.log('  - Longitud del texto:', documentData.fullText ? documentData.fullText.length : 0, 'caracteres');
  
  // Análisis básico del contenido
  if (documentData.fullText) {
    const textLength = documentData.fullText.length;
    const sentences = documentData.fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? (documentData.wordCount / sentences.length).toFixed(1) : 0;
    
    console.log('📝 Análisis de contenido:');
    console.log('  - Número de oraciones:', sentences.length);
    console.log('  - Promedio de palabras por oración:', avgWordsPerSentence);
    console.log('  - Caracteres por palabra (promedio):', documentData.wordCount > 0 ? (textLength / documentData.wordCount).toFixed(1) : 0);
  }
  
  // Análisis de párrafos
  if (documentData.paragraphs && documentData.paragraphs.length > 0) {
    console.log('📋 Análisis de párrafos:');
    console.log('  - Párrafo más largo:', Math.max(...documentData.paragraphs.map(p => p.length)), 'caracteres');
    console.log('  - Párrafo más corto:', Math.min(...documentData.paragraphs.map(p => p.length)), 'caracteres');
    console.log('  - Promedio de caracteres por párrafo:', (documentData.paragraphs.reduce((sum, p) => sum + p.length, 0) / documentData.paragraphs.length).toFixed(1));
    
    // Mostrar primeros párrafos como muestra
    console.log('📖 Primeros párrafos (muestra):');
    documentData.paragraphs.slice(0, 3).forEach((paragraph, index) => {
      const preview = paragraph.length > 100 ? paragraph.substring(0, 100) + '...' : paragraph;
      console.log(`  ${index + 1}. ${preview}`);
    });
  }
  
  console.log('✅ === ANÁLISIS COMPLETADO ===');
  
  return {
    success: true,
    analysis: {
      documentInfo: {
        title: documentData.title,
        documentId: documentData.documentId,
        wordCount: documentData.wordCount,
        paragraphCount: documentData.paragraphs ? documentData.paragraphs.length : 0,
        characterCount: documentData.fullText ? documentData.fullText.length : 0
      },
      textMetrics: {
        sentences: documentData.fullText ? documentData.fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0,
        avgWordsPerSentence: documentData.fullText && documentData.wordCount > 0 ? 
          (documentData.wordCount / documentData.fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).length).toFixed(1) : 0,
        avgCharsPerWord: documentData.wordCount > 0 && documentData.fullText ? 
          (documentData.fullText.length / documentData.wordCount).toFixed(1) : 0
      }
    }
  };
}

// ===== FIN DE FUNCIONES DE ANÁLISIS =====

// Función para extraer texto de la estructura del documento de la API
function extractTextFromDocumentStructure(docData) {
  let fullText = '';
  let paragraphs = [];
  let wordCount = 0;
  
  function processElement(element) {
    if (element.paragraph) {
      let paragraphText = '';
      
      if (element.paragraph.elements) {
        element.paragraph.elements.forEach(elem => {
          if (elem.textRun && elem.textRun.content) {
            paragraphText += elem.textRun.content;
          } else if (elem.autoText && elem.autoText.textStyle) {
            // Manejar texto automático (números de página, etc.)
            paragraphText += '[AutoText]';
          } else if (elem.pageBreak) {
            paragraphText += '\n[Page Break]\n';
          } else if (elem.columnBreak) {
            paragraphText += '\n[Column Break]\n';
          } else if (elem.footnoteReference) {
            paragraphText += '[Footnote]';
          } else if (elem.horizontalRule) {
            paragraphText += '\n---\n';
          } else if (elem.equation) {
            paragraphText += '[Equation]';
          } else if (elem.inlineObjectElement) {
            paragraphText += '[Inline Object]';
          }
        });
      }
      
      if (paragraphText.trim()) {
        paragraphs.push(paragraphText.trim());
        fullText += paragraphText + '\n';
      }
    } else if (element.table) {
      // Procesar tablas según la documentación oficial
      if (element.table.tableRows) {
        element.table.tableRows.forEach(row => {
          if (row.tableCells) {
            row.tableCells.forEach(cell => {
              if (cell.content) {
                cell.content.forEach(processElement);
              }
            });
          }
        });
      }
    } else if (element.tableOfContents) {
      // Procesar tabla de contenidos
      if (element.tableOfContents.content) {
        element.tableOfContents.content.forEach(processElement);
      }
    } else if (element.sectionBreak) {
      fullText += '\n--- Section Break ---\n';
    }
  }
  
  function processTabContent(tabContent) {
    if (tabContent && tabContent.content) {
      tabContent.content.forEach(processElement);
    }
  }
  
  // Procesar el contenido del documento según la nueva estructura con tabs
  if (docData.tabs && docData.tabs.length > 0) {
    // Nuevo formato con tabs
    docData.tabs.forEach(tab => {
      if (tab.documentTab) {
        processTabContent(tab.documentTab.body);
      }
    });
  } else if (docData.body && docData.body.content) {
    // Formato legacy sin tabs
    docData.body.content.forEach(processElement);
  }
  
  // Calcular número de palabras
  wordCount = fullText.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    fullText: fullText.trim(),
    paragraphs: paragraphs,
    wordCount: wordCount
  };
}

// Función para crear el botón flotante
function createFloatingButton() {
  // Verificar si el botón ya existe
  if (document.getElementById('franbot-analyze-button')) {
    return;
  }

  // Variable para almacenar los resultados del análisis
  let analysisResults = null;
  let isExpanded = false;

  // Crear el contenedor principal
  const container = document.createElement('div');
  container.id = 'franbot-analyze-button';
  
  // Crear el botón
  const button = document.createElement('div');
  button.className = 'franbot-button';
  
  // Crear contenido inicial del botón de manera segura
  const initialContainer = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
  const initialSvg = createSafeSVG('20', '20', '0 0 24 24', 'currentColor', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
  const initialText = createSafeElement('span', '', 'Analizar texto');
  initialContainer.appendChild(initialSvg);
  initialContainer.appendChild(initialText);
  button.appendChild(initialContainer);

  // Crear el panel de resultados (inicialmente oculto)
  const resultsPanel = document.createElement('div');
  resultsPanel.className = 'franbot-results-panel';
  resultsPanel.style.display = 'none';

  // Agregar elementos al contenedor
  container.appendChild(button);
  container.appendChild(resultsPanel);

  // Estilos del contenedor
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
  `;

  // Estilos del botón
  button.style.cssText = `
    background: linear-gradient(135deg, #338BFD 0%, #2563eb 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(51, 139, 253, 0.4);
    transition: all 0.3s ease;
    user-select: none;
    border: none;
    outline: none;
  `;

  // Estilos del panel de resultados
  resultsPanel.style.cssText = `
    position: absolute;
    bottom: 60px;
    right: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    padding: 20px;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    transform: scale(0.8) translateY(20px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    z-index: 10001;
  `;

  // Función para actualizar el contenido del botón
  function updateButtonState(state, results = null) {
    // Limpiar contenido del botón
    button.textContent = '';
    
    if (state === 'analyzing') {
      const container = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
      const spinner = createSafeElement('div', 'width: 16px; height: 16px; border: 2px solid #ffffff40; border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;');
      const text = createSafeElement('span', '', 'Analizando...');
      container.appendChild(spinner);
      container.appendChild(text);
      button.appendChild(container);
      button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (state === 'results') {
      if (isExpanded) {
        const container = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
        const svg = createSafeSVG('20', '20', '0 0 24 24', 'currentColor', 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
        const text = createSafeElement('span', '', 'Cerrar');
        container.appendChild(svg);
        container.appendChild(text);
        button.appendChild(container);
        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      } else {
        const container = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
        const svg = createSafeSVG('20', '20', '0 0 24 24', 'currentColor', 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z');
        const text = createSafeElement('span', '', 'Ver resultados');
        container.appendChild(svg);
        container.appendChild(text);
        button.appendChild(container);
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
      analysisResults = results;
    } else {
      const container = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
      const svg = createSafeSVG('20', '20', '0 0 24 24', 'currentColor', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
      const text = createSafeElement('span', '', 'Analizar texto');
      container.appendChild(svg);
      container.appendChild(text);
      button.appendChild(container);
      button.style.background = 'linear-gradient(135deg, #338BFD 0%, #2563eb 100%)';
    }
  }

// Función para crear tooltips CSS
function createTooltipStyles() {
  if (document.getElementById('franbot-tooltip-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'franbot-tooltip-styles';
  style.textContent = `
    .franbot-highlight {
      background-color: rgba(255, 235, 59, 0.3) !important;
      border-bottom: 2px dotted #338BFD !important;
      cursor: pointer !important;
      position: relative !important;
      transition: all 0.2s ease !important;
    }
    
    .franbot-highlight:hover {
      background-color: rgba(255, 235, 59, 0.5) !important;
      border-bottom-color: #2563eb !important;
    }
    
    .franbot-tooltip-trigger {
      cursor: help !important;
      position: relative !important;
      transition: all 0.2s ease !important;
    }
    
    .franbot-tooltip-trigger:hover {
      opacity: 0.8 !important;
    }
    
    .franbot-tooltip {
      position: absolute !important;
      background: #1e293b !important;
      color: white !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
      max-width: 300px !important;
      z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      opacity: 0 !important;
      transform: translateY(10px) !important;
      transition: all 0.2s ease !important;
      pointer-events: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    
    .franbot-tooltip.show {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    
    .franbot-tooltip::before {
      content: '' !important;
      position: absolute !important;
      top: -6px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      border: 6px solid transparent !important;
      border-bottom-color: #1e293b !important;
    }
    
    .franbot-tooltip-title {
      font-weight: 600 !important;
      margin-bottom: 6px !important;
      color: #60a5fa !important;
    }
    
    .franbot-tooltip-original {
      text-decoration: line-through !important;
      color: #f87171 !important;
      margin-bottom: 4px !important;
    }
    
    .franbot-tooltip-suggested {
      color: #34d399 !important;
      font-weight: 500 !important;
      margin-bottom: 8px !important;
    }
    
    .franbot-tooltip-explanation {
      color: #d1d5db !important;
      font-size: 12px !important;
    }
  `;
  document.head.appendChild(style);
}

// Función para marcar texto en el documento
async function highlightTextInDocument(suggestions) {
  console.log('🎯 Marcando texto en el documento...');
  
  // Crear estilos de tooltip si no existen
  createTooltipStyles();
  
  // Limpiar marcas anteriores
  await clearPreviousHighlights();
  
  // Procesar sugerencias de forma secuencial para evitar conflictos de API
  for (const suggestion of suggestions) {
    if (suggestion.originalText && suggestion.originalText.length > 3) {
      await markTextOccurrences(suggestion);
    }
  }
  
  console.log(`✅ Marcado completado para ${suggestions.length} sugerencias`);
}

// Función para limpiar marcas anteriores
async function clearPreviousHighlights() {
  // Limpiar highlights DOM tradicionales
  const existingHighlights = document.querySelectorAll('.franbot-highlight');
  existingHighlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
  
  // Limpiar tooltip triggers (modo híbrido)
  const existingTriggers = document.querySelectorAll('.franbot-tooltip-trigger');
  existingTriggers.forEach(trigger => {
    const parent = trigger.parentNode;
    parent.replaceChild(document.createTextNode(trigger.textContent), trigger);
    parent.normalize();
  });
  
  // Remover tooltips existentes
  const existingTooltips = document.querySelectorAll('.franbot-tooltip');
  existingTooltips.forEach(tooltip => tooltip.remove());
  
  // Si estamos en Google Docs, limpiar también los subrayados rojos de la API
  const isGoogleDocs = window.location.href.includes('docs.google.com/document');
  if (isGoogleDocs && googleDocsAccessToken) {
    console.log('🧹 Limpiando subrayados rojos de Google Docs API...');
    await clearRedUnderlines();
  }
}

// Función para marcar ocurrencias de texto
async function markTextOccurrences(suggestion) {
  const textToFind = suggestion.originalText.trim();
  if (!textToFind) return;
  
  // Verificar si estamos en Google Docs
  const isGoogleDocs = window.location.href.includes('docs.google.com/document');
  
  if (isGoogleDocs) {
    console.log('📄 Detectado Google Docs - usando enfoque híbrido (API + DOM)');
    
    // Intentar autenticarse si no lo hemos hecho
    if (!googleDocsAccessToken) {
      const authSuccess = await authenticateGoogleDocs();
      if (!authSuccess) {
        console.warn('⚠️ No se pudo autenticar con Google Docs API, usando método DOM');
        markTextOccurrencesDOM(suggestion);
        return;
      }
    }
    
    // 1. Aplicar formato visual usando la API (subrayado rojo + fondo)
    const apiSuccess = await applyRedUnderlineToText(textToFind, suggestion.id);
    
    if (apiSuccess) {
      console.log(`✅ Formato aplicado via API para: "${textToFind}"`);
      
      // 2. Aplicar tooltips usando DOM después de un delay
      // (La API no soporta tooltips interactivos, necesitamos DOM para eso)
      setTimeout(() => {
        console.log('🔄 Aplicando tooltips via DOM...');
        markTextOccurrencesDOM(suggestion, true); // true = solo tooltips, no highlighting
      }, 1500); // Esperar a que se aplique el formato de la API
      
      return;
    } else {
      console.warn('⚠️ Falló el formato via API, usando método DOM completo');
      markTextOccurrencesDOM(suggestion, false);
    }
  } else {
    // Para otros sitios web, usar el método DOM tradicional
    markTextOccurrencesDOM(suggestion, false);
  }
}

// Función para marcar ocurrencias usando DOM (método tradicional)
function markTextOccurrencesDOM(suggestion, tooltipOnly = false) {
  const textToFind = suggestion.originalText.trim();
  if (!textToFind) return;
  
  console.log(`🔄 markTextOccurrencesDOM - tooltipOnly: ${tooltipOnly}`);
  
  // Buscar el contenido principal de Google Docs
  let documentContainer = null;
  
  // Intentar diferentes selectores para Google Docs
  const googleDocsSelectors = [
    '.kix-page', // Páginas del documento
    '.kix-lineview', // Vista de líneas
    '.kix-wordhtmlgenerator-word-node', // Nodos de palabras
    '.kix-page-paginated', // Páginas paginadas
    '.kix-zoomdocumentplugin-outer .kix-page', // Páginas en el plugin de zoom
    '.kix-appview-editor-container .kix-page', // Contenedor del editor
    '.docs-texteventtarget-iframe', // iframe del contenido
    '[contenteditable="true"]' // Elementos editables
  ];
  
  // Buscar el contenedor del documento
  for (const selector of googleDocsSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      documentContainer = elements[0];
      console.log(`📄 Encontrado contenedor de Google Docs: ${selector}`);
      break;
    }
  }
  
  // Si no se encuentra un contenedor específico de Google Docs, usar el body como fallback
  if (!documentContainer) {
    documentContainer = document.body;
    console.log('📄 Usando document.body como fallback');
  }
  
  // Buscar en el contenido del documento
  const walker = document.createTreeWalker(
    documentContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Evitar nodos dentro de scripts, estilos, o elementos de la extensión
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Evitar elementos de la extensión
        if (parent.id && parent.id.startsWith('franbot-')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Evitar elementos de la interfaz de Google Docs (toolbar, menús, etc.)
        if (parent.closest('#docs-toolbar-wrapper, #docs-menubar, .docs-material, .goog-menu')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Solo procesar nodos con texto que contenga nuestro texto objetivo
        return node.textContent.toLowerCase().includes(textToFind.toLowerCase()) 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  // Procesar cada nodo de texto encontrado
  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    const lowerText = text.toLowerCase();
    const lowerTarget = textToFind.toLowerCase();
    
    let startIndex = lowerText.indexOf(lowerTarget);
    if (startIndex !== -1) {
      // Crear elementos para reemplazar el texto
      const beforeText = text.substring(0, startIndex);
      const matchedText = text.substring(startIndex, startIndex + textToFind.length);
      const afterText = text.substring(startIndex + textToFind.length);
      
      // Crear el elemento para el texto
      const textSpan = document.createElement('span');
      
      if (tooltipOnly) {
        // Modo tooltip-only: no aplicar highlighting visual, solo eventos
        textSpan.className = 'franbot-tooltip-trigger';
        textSpan.style.cssText = 'cursor: help; position: relative;';
      } else {
        // Modo completo: aplicar highlighting visual
        textSpan.className = 'franbot-highlight';
      }
      
      textSpan.textContent = matchedText;
      textSpan.setAttribute('data-suggestion-id', suggestion.id);
      
      // Agregar eventos de hover para tooltips
      addTooltipEvents(textSpan, suggestion);
      
      // Reemplazar el nodo de texto
      const parent = textNode.parentNode;
      const fragment = document.createDocumentFragment();
      
      if (beforeText) {
        fragment.appendChild(document.createTextNode(beforeText));
      }
      
      fragment.appendChild(textSpan);
      
      if (afterText) {
        fragment.appendChild(document.createTextNode(afterText));
      }
      
      parent.replaceChild(fragment, textNode);
    }
  });
}

// Función para agregar eventos de tooltip
function addTooltipEvents(element, suggestion) {
  let tooltip = null;
  let hoverTimeout = null;
  
  element.addEventListener('mouseenter', function(e) {
    // Limpiar timeout anterior si existe
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Crear tooltip después de un pequeño delay
    hoverTimeout = setTimeout(() => {
      tooltip = createTooltip(suggestion);
      document.body.appendChild(tooltip);
      
      // Posicionar tooltip
      positionTooltip(tooltip, element);
      
      // Mostrar tooltip con animación
      setTimeout(() => {
        tooltip.classList.add('show');
      }, 10);
    }, 300);
  });
  
  element.addEventListener('mouseleave', function(e) {
    // Limpiar timeout si el mouse sale antes del delay
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Ocultar tooltip si existe
    if (tooltip) {
      tooltip.classList.remove('show');
      setTimeout(() => {
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
        tooltip = null;
      }, 200);
    }
  });
}

// Función para crear el tooltip
function createTooltip(suggestion) {
  const tooltip = document.createElement('div');
  tooltip.className = 'franbot-tooltip';
  
  const title = document.createElement('div');
  title.className = 'franbot-tooltip-title';
  title.textContent = suggestion.title || `Sugerencia ${suggestion.type}`;
  
  const original = document.createElement('div');
  original.className = 'franbot-tooltip-original';
  original.textContent = `Original: "${suggestion.originalText}"`;
  
  const suggested = document.createElement('div');
  suggested.className = 'franbot-tooltip-suggested';
  suggested.textContent = `Sugerido: "${suggestion.suggestedText}"`;
  
  const explanation = document.createElement('div');
  explanation.className = 'franbot-tooltip-explanation';
  explanation.textContent = suggestion.explanation;
  
  tooltip.appendChild(title);
  tooltip.appendChild(original);
  tooltip.appendChild(suggested);
  tooltip.appendChild(explanation);
  
  return tooltip;
}

// Función para posicionar el tooltip
function positionTooltip(tooltip, targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Posición inicial: arriba del elemento
  let top = rect.top - tooltipRect.height - 12;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
  // Ajustar si se sale de la pantalla por arriba
  if (top < 10) {
    top = rect.bottom + 12;
    // Cambiar la flecha para que apunte hacia arriba
    tooltip.style.setProperty('--arrow-direction', 'up');
  }
  
  // Ajustar si se sale de la pantalla por los lados
  if (left < 10) {
    left = 10;
  } else if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  
  tooltip.style.position = 'fixed';
  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

// Función para generar sugerencias estructuradas
function generateSuggestions(documentData, analysisResult) {
  console.log('💡 Generando sugerencias estructuradas...');
  
  const suggestions = [
    {
      id: 1,
      type: "mejora_redaccion",
      title: "Mejora de redacción",
      originalText: "El documento presenta información",
      suggestedText: "Además, el documento presenta información valiosa",
      explanation: "Agregar conectores mejora la fluidez del texto",
      category: "estilo"
    },
    {
      id: 2,
      type: "hipervinculo",
      title: "Agregar hipervínculo",
      originalText: "según estudios recientes",
      suggestedText: "según estudios recientes (con enlace)",
      explanation: "Agregar enlaces a fuentes mejora la credibilidad",
      category: "referencias"
    },
    {
      id: 3,
      type: "estructura",
      title: "Mejorar estructura",
      originalText: "Los puntos importantes son:",
      suggestedText: "## Los puntos importantes son:",
      explanation: "Usar encabezados mejora la organización del contenido",
      category: "formato"
    },
    {
      id: 4,
      type: "formato_visual",
      title: "Formato visual",
      originalText: "concepto importante",
      suggestedText: "**concepto importante**",
      explanation: "Resaltar conceptos clave mejora la legibilidad",
      category: "formato"
    }
  ];

  // Si tenemos datos del documento, podemos generar sugerencias más específicas
  if (documentData && documentData.text) {
    const text = documentData.text;
    const wordCount = documentData.wordCount || 0;
    
    // Sugerencias dinámicas basadas en el contenido
    if (wordCount > 500) {
      suggestions.push({
        id: 5,
        type: "longitud",
        title: "📏 Longitud del documento",
        originalText: `Documento de ${wordCount} palabras`,
        suggestedText: "Considerar dividir en secciones más pequeñas",
        explanation: "Documentos largos se benefician de mejor estructura",
        confidence: 0.70,
        category: "estructura",
        backgroundColor: "transparent",
        borderColor: "#9ca3af",
        textColor: "#374151"
      });
    }
    
    // Detectar frases muy largas
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(' ').length > 25);
    
    if (longSentences.length > 0) {
      const firstLongSentence = longSentences[0].trim().substring(0, 50) + "...";
      suggestions.push({
        id: 6,
        type: "oraciones_largas",
        title: "✂️ Simplificar oraciones",
        originalText: firstLongSentence,
        suggestedText: "Dividir en oraciones más cortas",
        explanation: "Oraciones más cortas mejoran la comprensión",
        confidence: 0.82,
        category: "legibilidad",
        backgroundColor: "transparent",
        borderColor: "#9ca3af",
        textColor: "#374151"
      });
    }
  }

  console.log(`✅ Generadas ${suggestions.length} sugerencias estructuradas`);
  return suggestions;
}

// Función para mostrar los resultados en el panel
  function showResults(data, analysis) {
    // Generar sugerencias estructuradas
    const suggestions = generateSuggestions(data, analysis);
    
    // Limpiar el panel y crear contenido de manera segura
    resultsPanel.textContent = '';
    const safePanel = createSafeResultsPanel(suggestions);
    resultsPanel.appendChild(safePanel);

    // Guardar las sugerencias en una variable global para acceso posterior
    window.currentSuggestions = suggestions;
    
    // Marcar el texto en el documento
    highlightTextInDocument(suggestions).catch(error => {
      console.error('Error al marcar texto:', error);
    });
  }

  // Función para expandir/contraer el panel
  function togglePanel() {
    if (!analysisResults) return;
    
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      resultsPanel.style.display = 'block';
      setTimeout(() => {
        resultsPanel.style.transform = 'scale(1) translateY(0)';
        resultsPanel.style.opacity = '1';
      }, 10);
      // Actualizar botón a estado "Cerrar"
      updateButtonState('results', analysisResults);
    } else {
      resultsPanel.style.transform = 'scale(0.8) translateY(20px)';
      resultsPanel.style.opacity = '0';
      setTimeout(() => {
        resultsPanel.style.display = 'none';
      }, 400);
      // Actualizar botón a estado "Ver resultados"
      updateButtonState('results', analysisResults);
    }
  }

  // Efectos hover
  button.addEventListener('mouseenter', () => {
    if (!isExpanded) {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    }
  });

  button.addEventListener('mouseleave', () => {
    if (!isExpanded) {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(51, 139, 253, 0.4)';
    }
  });

  // Evento click principal
  button.addEventListener('click', async () => {
    // Si ya tenemos resultados, alternar el panel
    if (analysisResults) {
      togglePanel();
      return;
    }

    try {
      console.log('🔍 Iniciando análisis del documento con API de Google Docs...');
      
      // Efecto visual de click
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'translateY(-2px)';
      }, 150);
      
      // Cambiar estado a analizando
      updateButtonState('analyzing');
      
      // Mostrar notificación de inicio
      showNotification('🔄 Analizando documento...', 'info');
      
      // Extraer texto usando API de Google Docs
      const pageData = await extractPageTextWithAPI();
      
      if (pageData && !pageData.error) {
        // Llamar a la función de análisis de texto
        console.log('🔬 Iniciando análisis detallado del texto...');
        let analysisResult;
        try {
          analysisResult = analyzeExtractedText(pageData);
          if (analysisResult.success) {
            console.log('✅ Análisis de texto completado exitosamente');
          } else {
            console.warn('⚠️ El análisis de texto reportó problemas:', analysisResult.error);
          }
        } catch (analysisError) {
          console.error('❌ Error durante el análisis de texto:', analysisError);
        }
        
        // Enviar datos al background script para guardar
        chrome.runtime.sendMessage({
          action: 'saveData',
          data: pageData
        });
        
        // Cambiar estado a resultados y mostrar panel
        updateButtonState('results', { data: pageData, analysis: analysisResult });
        showResults(pageData, analysisResult?.analysis);
        
        // Mostrar notificación de éxito
        showNotification('✅ Análisis completado. Haz clic en "Ver resultados" para ver las sugerencias.', 'success');
        
        // Auto-expandir el panel después de un momento
        setTimeout(() => {
          togglePanel();
        }, 1000);
        
      } else {
        console.log('❌ No se pudo extraer texto del documento');
        const errorMsg = pageData?.message || 'No se pudo extraer texto del documento';
        showNotification(`❌ ${errorMsg}`, 'error');
        updateButtonState('default');
      }
    } catch (error) {
      console.error('❌ Error durante el análisis:', error);
      updateButtonState('default');
      
      // Mostrar mensaje específico según el tipo de error
      let errorMessage = '❌ Error durante el análisis: ';
      if (error.message.includes('solo está disponible en Google Docs')) {
        errorMessage += 'Esta funcionalidad solo funciona en documentos de Google Docs.';
      } else if (error.message.includes('inicia sesión')) {
        errorMessage += 'Por favor, inicia sesión en la extensión primero y otorga todos los permisos necesarios.';
      } else if (error.message.includes('permisos')) {
        errorMessage += 'No tienes permisos para acceder a este documento. Verifica que hayas iniciado sesión correctamente y tengas acceso al documento.';
      } else if (error.message.includes('token') || error.message.includes('Token')) {
        errorMessage += 'Problema con la autenticación. Cierra sesión en la extensión y vuelve a iniciar sesión para renovar tus credenciales.';
      } else {
        errorMessage += error.message;
      }
      
      showNotification(errorMessage, 'error');
      
      // Mostrar alerta con instrucciones más detalladas para errores críticos
      if (error.message.includes('token') || error.message.includes('permisos') || error.message.includes('inicia sesión')) {
        alert(`${errorMessage}\n\n💡 Instrucciones para solucionar el problema:\n1. Haz clic en el ícono de la extensión en la barra de herramientas\n2. Si ya estás logueado, cierra sesión primero\n3. Inicia sesión nuevamente para otorgar todos los permisos necesarios\n4. Vuelve a intentar analizar el documento`);
      }
    }
  });

  // Agregar estilos de animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Agregar el contenedor al DOM
  document.body.appendChild(container);
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease;
  `;

  notification.textContent = message;

  // Agregar animación CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remover la notificación después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Inicializar el botón flotante cuando la página esté lista
function initializeFloatingButton() {
  // Verificar que estamos en Google Docs
  if (!window.location.hostname.includes('docs.google.com')) {
    console.log('🚫 Franbot: No estamos en Google Docs, el botón no se mostrará');
    return;
  }

  console.log('🚀 Franbot: Inicializando en Google Docs...');
  
  // Remover botón existente si existe
  const existingButton = document.getElementById('franbot-analyze-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Crear el botón flotante
  createFloatingButton();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFloatingButton);
} else {
  initializeFloatingButton();
}

// También inicializar en cambios de navegación (para SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Verificar si estamos en Google Docs antes de inicializar
    if (window.location.hostname.includes('docs.google.com')) {
      setTimeout(initializeFloatingButton, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Limpiar al descargar la página
window.addEventListener('beforeunload', () => {
  // Limpiar el botón flotante
  const button = document.getElementById('franbot-analyze-button');
  if (button) {
    button.remove();
  }
});

// Funciones para manejar las sugerencias
window.acceptSuggestion = function(suggestionId) {
  console.log(`✅ Sugerencia ${suggestionId} aceptada`);
  
  // Buscar la sugerencia en el JSON estructurado
  const suggestion = window.currentSuggestions?.find(s => s.id == suggestionId);
  
  if (suggestion) {
    console.log('📝 Aplicando sugerencia:', {
      tipo: suggestion.type,
      textoOriginal: suggestion.originalText,
      textoSugerido: suggestion.suggestedText,
      categoria: suggestion.category,
    });
    
    showNotification(`✅ Sugerencia "${suggestion.title}" aplicada al documento`, 'success');
    
    // Remover highlights de esta sugerencia específica
    const highlights = document.querySelectorAll(`[data-suggestion-id="${suggestionId}"]`);
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    
    // Aquí se implementaría la lógica para aplicar la sugerencia al documento
    // Por ejemplo, usando la API de Google Docs para hacer los cambios
    
    // Ocultar la sugerencia aplicada con animación
    const suggestionElement = document.querySelector(`[data-suggestion="${suggestionId}"]`).closest('div[style*="margin-bottom: 16px"]');
    if (suggestionElement) {
      suggestionElement.style.opacity = '0.5';
      suggestionElement.style.transform = 'scale(0.95)';
      suggestionElement.style.transition = 'all 0.3s ease';
      
      // Agregar indicador de aplicada
      const titleElement = suggestionElement.querySelector('div[style*="font-weight: 600"]');
      if (titleElement) {
        const appliedSpan = createSafeElement('span', 'color: #10b981; font-size: 11px;', ' ✓ APLICADA');
        titleElement.appendChild(appliedSpan);
      }
      
      // Deshabilitar botones
      const buttons = suggestionElement.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      });
    }
  } else {
    console.warn(`⚠️ No se encontró la sugerencia con ID ${suggestionId}`);
    showNotification(`⚠️ Error: Sugerencia no encontrada`, 'error');
  }
}

window.rejectSuggestion = function(suggestionId) {
  console.log(`❌ Sugerencia ${suggestionId} rechazada`);
  
  // Buscar la sugerencia en el JSON estructurado
  const suggestion = window.currentSuggestions?.find(s => s.id == suggestionId);
  
  if (suggestion) {
    console.log('🚫 Rechazando sugerencia:', {
      tipo: suggestion.type,
      textoOriginal: suggestion.originalText,
      categoria: suggestion.category
    });
    
    showNotification(`❌ Sugerencia "${suggestion.title}" descartada`, 'info');
    
    // Remover highlights de esta sugerencia específica
    const highlights = document.querySelectorAll(`[data-suggestion-id="${suggestionId}"]`);
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    
    // Ocultar la sugerencia rechazada con animación
    const suggestionElement = document.querySelector(`[data-suggestion="${suggestionId}"]`).closest('div[style*="margin-bottom: 16px"]');
    if (suggestionElement) {
      suggestionElement.style.opacity = '0.3';
      suggestionElement.style.transform = 'scale(0.95)';
      suggestionElement.style.transition = 'all 0.3s ease';
      
      // Agregar indicador de rechazada
      const titleElement = suggestionElement.querySelector('div[style*="font-weight: 600"]');
      if (titleElement) {
        const rejectedSpan = createSafeElement('span', 'color: #ef4444; font-size: 11px;', ' ✕ RECHAZADA');
        titleElement.appendChild(rejectedSpan);
      }
      
      // Deshabilitar botones
      const buttons = suggestionElement.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      });
    }
  } else {
    console.warn(`⚠️ No se encontró la sugerencia con ID ${suggestionId}`);
    showNotification(`⚠️ Error: Sugerencia no encontrada`, 'error');
  }
}

// Función auxiliar para crear elementos DOM de manera segura
const createSafeElement = (tag, styles, content) => {
  const element = document.createElement(tag);
  if (styles) {
    element.style.cssText = styles;
  }
  if (content) {
    element.textContent = content;
  }
  return element;
};

// Función auxiliar para crear SVG de manera segura
const createSafeSVG = (width, height, viewBox, fill, pathData) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', fill);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);

  return svg;
};

// Función de re-análisis (definida antes para evitar problemas de referencia)
window.reAnalyzeText = function() {
  console.log('🔄 Re-analizando texto...');
  
  // Resetear el estado completamente
  const button = document.getElementById('franbot-analyze-button');
  const resultsPanel = document.getElementById('franbot-results-panel');
  
  if (button && resultsPanel) {
    // Resetear variables globales
    window.analysisResults = null;
    window.currentSuggestions = null;
    
    // Limpiar highlights anteriores
    clearPreviousHighlights();
    
    // Ocultar panel con animación
    resultsPanel.style.opacity = '0';
    resultsPanel.style.transform = 'scale(0.8) translateY(20px)';
    resultsPanel.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      resultsPanel.style.display = 'none';
      
      // Resetear el estado del botón a inicial
      button.textContent = '';
      const starSvg = createSafeSVG('24', '24', '0 0 24 24', 'white', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
      button.appendChild(starSvg);
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      button.disabled = false;
      
      // Mostrar notificación de reinicio
      showNotification('🔄 Reiniciando análisis...', 'info');
      
      // Ejecutar el análisis completo después de un breve delay
      setTimeout(async () => {
        try {
          console.log('🔍 Iniciando nuevo análisis del documento...');
          
          // Cambiar estado a analizando
          button.textContent = '';
          const loadingContainer = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
          const spinner = createSafeElement('div', 'width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;');
          const loadingText = createSafeElement('span', 'font-size: 12px;', 'Analizando...');
          loadingContainer.appendChild(spinner);
          loadingContainer.appendChild(loadingText);
          button.appendChild(loadingContainer);
          button.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
          button.disabled = true;
          
          // Mostrar notificación de inicio
          showNotification('🔄 Analizando documento...', 'info');
          
          // Extraer texto usando API de Google Docs
          const pageData = await extractPageTextWithAPI();
          
          if (pageData && !pageData.error) {
            // Llamar a la función de análisis de texto
            console.log('🔬 Iniciando análisis detallado del texto...');
            let analysisResult;
            try {
              analysisResult = analyzeExtractedText(pageData);
              if (analysisResult.success) {
                console.log('✅ Análisis de texto completado exitosamente');
              } else {
                console.warn('⚠️ El análisis de texto reportó problemas:', analysisResult.error);
              }
            } catch (analysisError) {
              console.error('❌ Error durante el análisis de texto:', analysisError);
            }
            
            // Enviar datos al background script para guardar
            chrome.runtime.sendMessage({
              action: 'saveData',
              data: pageData
            });
            
            // Almacenar resultados globalmente
            window.analysisResults = { data: pageData, analysis: analysisResult };
            
            // Cambiar estado del botón a resultados
            button.textContent = '';
            const resultsContainer = createSafeElement('div', 'display: flex; align-items: center; gap: 8px;');
            const checkSvg = createSafeSVG('16', '16', '0 0 24 24', 'white', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
            const resultsText = createSafeElement('span', 'font-size: 12px;', 'Ver Resultados');
            resultsContainer.appendChild(checkSvg);
            resultsContainer.appendChild(resultsText);
            button.appendChild(resultsContainer);
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            button.disabled = false;
            
            // Generar y mostrar resultados
            const suggestions = generateSuggestions(pageData, analysisResult?.analysis);
            window.currentSuggestions = suggestions;
            
            // Crear panel de resultados de manera segura
            resultsPanel.textContent = '';
            const safePanel = createSafeResultsPanel(suggestions);
            resultsPanel.appendChild(safePanel);
            
            // Marcar el texto en el documento
            highlightTextInDocument(suggestions).catch(error => {
              console.error('Error al marcar texto:', error);
            });
            
            // Mostrar notificación de éxito
            showNotification('✅ Re-análisis completado. Nuevas sugerencias disponibles.', 'success');
            
            // Auto-expandir el panel después de un momento
            setTimeout(() => {
              resultsPanel.style.display = 'block';
              setTimeout(() => {
                resultsPanel.style.transform = 'scale(1) translateY(0)';
                resultsPanel.style.opacity = '1';
              }, 10);
            }, 1000);
            
          } else {
            console.log('❌ No se pudo extraer texto del documento');
            const errorMsg = pageData?.message || 'No se pudo extraer texto del documento';
            showNotification(`❌ ${errorMsg}`, 'error');
            
            // Resetear botón a estado inicial
            button.textContent = '';
            const errorStarSvg = createSafeSVG('24', '24', '0 0 24 24', 'white', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
            button.appendChild(errorStarSvg);
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            button.disabled = false;
          }
        } catch (error) {
          console.error('❌ Error durante el re-análisis:', error);
          
          // Resetear botón a estado inicial
          button.textContent = '';
          const catchErrorStarSvg = createSafeSVG('24', '24', '0 0 24 24', 'white', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
          button.appendChild(catchErrorStarSvg);
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          button.disabled = false;
          
          showNotification('❌ Error durante el re-análisis: ' + error.message, 'error');
        }
      }, 500);
      
    }, 300);
  }
}

// Función para crear el panel de resultados de manera segura
function createSafeResultsPanel(suggestions) {
  const mainContainer = createSafeElement('div', 'margin-bottom: 16px;');
  
  // Crear título
  const titleContainer = createSafeElement('h3', 'margin: 0 0 12px 0; color: #1e293b; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;');
  const titleSvg = createSafeSVG('20', '20', '0 0 24 24', '#338BFD', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
  const titleText = createSafeElement('span', '', `Sugerencias (${suggestions.length})`);
  titleContainer.appendChild(titleSvg);
  titleContainer.appendChild(titleText);
  
  // Crear botón re-analizar
  const buttonContainer = createSafeElement('div', 'margin-bottom: 16px; text-align: center;');
  const reanalyzeBtn = createSafeElement('button', 'background: linear-gradient(135deg, #338BFD 0%, #2563eb 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;', '🔄 Re-analizar');
  reanalyzeBtn.id = 'reanalyze-btn';
  reanalyzeBtn.onclick = window.reAnalyzeText;
  buttonContainer.appendChild(reanalyzeBtn);
  
  // Crear contenedor de sugerencias
  const suggestionsContainer = createSafeElement('div', 'background: transparent; border-radius: 12px; padding: 0;');
  
  // Crear cada sugerencia
  suggestions.forEach(suggestion => {
    const suggestionDiv = createSafeElement('div', `margin-bottom: 16px; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb;`);
        
    // Texto de la sugerencia
    const textDiv = createSafeElement('div', 'font-size: 13px; color: #374151; line-height: 1.4; margin-bottom: 6px;');
    const originalSpan = createSafeElement('span', 'text-decoration: line-through; color: #6b7280;', `"${suggestion.originalText}"`);
    const arrowText = createSafeElement('span', '', ' → ');
    const suggestedSpan = createSafeElement('span', 'color: #059669; font-weight: 500;', `"${suggestion.suggestedText}"`);
    textDiv.appendChild(originalSpan);
    textDiv.appendChild(arrowText);
    textDiv.appendChild(suggestedSpan);
    
    // Explicación
    const explanationDiv = createSafeElement('div', 'font-size: 12px; color: #6b7280; margin-bottom: 10px;', suggestion.explanation);
    
    // Botones
    const buttonsDiv = createSafeElement('div', 'display: flex; gap: 8px;');
    
    const acceptBtn = createSafeElement('button', 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;', 'Aceptar');
    acceptBtn.setAttribute('data-suggestion', suggestion.id);
    acceptBtn.onclick = () => window.acceptSuggestion(suggestion.id);
    
    const rejectBtn = createSafeElement('button', 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;', 'Rechazar');
    rejectBtn.setAttribute('data-suggestion', suggestion.id);
    rejectBtn.onclick = () => window.rejectSuggestion(suggestion.id);
    
    buttonsDiv.appendChild(acceptBtn);
    buttonsDiv.appendChild(rejectBtn);
    
    // Ensamblar sugerencia
    suggestionDiv.appendChild(textDiv);
    suggestionDiv.appendChild(explanationDiv);
    suggestionDiv.appendChild(buttonsDiv);
    
    suggestionsContainer.appendChild(suggestionDiv);
  });
  
  // Ensamblar todo
  mainContainer.appendChild(titleContainer);
  mainContainer.appendChild(buttonContainer);
  mainContainer.appendChild(suggestionsContainer);
  
  return mainContainer;
}