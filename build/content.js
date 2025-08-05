// Content script para el botón flotante de análisis de texto
(function() {
    'use strict';

    // Verificar si ya se ha inicializado para evitar duplicados
    if (window.franBotAnalyzerInitialized) {
        return;
    }
    window.franBotAnalyzerInitialized = true;

    // Cargar Tailwind CSS desde CDN
    function loadTailwindCSS() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
        script.onload = function() {
            console.log('Tailwind CSS cargado correctamente');
            initializeFloatingButton();
        };
        script.onerror = function() {
            console.error('Error al cargar Tailwind CSS');
            // Inicializar de todos modos con estilos básicos
            initializeFloatingButton();
        };
        document.head.appendChild(script);
    }

    // Crear el botón flotante y el panel
    function initializeFloatingButton() {
        // Crear contenedor principal
        const container = document.createElement('div');
        container.id = 'franbot-analyzer-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        `;

        // Crear botón flotante
        const floatingButton = document.createElement('button');
        floatingButton.id = 'franbot-floating-btn';
        floatingButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 min-w-max';
        floatingButton.style.cssText = `
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-radius: 9999px;
            font-weight: 500;
            color: white;
            transition: all 0.3s ease;
            min-width: max-content;
            order: 2;
        `;

        // Icono de dos estrellas (magia)
        const magicIcon = document.createElement('span');
        magicIcon.innerHTML = '✨';
        magicIcon.style.fontSize = '16px';

        // Label del botón
        const buttonLabel = document.createElement('span');
        buttonLabel.textContent = 'Analizar texto';
        buttonLabel.style.fontSize = '14px';

        // Icono de cerrar (inicialmente oculto)
        const closeIcon = document.createElement('span');
        closeIcon.innerHTML = '✕';
        closeIcon.style.cssText = `
            font-size: 16px;
            display: none;
            font-weight: bold;
        `;

        floatingButton.appendChild(magicIcon);
        floatingButton.appendChild(buttonLabel);
        floatingButton.appendChild(closeIcon);

        // Crear panel de análisis
        const analysisPanel = document.createElement('div');
        analysisPanel.id = 'franbot-analysis-panel';
        analysisPanel.className = 'bg-white rounded-lg shadow-xl border border-gray-200 p-6 mb-4 hidden';
        analysisPanel.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin-bottom: 16px;
            display: none;
            width: 380px;
            max-width: 95vw;
            order: 1;
            max-height: 70vh;
            overflow-y: auto;
            overflow-x: hidden;
        `;

        // Contenido del panel
        const panelContent = document.createElement('div');
        panelContent.className = 'text-center';

        // Spinner de carga
        const spinner = document.createElement('div');
        spinner.className = 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4';
        spinner.style.cssText = `
            display: inline-block;
            width: 32px;
            height: 32px;
            border: 2px solid #e5e7eb;
            border-bottom-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        `;

        // Texto del panel
        const panelText = document.createElement('p');
        panelText.className = 'text-gray-700 font-medium';
        panelText.textContent = 'Analizando el texto de la página...';
        panelText.style.cssText = `
            color: #374151;
            font-weight: 500;
            margin: 0;
            font-size: 14px;
        `;

        // Texto secundario
        const panelSubtext = document.createElement('p');
        panelSubtext.className = 'text-gray-500 text-sm mt-2';
        panelSubtext.textContent = 'Por favor espera mientras procesamos el contenido';
        panelSubtext.style.cssText = `
            color: #6b7280;
            font-size: 12px;
            margin-top: 8px;
            margin-bottom: 0;
        `;

        panelContent.appendChild(spinner);
        panelContent.appendChild(panelText);
        panelContent.appendChild(panelSubtext);
        analysisPanel.appendChild(panelContent);

        // Agregar elementos al contenedor (panel primero para que aparezca arriba)
        container.appendChild(analysisPanel);
        container.appendChild(floatingButton);

        // Agregar al DOM
        document.body.appendChild(container);

        // Agregar animación de spin para el spinner
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            #franbot-floating-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
            }
            
            #franbot-analysis-panel {
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        // Estado del botón
        let isAnalyzing = false;

        // Función para alternar el estado
        function toggleAnalysis() {
            isAnalyzing = !isAnalyzing;

            if (isAnalyzing) {
                // Mostrar panel y cambiar botón a "cerrar"
                analysisPanel.style.display = 'block';
                magicIcon.style.display = 'none';
                buttonLabel.textContent = 'Cerrar';
                closeIcon.style.display = 'inline';
                floatingButton.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                
                // Iniciar análisis real
                startRealAnalysis();
                
            } else {
                // Ocultar panel y restaurar botón original
                analysisPanel.style.display = 'none';
                magicIcon.style.display = 'inline';
                buttonLabel.textContent = 'Analizar texto';
                closeIcon.style.display = 'none';
                floatingButton.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                
                // Resetear el panel para la próxima vez
                setTimeout(() => {
                    panelText.textContent = 'Analizando el texto de la página...';
                    panelSubtext.textContent = 'Por favor espera mientras procesamos el contenido';
                    spinner.style.display = 'inline-block';
                }, 300);
            }
        }

        // Estados de ejecución
        const EXECUTION_STATES = {
            IDLE: 'idle',
            DETECTING: 'detecting',
            EXTRACTING_TEXT: 'extracting_text',
            ANALYZING_TEXT: 'analyzing_text',
            ANALYZING_CORRECTIONS: 'analyzing_corrections',
            SEARCHING_NAMES: 'searching_names',
            PROCESSING_RESULTS: 'processing_results',
            COMPLETED: 'completed',
            ERROR: 'error'
        };

        // Estado actual
        let currentState = EXECUTION_STATES.IDLE;
        let stepStartTime = null;
        let timerInterval = null;
        
        // Control de acordeones - solo uno puede estar abierto a la vez
        let currentOpenAccordion = null;

        // Función para actualizar el estado y mostrar feedback
        function updateExecutionState(state, message = '', details = '') {
            currentState = state;
            console.log(`🔄 Estado: ${state} - ${message}`);
            
            const stateConfig = {
                [EXECUTION_STATES.DETECTING]: {
                    icon: '🔍',
                    title: 'Detectando tipo de documento',
                    subtitle: 'Verificando si es Google Docs o página web...',
                    color: '#3b82f6'
                },
                [EXECUTION_STATES.EXTRACTING_TEXT]: {
                    icon: '📄',
                    title: 'Extrayendo texto',
                    subtitle: message || 'Obteniendo contenido del documento...',
                    color: '#8b5cf6'
                },
                [EXECUTION_STATES.ANALYZING_TEXT]: {
                    icon: '🤖',
                    title: 'Analizando texto',
                    subtitle: message || 'Procesando contenido con IA...',
                    color: '#f59e0b'
                },
                [EXECUTION_STATES.ANALYZING_CORRECTIONS]: {
                    icon: '✏️',
                    title: 'Analizando correcciones',
                    subtitle: message || 'Revisando ortografía, gramática y estilo...',
                    color: '#8b5cf6'
                },
                [EXECUTION_STATES.SEARCHING_NAMES]: {
                    icon: '🔎',
                    title: 'Buscando nombres',
                    subtitle: message || 'Identificando personas en La Silla Vacía...',
                    color: '#10b981'
                },
                [EXECUTION_STATES.PROCESSING_RESULTS]: {
                    icon: '⚙️',
                    title: 'Procesando resultados',
                    subtitle: message || 'Organizando sugerencias de enlaces...',
                    color: '#6366f1'
                },
                [EXECUTION_STATES.COMPLETED]: {
                    icon: '✅',
                    title: 'Análisis completado',
                    subtitle: message || 'Proceso finalizado exitosamente',
                    color: '#059669'
                },
                [EXECUTION_STATES.ERROR]: {
                    icon: '❌',
                    title: 'Error en el proceso',
                    subtitle: message || 'Ha ocurrido un error inesperado',
                    color: '#dc2626'
                }
            };

            // Iniciar cronómetro para estados en progreso
            if (state !== EXECUTION_STATES.COMPLETED && state !== EXECUTION_STATES.ERROR && state !== EXECUTION_STATES.IDLE) {
                stepStartTime = Date.now();
                startTimer();
            } else {
                stopTimer();
            }

            const config = stateConfig[state];
            if (config) {
                showExecutionFeedback(config.icon, config.title, config.subtitle, config.color, details);
            }
        }
        
        // Función para iniciar el cronómetro
        function startTimer() {
            stopTimer(); // Detener cualquier cronómetro anterior
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        // Función para detener el cronómetro
        function stopTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
        
        // Función para actualizar el cronómetro
        function updateTimer() {
            if (stepStartTime && currentState !== EXECUTION_STATES.COMPLETED && currentState !== EXECUTION_STATES.ERROR) {
                const elapsed = Math.floor((Date.now() - stepStartTime) / 1000);
                updateTimerDisplay(elapsed);
            }
        }
        
        // Función para actualizar la visualización del cronómetro
        function updateTimerDisplay(elapsedSeconds) {
            const timerElement = document.querySelector('.step-timer');
            if (timerElement) {
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                const timeString = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
                timerElement.textContent = `⏱️ ${timeString}`;
            }
        }

        // Función para mostrar feedback de ejecución
        function showExecutionFeedback(icon, title, subtitle, color, details = '') {
            panelContent.innerHTML = '';
            
            const feedbackContainer = document.createElement('div');
            feedbackContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                text-align: center;
            `;
            
            // Indicador de progreso numérico (solo para estados en progreso)
            if (currentState !== EXECUTION_STATES.COMPLETED && currentState !== EXECUTION_STATES.ERROR && currentState !== EXECUTION_STATES.IDLE) {
                const progressSteps = {
                    [EXECUTION_STATES.DETECTING]: { 
                        current: 1, 
                        total: 6, 
                        label: 'Detectando',
                        estimatedTime: '1-2 seg',
                        description: 'Verificando documento activo'
                    },
                    [EXECUTION_STATES.EXTRACTING_TEXT]: { 
                        current: 2, 
                        total: 6, 
                        label: 'Extrayendo',
                        estimatedTime: '2-5 seg',
                        description: 'Obteniendo texto del documento'
                    },
                    [EXECUTION_STATES.ANALYZING_TEXT]: { 
                        current: 3, 
                        total: 6, 
                        label: 'Analizando',
                        estimatedTime: '3-8 seg',
                        description: 'Procesando contenido con IA'
                    },
                    [EXECUTION_STATES.ANALYZING_CORRECTIONS]: { 
                        current: 4, 
                        total: 6, 
                        label: 'Correcciones',
                        estimatedTime: '3-6 seg',
                        description: 'Analizando ortografía y gramática'
                    },
                    [EXECUTION_STATES.SEARCHING_NAMES]: { 
                        current: 5, 
                        total: 6, 
                        label: 'Buscando',
                        estimatedTime: '5-10 seg',
                        description: 'Identificando nombres y referencias'
                    },
                    [EXECUTION_STATES.PROCESSING_RESULTS]: { 
                        current: 6, 
                        total: 6, 
                        label: 'Procesando',
                        estimatedTime: '1-2 seg',
                        description: 'Preparando resultados'
                    }
                };
                
                const stepInfo = progressSteps[currentState];
                if (stepInfo) {
                    const progressIndicator = document.createElement('div');
                    progressIndicator.style.cssText = `
                        background: ${color}20;
                        color: ${color};
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        border: 1px solid ${color}40;
                        text-align: center;
                    `;
                    progressIndicator.innerHTML = `
                        <div style="font-weight: 700; margin-bottom: 2px;">
                            Paso ${stepInfo.current} de ${stepInfo.total}: ${stepInfo.label}
                        </div>
                        <div style="font-size: 10px; opacity: 0.8; font-weight: 400;">
                            ${stepInfo.description} • ${stepInfo.estimatedTime}
                        </div>
                        <div class="step-timer" style="font-size: 10px; margin-top: 4px; opacity: 0.7; font-weight: 500;">
                            ⏱️ 0s
                        </div>
                    `;
                    feedbackContainer.appendChild(progressIndicator);
                    
                    // Barra de progreso visual
                    const progressBarContainer = document.createElement('div');
                    progressBarContainer.style.cssText = `
                        width: 100%;
                        height: 4px;
                        background: #e5e7eb;
                        border-radius: 2px;
                        margin-bottom: 16px;
                        overflow: hidden;
                    `;
                    
                    const progressBar = document.createElement('div');
                    const progressPercentage = (stepInfo.current / stepInfo.total) * 100;
                    progressBar.style.cssText = `
                        width: ${progressPercentage}%;
                        height: 100%;
                        background: linear-gradient(90deg, ${color}, ${color}80);
                        border-radius: 2px;
                        transition: width 0.3s ease;
                    `;
                    
                    progressBarContainer.appendChild(progressBar);
                    feedbackContainer.appendChild(progressBarContainer);
                }
            }
            
            // Icono animado
            const iconElement = document.createElement('div');
            iconElement.innerHTML = icon;
            iconElement.style.cssText = `
                font-size: 48px;
                margin-bottom: 16px;
                animation: ${currentState === EXECUTION_STATES.COMPLETED || currentState === EXECUTION_STATES.ERROR ? 'none' : 'pulse 2s infinite'};
            `;
            
            // Título
            const titleElement = document.createElement('div');
            titleElement.textContent = title;
            titleElement.style.cssText = `
                font-weight: 600;
                color: ${color};
                font-size: 16px;
                margin-bottom: 8px;
            `;
            
            // Subtítulo
            const subtitleElement = document.createElement('div');
            subtitleElement.textContent = subtitle;
            subtitleElement.style.cssText = `
                color: #6b7280;
                font-size: 12px;
                line-height: 1.4;
                margin-bottom: ${details ? '12px' : '0'};
            `;
            
            feedbackContainer.appendChild(iconElement);
            feedbackContainer.appendChild(titleElement);
            feedbackContainer.appendChild(subtitleElement);
            
            // Detalles adicionales si los hay
            if (details) {
                const detailsElement = document.createElement('div');
                detailsElement.textContent = details;
                detailsElement.style.cssText = `
                    background: #f3f4f6;
                    color: #374151;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-family: monospace;
                    max-width: 100%;
                    word-break: break-all;
                `;
                feedbackContainer.appendChild(detailsElement);
            }
            
            // Barra de progreso animada para estados en progreso
            if (currentState !== EXECUTION_STATES.COMPLETED && currentState !== EXECUTION_STATES.ERROR) {
                const progressBar = document.createElement('div');
                progressBar.style.cssText = `
                    width: 100%;
                    height: 3px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    margin-top: 16px;
                    overflow: hidden;
                `;
                
                const progressFill = document.createElement('div');
                progressFill.style.cssText = `
                    height: 100%;
                    background: ${color};
                    border-radius: 2px;
                    animation: progress 2s ease-in-out infinite;
                `;
                
                progressBar.appendChild(progressFill);
                feedbackContainer.appendChild(progressBar);
            }
            
            panelContent.appendChild(feedbackContainer);
            
            // Agregar estilos de animación si no existen
            if (!document.getElementById('execution-animations')) {
                const style = document.createElement('style');
                style.id = 'execution-animations';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    @keyframes progress {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        // Función para iniciar el análisis real con manejo de estados
        function startRealAnalysis() {
            console.log('🚀 Iniciando análisis del texto de la página...');
            
            // Estado 1: Detectando tipo de documento
            updateExecutionState(EXECUTION_STATES.DETECTING);
            
            setTimeout(() => {
                // Detectar si estamos en Google Docs
                const documentId = extractGoogleDocId();
                
                if (documentId) {
                    // Estado 2: Extrayendo texto de Google Doc
                    updateExecutionState(EXECUTION_STATES.EXTRACTING_TEXT, 'Conectando con Google Docs API...');
                    
                    console.log('📄 Documento de Google detectado, ID:', documentId);
                    
                    // Enviar mensaje al background script para obtener el texto
                    chrome.runtime.sendMessage({
                        action: 'getGoogleDocText',
                        documentId: documentId
                    }, (response) => {
                        if (response && response.success) {
                            console.log('✅ Análisis completado exitosamente');
                            console.log('📄 Contenido del documento:', response.documentText);
                            
                            // Estado 3: Analizando texto
                            updateExecutionState(
                                EXECUTION_STATES.ANALYZING_TEXT, 
                                'Procesando documento con IA...',
                                `${response.documentText?.length || 0} caracteres extraídos`
                            );
                            
                            if (response.analysis) {
                                // Estado 4: Analizando correcciones
                                updateExecutionState(
                                    EXECUTION_STATES.ANALYZING_CORRECTIONS, 
                                    'Analizando ortografía y gramática...',
                                    'Procesando texto con IA de correcciones'
                                );
                                
                                // Realizar análisis de correcciones automáticamente
                                performCorrectionsAnalysis(response.documentText).then(correctionsData => {
                                    // Guardar los datos de correcciones para mostrar después
                                    window.franbot_corrections_data = correctionsData;
                                    
                                    setTimeout(() => {
                                        // Estado 5: Buscando nombres
                                        updateExecutionState(
                                            EXECUTION_STATES.SEARCHING_NAMES, 
                                            'Identificando personas en La Silla Vacía...',
                                            `${response.analysis.data?.busquedas_realizadas?.length || 0} nombres detectados`
                                        );
                                        
                                        setTimeout(() => {
                                            // Estado 6: Procesando resultados
                                            const searchesWithResults = response.analysis.data?.busquedas_realizadas?.filter(
                                                search => search.output.total_coincidencias > 0
                                            ).length || 0;
                                            
                                            updateExecutionState(
                                                EXECUTION_STATES.PROCESSING_RESULTS,
                                                'Organizando sugerencias de enlaces...',
                                                `${searchesWithResults} coincidencias encontradas`
                                            );
                                            
                                            setTimeout(() => {
                                                console.log('🔍 Análisis de nombres:', response.analysis);
                                                updateExecutionState(EXECUTION_STATES.COMPLETED);
                                                setTimeout(() => showAnalysisResults(response.analysis), 500);
                                            }, 800);
                                        }, 1200);
                                    }, 1000);
                                }).catch(error => {
                                    console.error('Error en análisis de correcciones:', error);
                                    // Continuar con el flujo normal aunque falle el análisis de correcciones
                                    setTimeout(() => {
                                        // Estado 5: Buscando nombres
                                        updateExecutionState(
                                            EXECUTION_STATES.SEARCHING_NAMES, 
                                            'Identificando personas en La Silla Vacía...',
                                            `${response.analysis.data?.busquedas_realizadas?.length || 0} nombres detectados`
                                        );
                                        
                                        setTimeout(() => {
                                            // Estado 6: Procesando resultados
                                            const searchesWithResults = response.analysis.data?.busquedas_realizadas?.filter(
                                                search => search.output.total_coincidencias > 0
                                            ).length || 0;
                                            
                                            updateExecutionState(
                                                EXECUTION_STATES.PROCESSING_RESULTS,
                                                'Organizando sugerencias de enlaces...',
                                                `${searchesWithResults} coincidencias encontradas`
                                            );
                                            
                                            setTimeout(() => {
                                                console.log('🔍 Análisis de nombres:', response.analysis);
                                                updateExecutionState(EXECUTION_STATES.COMPLETED);
                                                setTimeout(() => showAnalysisResults(response.analysis), 500);
                                            }, 800);
                                        }, 1200);
                                    }, 1000);
                                });
                            } else {
                                updateExecutionState(EXECUTION_STATES.COMPLETED, 'Texto extraído correctamente');
                            }
                            
                        } else {
                            console.error('❌ Error al obtener texto:', response?.error || 'Error desconocido');
                            
                            // Proporcionar mensaje de error específico según el paso
                            let errorMessage = response?.error || 'Error al obtener el texto del documento';
                            let errorDetails = '';
                            
                            if (response?.step) {
                                switch (response.step) {
                                    case 'authentication':
                                        errorMessage = 'Error de autenticación';
                                        errorDetails = 'Verifica que hayas iniciado sesión en la extensión';
                                        break;
                                    case 'textExtraction':
                                        errorMessage = 'Error al extraer texto del documento';
                                        errorDetails = 'Verifica que tengas permisos para acceder al documento';
                                        break;
                                    case 'aiAnalysis':
                                        errorMessage = 'Error en el análisis de IA';
                                        errorDetails = 'Problema con el servicio de análisis de nombres';
                                        break;
                                    default:
                                        errorDetails = 'Error en proceso desconocido';
                                }
                            }
                            
                            updateExecutionState(EXECUTION_STATES.ERROR, errorMessage, errorDetails);
                        }
                    });
                    
                } else {
                    // Estado 2: Extrayendo texto de página web
                    updateExecutionState(EXECUTION_STATES.EXTRACTING_TEXT, 'Analizando contenido de la página...');
                    
                    setTimeout(() => {
                        const pageText = extractPageText();
                        console.log('📄 Texto extraído de la página:', pageText);
                        
                        // Estado 3: Analizando texto
                        updateExecutionState(
                            EXECUTION_STATES.ANALYZING_TEXT, 
                            'Procesando contenido de la página...',
                            `${pageText.length} caracteres extraídos`
                        );
                        
                        setTimeout(() => {
                            // Estado 4: Analizando correcciones
                            updateExecutionState(
                                EXECUTION_STATES.ANALYZING_CORRECTIONS, 
                                'Analizando ortografía y gramática...',
                                'Procesando texto con IA de correcciones'
                            );
                            
                            // Realizar análisis de correcciones automáticamente
                            performCorrectionsAnalysis(pageText).then(correctionsData => {
                                // Guardar los datos de correcciones para mostrar después
                                window.franbot_corrections_data = correctionsData;
                                
                                setTimeout(() => {
                                    updateExecutionState(EXECUTION_STATES.COMPLETED, 'Página web analizada correctamente');
                                    setTimeout(() => showAnalysisResults({ data: { busquedas_realizadas: [] } }), 500);
                                }, 1000);
                            }).catch(error => {
                                console.error('Error en análisis de correcciones:', error);
                                // Continuar con el flujo normal aunque falle el análisis de correcciones
                                setTimeout(() => {
                                    updateExecutionState(EXECUTION_STATES.COMPLETED, 'Página web analizada correctamente');
                                    setTimeout(() => showAnalysisResults({ data: { busquedas_realizadas: [] } }), 500);
                                }, 1000);
                            });
                        }, 1500);
                    }, 800);
                }
            }, 600);
        }

        // Función para extraer el ID del documento de Google Docs
        function extractGoogleDocId() {
            const url = window.location.href;
            
            // Verificar si estamos en Google Docs
            if (url.includes('docs.google.com/document')) {
                // Extraer el ID del documento de la URL
                const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    console.log('📄 Documento de Google Docs detectado:', match[1]);
                    return match[1];
                }
            }
            
            console.log('ℹ️ No se detectó un documento de Google Docs');
            return null;
        }

        // Función para extraer texto de la página web actual
        function extractPageText() {
            // Obtener todo el texto visible de la página
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, article, section');
            let pageText = '';
            
            textElements.forEach(element => {
                const text = element.textContent?.trim();
                if (text && text.length > 10) { // Filtrar textos muy cortos
                    pageText += text + '\n';
                }
            });
            
            // Limpiar y limitar el texto
            pageText = pageText.replace(/\n\s*\n/g, '\n').trim();
            
            // Limitar a los primeros 5000 caracteres para evitar textos muy largos
            if (pageText.length > 5000) {
                pageText = pageText.substring(0, 5000) + '...';
            }
            
            return pageText || 'No se pudo extraer texto de la página';
        }

        // Función para realizar análisis automático de correcciones
        async function performCorrectionsAnalysis(text) {
            try {
                console.log('🔍 Iniciando análisis automático de correcciones...');
                
                const response = await fetch('https://worker-ai-prompts-execute-franbot.lasillavacia-com-account9262.workers.dev/analyze-text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Análisis de correcciones completado:', data);
                
                return data;
            } catch (error) {
                console.error('❌ Error en análisis de correcciones:', error);
                throw error;
            }
        }

        // Función para mostrar los resultados del análisis
        function showAnalysisResults(analysis) {
            // Limpiar el contenido anterior
            panelContent.innerHTML = '';
            
            // Crear header del panel
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 2px solid #e5e7eb;
            `;
            
            const successIcon = document.createElement('div');
            successIcon.innerHTML = '✅';
            successIcon.style.cssText = 'font-size: 24px; margin-right: 8px;';
            
            const headerText = document.createElement('div');
            headerText.innerHTML = `
                <div style="font-weight: 600; color: #1f2937; font-size: 16px;">Análisis Completado</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">
                    ${analysis.data.busquedas_realizadas.length} nombres analizados
                </div>
            `;
            
            header.appendChild(successIcon);
            header.appendChild(headerText);
            panelContent.appendChild(header);
            
            // Filtrar búsquedas con resultados
            const searchesWithResults = analysis.data.busquedas_realizadas.filter(
                search => search.output.total_coincidencias > 0
            );
            
            // Siempre crear el acordeón de Links Sugeridos
            const accordion = createAccordion('Links Sugeridos', searchesWithResults.length, searchesWithResults);
            panelContent.appendChild(accordion);
            
            // Crear acordeón para las correcciones sugeridas
            const correctionsAccordion = createCorrectionsAccordion();
            panelContent.appendChild(correctionsAccordion);
            
            panelContent.appendChild(actionButton);
        }

        // Función para crear un acordeón
        function createAccordion(title, count, searchesWithResults) {
            const accordionContainer = document.createElement('div');
            accordionContainer.style.cssText = `
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 12px;
                overflow: hidden;
                background: white;
            `;
            
            // Header del acordeón (clickeable)
            const accordionHeader = document.createElement('div');
            accordionHeader.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #e2e8f0;
            `;
            
            const headerLeft = document.createElement('div');
            headerLeft.style.cssText = `
                display: flex;
                align-items: center;
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
            `;
            headerLeft.innerHTML = `
                <span style="margin-right: 8px;">🔗</span>
                ${title}
                <span style="
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    margin-left: 8px;
                ">${count}</span>
            `;
            
            const chevron = document.createElement('div');
            chevron.style.cssText = `
                font-size: 12px;
                color: #6b7280;
                transition: transform 0.2s ease;
                transform: rotate(0deg);
            `;
            chevron.innerHTML = '▼';
            
            accordionHeader.appendChild(headerLeft);
            accordionHeader.appendChild(chevron);
            
            // Contenido del acordeón (inicialmente oculto)
            const accordionContent = document.createElement('div');
            accordionContent.style.cssText = `
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: white;
            `;
            
            const contentInner = document.createElement('div');
            contentInner.style.cssText = `
                max-height: 250px;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 16px;
                scrollbar-width: thin;
                scrollbar-color: #cbd5e1 #f1f5f9;
                word-wrap: break-word;
                word-break: break-word;
            `;
            
            // Agregar estilos de scrollbar para webkit (Chrome, Safari)
            const scrollbarStyle = document.createElement('style');
            scrollbarStyle.textContent = `
                .accordion-content::-webkit-scrollbar {
                    width: 6px;
                }
                .accordion-content::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                .accordion-content::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .accordion-content::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `;
            document.head.appendChild(scrollbarStyle);
            contentInner.classList.add('accordion-content');
            
            // Agregar items de resultados al contenido o mensaje de no resultados
            if (searchesWithResults.length === 0) {
                // No hay resultados - mostrar mensaje dentro del acordeón
                const noResults = document.createElement('div');
                noResults.style.cssText = `
                    text-align: center;
                    padding: 20px;
                    color: #6b7280;
                    font-size: 14px;
                `;
                noResults.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
                    <div style="font-weight: 500; margin-bottom: 4px;">No se encontraron coincidencias</div>
                    <div>Los nombres analizados no tienen información disponible en La Silla Vacía</div>
                `;
                contentInner.appendChild(noResults);
            } else {
                // Agregar items de resultados
                searchesWithResults.forEach((search, index) => {
                    const resultItem = createResultItem(search, index);
                    resultItem.style.marginBottom = index < searchesWithResults.length - 1 ? '12px' : '0';
                    contentInner.appendChild(resultItem);
                });
            }
            
            accordionContent.appendChild(contentInner);
            
            // Estado del acordeón
            let isExpanded = false; // Inicialmente colapsado
            const accordionId = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;
            
            // Función para expandir este acordeón
            function expandAccordion() {
                isExpanded = true;
                currentOpenAccordion = accordionId;
                
                // Calcular altura máxima considerando el scroll interno
                const maxContentHeight = 250; // altura máxima del contenido con scroll
                const padding = 32; // padding total (16px arriba + 16px abajo)
                const actualContentHeight = contentInner.scrollHeight;
                const finalHeight = Math.min(actualContentHeight + padding, maxContentHeight + padding);
                
                accordionContent.style.maxHeight = finalHeight + 'px';
                chevron.style.transform = 'rotate(0deg)';
                accordionHeader.style.background = '#f8fafc';
            }
            
            // Función para colapsar este acordeón
            function collapseAccordion() {
                isExpanded = false;
                accordionContent.style.maxHeight = '0';
                chevron.style.transform = 'rotate(-90deg)';
                accordionHeader.style.background = '#f1f5f9';
            }
            
            // Función para toggle del acordeón
            function toggleAccordion() {
                if (isExpanded) {
                    // Si está expandido, colapsarlo
                    collapseAccordion();
                    currentOpenAccordion = null;
                } else {
                    // Si hay otro acordeón abierto, cerrarlo primero
                    if (currentOpenAccordion && currentOpenAccordion !== accordionId) {
                        const openAccordion = document.querySelector(`[data-accordion-id="${currentOpenAccordion}"]`);
                        if (openAccordion && openAccordion.collapseFunction) {
                            openAccordion.collapseFunction();
                        }
                    }
                    // Expandir este acordeón
                    expandAccordion();
                }
            }
            
            // Agregar ID y funciones al contenedor para control externo
            accordionContainer.setAttribute('data-accordion-id', accordionId);
            accordionContainer.collapseFunction = collapseAccordion;
            accordionContainer.expandFunction = expandAccordion;
            
            // Inicializar como expandido solo si es el primer acordeón (Links Sugeridos)
            if (title === 'Links Sugeridos') {
                setTimeout(() => {
                    expandAccordion();
                }, 100);
            } else {
                // Inicializar colapsado
                collapseAccordion();
            }
            
            // Event listeners
            accordionHeader.addEventListener('click', toggleAccordion);
            
            accordionHeader.addEventListener('mouseenter', () => {
                if (!isExpanded) {
                    accordionHeader.style.background = '#e2e8f0';
                }
            });
            
            accordionHeader.addEventListener('mouseleave', () => {
                accordionHeader.style.background = isExpanded ? '#f8fafc' : '#f1f5f9';
            });
            
            // Ensamblar el acordeón
            accordionContainer.appendChild(accordionHeader);
            accordionContainer.appendChild(accordionContent);
            
            return accordionContainer;
        }

        // Función para crear un item de resultado
        function createResultItem(search, index) {
            const item = document.createElement('div');
            item.style.cssText = `
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;
            
            // Obtener el primer resultado (el más relevante)
            const firstResult = search.output.resultados[0];
            
            item.innerHTML = `
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1f2937; font-size: 13px; margin-bottom: 4px;">
                            ${search.input.nombre}
                        </div>
                        <div style="color: #6b7280; font-size: 11px;">
                            ${search.output.total_coincidencias} coincidencia${search.output.total_coincidencias > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">
                        ${firstResult.relevance === 'exact_match' ? 'Exacta' : 'Parcial'}
                    </div>
                </div>
                <div style="background: white; border-radius: 6px; padding: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <div style="font-weight: 500; color: #374151; font-size: 12px; margin-bottom: 4px;">
                        ${firstResult.title}
                    </div>
                    <div style="color: #6b7280; font-size: 10px; margin-bottom: 6px;">
                        ${new Date(firstResult.date).toLocaleDateString('es-ES')}
                    </div>
                    <a href="${firstResult.link}" target="_blank" style="
                        color: #2563eb;
                        text-decoration: none;
                        font-size: 11px;
                        display: inline-flex;
                        align-items: center;
                    ">
                        Ver en La Silla Vacía
                        <span style="margin-left: 4px;">↗</span>
                    </a>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="accept-link-btn" data-search-index="${index}" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        transition: all 0.2s ease;
                    ">
                        <span>✓</span>
                        Aceptar
                    </button>
                    <div class="link-status" style="
                        font-size: 10px;
                        color: #6b7280;
                        display: none;
                    "></div>
                </div>
            `;
            
            // Event listener para el botón de aceptar
            const acceptBtn = item.querySelector('.accept-link-btn');
            const statusDiv = item.querySelector('.link-status');
            
            acceptBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await applySingleLink(search, acceptBtn, statusDiv);
            });
            
            // Hover effect para el botón
            acceptBtn.addEventListener('mouseenter', () => {
                acceptBtn.style.background = '#059669';
                acceptBtn.style.transform = 'translateY(-1px)';
            });
            
            acceptBtn.addEventListener('mouseleave', () => {
                acceptBtn.style.background = '#10b981';
                acceptBtn.style.transform = 'translateY(0)';
            });
            
            // Hover effect para el item
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = '#3b82f6';
                item.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = '#e2e8f0';
                item.style.boxShadow = 'none';
            });
            
            return item;
        }

        // Función para crear el acordeón de correcciones sugeridas
        function createCorrectionsAccordion() {
            const accordionContainer = document.createElement('div');
            accordionContainer.style.cssText = `
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 12px;
                overflow: hidden;
                background: white;
            `;
            
            // Verificar si ya tenemos datos de correcciones
            const correctionsData = window.franbot_corrections_data;
            const hasCorrections = correctionsData && correctionsData.status === 'ok';
            const totalCorrections = hasCorrections ? (correctionsData.data?.estadisticas?.total_errores || correctionsData.data?.resumen?.total_errores || 0) : 0;
            
            // Header del acordeón (clickeable)
            const accordionHeader = document.createElement('div');
            accordionHeader.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #e2e8f0;
            `;
            
            const headerLeft = document.createElement('div');
            headerLeft.style.cssText = `
                display: flex;
                align-items: center;
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
            `;
            headerLeft.innerHTML = `
                <span style="margin-right: 8px;">✏️</span>
                Correcciones Sugeridas
                <span id="corrections-count" style="
                    background: ${totalCorrections > 0 ? '#fef3c7' : '#dbeafe'};
                    color: ${totalCorrections > 0 ? '#d97706' : '#1e40af'};
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    margin-left: 8px;
                    display: ${hasCorrections ? 'inline' : 'none'};
                ">${totalCorrections}</span>
            `;
            
            const chevron = document.createElement('div');
            chevron.style.cssText = `
                font-size: 12px;
                color: #6b7280;
                transition: transform 0.2s ease;
                transform: rotate(${hasCorrections ? '0deg' : '-90deg'});
            `;
            chevron.innerHTML = '▼';
            
            accordionHeader.appendChild(headerLeft);
            accordionHeader.appendChild(chevron);
            
            // Contenido del acordeón
            const accordionContent = document.createElement('div');
            accordionContent.style.cssText = `
                max-height: ${hasCorrections ? '400px' : '0'};
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: white;
            `;
            
            const contentInner = document.createElement('div');
            contentInner.style.cssText = `
                max-height: 300px;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 16px;
                scrollbar-width: thin;
                scrollbar-color: #cbd5e1 #f1f5f9;
                word-wrap: break-word;
                word-break: break-word;
            `;
            contentInner.classList.add('accordion-content');
            
            // Mostrar contenido según si tenemos correcciones o no
            if (hasCorrections) {
                // Mostrar las correcciones automáticamente
                displayCorrections(contentInner, correctionsData.data);
            } else {
                // Mostrar mensaje de que no hay correcciones o error
                const noCorrectionsContent = document.createElement('div');
                noCorrectionsContent.style.cssText = `
                    text-align: center;
                    padding: 20px;
                `;
                
                if (window.franbot_corrections_data === null) {
                    // No se ejecutó el análisis
                    noCorrectionsContent.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 32px;">📝</span>
                        </div>
                        <div style="font-weight: 500; color: #374151; margin-bottom: 8px;">
                            Análisis no disponible
                        </div>
                        <div style="color: #6b7280; font-size: 12px;">
                            El análisis de correcciones no se pudo completar
                        </div>
                    `;
                } else if (window.franbot_corrections_data && window.franbot_corrections_data.status !== 'ok') {
                    // Error en el análisis
                    noCorrectionsContent.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 32px;">❌</span>
                        </div>
                        <div style="font-weight: 500; color: #dc2626; margin-bottom: 8px;">
                            Error en el análisis
                        </div>
                        <div style="color: #6b7280; font-size: 12px;">
                            ${window.franbot_corrections_data.message || 'Error desconocido'}
                        </div>
                    `;
                } else {
                    // Sin correcciones
                    noCorrectionsContent.innerHTML = `
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 32px;">✅</span>
                        </div>
                        <div style="font-weight: 500; color: #059669; margin-bottom: 8px;">
                            ¡Excelente!
                        </div>
                        <div style="color: #6b7280; font-size: 12px;">
                            No se encontraron correcciones necesarias
                        </div>
                    `;
                }
                
                contentInner.appendChild(noCorrectionsContent);
            }
            
            accordionContent.appendChild(contentInner);
            
            // Estado del acordeón
            let isExpanded = false; // Inicialmente colapsado
            const accordionId = 'accordion-correcciones-sugeridas';
            
            // Función para expandir este acordeón
            function expandAccordion() {
                isExpanded = true;
                currentOpenAccordion = accordionId;
                
                const maxContentHeight = 300; // altura máxima del contenido con scroll
                const padding = 32;
                const actualContentHeight = contentInner.scrollHeight;
                const finalHeight = Math.min(actualContentHeight + padding, maxContentHeight + padding);
                
                accordionContent.style.maxHeight = finalHeight + 'px';
                chevron.style.transform = 'rotate(0deg)';
                accordionHeader.style.background = '#f8fafc';
            }
            
            // Función para colapsar este acordeón
            function collapseAccordion() {
                isExpanded = false;
                accordionContent.style.maxHeight = '0';
                chevron.style.transform = 'rotate(-90deg)';
                accordionHeader.style.background = '#f1f5f9';
            }
            
            // Función para toggle del acordeón
            function toggleAccordion() {
                if (isExpanded) {
                    // Si está expandido, colapsarlo
                    collapseAccordion();
                    currentOpenAccordion = null;
                } else {
                    // Si hay otro acordeón abierto, cerrarlo primero
                    if (currentOpenAccordion && currentOpenAccordion !== accordionId) {
                        const openAccordion = document.querySelector(`[data-accordion-id="${currentOpenAccordion}"]`);
                        if (openAccordion && openAccordion.collapseFunction) {
                            openAccordion.collapseFunction();
                        }
                    }
                    // Expandir este acordeón
                    expandAccordion();
                }
            }
            
            // Agregar ID y funciones al contenedor para control externo
            accordionContainer.setAttribute('data-accordion-id', accordionId);
            accordionContainer.collapseFunction = collapseAccordion;
            accordionContainer.expandFunction = expandAccordion;
            
            // Inicializar colapsado
            collapseAccordion();
            
            // Event listeners
            accordionHeader.addEventListener('click', toggleAccordion);
            
            accordionHeader.addEventListener('mouseenter', () => {
                if (!isExpanded) {
                    accordionHeader.style.background = '#e2e8f0';
                }
            });
            
            accordionHeader.addEventListener('mouseleave', () => {
                accordionHeader.style.background = isExpanded ? '#f8fafc' : '#f1f5f9';
            });
            
            // Ensamblar el acordeón
            accordionContainer.appendChild(accordionHeader);
            accordionContainer.appendChild(accordionContent);
            
            return accordionContainer;
        }
        
        // Función para cargar las correcciones

        
        // Función para mostrar las correcciones
        function displayCorrections(container, data) {
            container.innerHTML = '';
            
            // Crear pestañas para diferentes tipos de correcciones
            const tabsContainer = document.createElement('div');
            tabsContainer.style.cssText = `
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 16px;
            `;
            
            const tabs = [
                { id: 'all', label: 'Todas', icon: '📝' },
                { id: 'ortografia', label: 'Ortografía', icon: '✏️' },
                { id: 'gramatica', label: 'Gramática', icon: '📍' },
                { id: 'estilo', label: 'Estilo', icon: '🎨' }
            ];
            
            let activeTab = 'all';
            
            tabs.forEach(tab => {
                const tabButton = document.createElement('button');
                tabButton.style.cssText = `
                    background: none;
                    border: none;
                    padding: 8px 12px;
                    margin-right: 4px;
                    border-radius: 4px 4px 0 0;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    ${activeTab === tab.id ? 'background: #f3f4f6; border-bottom: 2px solid #3b82f6; font-weight: 600;' : 'color: #6b7280;'}
                `;
                tabButton.innerHTML = `${tab.icon} ${tab.label}`;
                tabButton.addEventListener('click', () => {
                    activeTab = tab.id;
                    updateTabsAndContent();
                });
                tabsContainer.appendChild(tabButton);
            });
            
            container.appendChild(tabsContainer);
            
            // Contenedor para las correcciones
            const correctionsContainer = document.createElement('div');
            container.appendChild(correctionsContainer);
            
            function updateTabsAndContent() {
                // Actualizar pestañas
                tabsContainer.querySelectorAll('button').forEach((btn, index) => {
                    const isActive = tabs[index].id === activeTab;
                    btn.style.background = isActive ? '#f3f4f6' : 'none';
                    btn.style.borderBottom = isActive ? '2px solid #3b82f6' : 'none';
                    btn.style.fontWeight = isActive ? '600' : 'normal';
                    btn.style.color = isActive ? '#1f2937' : '#6b7280';
                });
                
                // Filtrar correcciones usando la nueva estructura
                let filteredCorrections = data.errores || [];
                if (activeTab !== 'all') {
                    filteredCorrections = (data.errores || []).filter(corr => corr.tipo === activeTab);
                }
                
                // Mostrar correcciones
                displayCorrectionsList(correctionsContainer, filteredCorrections, data);
            }
            
            // Mostrar contenido inicial
            updateTabsAndContent();
        }
        
        // Función para mostrar la lista de correcciones
        function displayCorrectionsList(container, corrections, fullData) {
            container.innerHTML = '';
            
            if (corrections.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <div style="font-size: 24px; margin-bottom: 8px;">✨</div>
                        <div>No hay correcciones de este tipo</div>
                    </div>
                `;
                return;
            }
            
            // Mostrar resumen y estadísticas generales

            
            // Mostrar cada corrección
            corrections.forEach((correction, index) => {
                const correctionItem = createCorrectionItem(correction, index);
                container.appendChild(correctionItem);
            });
            

        }
        
        // Función para crear un item de corrección
        function createCorrectionItem(correction, index) {
            const item = document.createElement('div');
            item.style.cssText = `
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;
            
            // Determinar color según el tipo
            const typeColors = {
                'ortografia': { bg: '#fef3c7', text: '#d97706', icon: '✏️' },
                'gramatica': { bg: '#dbeafe', text: '#1e40af', icon: '📍' },
                'estilo': { bg: '#f3e8ff', text: '#7c3aed', icon: '🎨' }
            };
            
            const typeStyle = typeColors[correction.tipo] || typeColors['ortografia'];
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="
                        background: ${typeStyle.bg};
                        color: ${typeStyle.text};
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        ${typeStyle.icon} ${correction.tipo.charAt(0).toUpperCase() + correction.tipo.slice(1)}
                    </div>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Fragmento original:</div>
                    <div style="
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 4px;
                        padding: 6px;
                        font-size: 11px;
                        color: #dc2626;
                        font-family: monospace;
                    ">
                        ${correction.fragmento}
                    </div>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Corrección:</div>
                    <div style="
                        background: #f0fdf4;
                        border: 1px solid #bbf7d0;
                        border-radius: 4px;
                        padding: 6px;
                        font-size: 11px;
                        color: #166534;
                        font-family: monospace;
                    ">
                        ${correction.correccion}
                    </div>
                </div>
                
                <div style="
                    background: #f8fafc;
                    border-radius: 4px;
                    padding: 8px;
                    font-size: 10px;
                    color: #374151;
                    line-height: 1.4;
                    margin-bottom: 12px;
                ">
                    <strong>Explicación:</strong> ${correction.explicacion}
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="apply-correction-btn" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span>✓</span> Aplicar
                    </button>
                    <button class="ignore-correction-btn" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span>✕</span> Ignorar
                    </button>
                </div>
            `;
            
            // Obtener los botones
            const applyBtn = item.querySelector('.apply-correction-btn');
            const ignoreBtn = item.querySelector('.ignore-correction-btn');
            
            // Event listeners para los botones
            applyBtn.addEventListener('click', () => applyCorrectionToDocument(correction, applyBtn, ignoreBtn, item));
            ignoreBtn.addEventListener('click', () => ignoreCorrection(correction, applyBtn, ignoreBtn, item));
            
            // Hover effects para los botones
            applyBtn.addEventListener('mouseenter', () => {
                applyBtn.style.background = '#059669';
            });
            applyBtn.addEventListener('mouseleave', () => {
                if (!applyBtn.disabled) {
                    applyBtn.style.background = '#10b981';
                }
            });
            
            ignoreBtn.addEventListener('mouseenter', () => {
                ignoreBtn.style.background = '#4b5563';
            });
            ignoreBtn.addEventListener('mouseleave', () => {
                if (!ignoreBtn.disabled) {
                    ignoreBtn.style.background = '#6b7280';
                }
            });
            
            // Hover effect para el item
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = '#3b82f6';
                item.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.borderColor = '#e2e8f0';
                item.style.boxShadow = 'none';
            });
            
            return item;
        }

        // Función para aplicar una corrección al documento
        async function applyCorrectionToDocument(correction, applyBtn, ignoreBtn, item) {
            try {
                console.log('🔧 Aplicando corrección:', correction);
                
                // Verificar si estamos en Google Docs
                const documentId = extractGoogleDocId();
                if (!documentId) {
                    throw new Error('Esta función solo está disponible en documentos de Google Docs');
                }
                
                // Cambiar estado del botón a "procesando"
                applyBtn.disabled = true;
                ignoreBtn.disabled = true;
                applyBtn.style.background = '#6b7280';
                applyBtn.innerHTML = '<span>⏳</span> Aplicando...';
                
                // Enviar solicitud al background script para aplicar la corrección
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        action: 'applyCorrectionToDocument',
                        data: {
                            textToFind: correction.fragmento,
                            replacement: correction.correccion,
                            documentId: documentId
                        }
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                if (response.success) {
                    // Éxito
                    applyBtn.style.background = '#059669';
                    applyBtn.innerHTML = '<span>✅</span> Aplicado';
                    
                    // Agregar indicador visual de éxito
                    item.style.background = '#f0fdf4';
                    item.style.borderColor = '#bbf7d0';
                    
                    console.log('✅ Corrección aplicada exitosamente');
                } else {
                    throw new Error(response.error || 'Error desconocido');
                }
                
            } catch (error) {
                console.error('❌ Error al aplicar corrección:', error);
                
                // Verificar si es un error de permisos
                if (error.message.includes('permission') || error.message.includes('insufficient authentication scopes')) {
                    applyBtn.disabled = false;
                    ignoreBtn.disabled = false;
                    applyBtn.style.background = '#f59e0b';
                    applyBtn.innerHTML = '<span>🔑</span> Renovar';
                    
                    // Cambiar el comportamiento del botón para renovar autenticación
                    applyBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await window.renewAuthentication();
                    };
                } else {
                    // Otros errores
                    applyBtn.disabled = false;
                    ignoreBtn.disabled = false;
                    applyBtn.style.background = '#dc2626';
                    applyBtn.innerHTML = '<span>❌</span> Error';
                    
                    // Mostrar mensaje de error
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = `
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 4px;
                        padding: 6px;
                        margin-top: 8px;
                        font-size: 10px;
                        color: #dc2626;
                    `;
                    errorMsg.textContent = `Error: ${error.message}`;
                    item.appendChild(errorMsg);
                    
                    // Restaurar botón después de 3 segundos
                    setTimeout(() => {
                        applyBtn.style.background = '#10b981';
                        applyBtn.innerHTML = '<span>✓</span> Aplicar';
                        if (errorMsg.parentNode) {
                            errorMsg.parentNode.removeChild(errorMsg);
                        }
                    }, 3000);
                }
            }
        }

        // Función para ignorar una corrección
        function ignoreCorrection(correction, applyBtn, ignoreBtn, item) {
            console.log('🚫 Ignorando corrección:', correction);
            
            // Deshabilitar botones
            applyBtn.disabled = true;
            ignoreBtn.disabled = true;
            
            // Cambiar estado visual
            ignoreBtn.style.background = '#4b5563';
            ignoreBtn.innerHTML = '<span>✓</span> Ignorado';
            applyBtn.style.background = '#d1d5db';
            applyBtn.style.color = '#9ca3af';
            
            // Agregar indicador visual de ignorado
            item.style.background = '#f9fafb';
            item.style.borderColor = '#d1d5db';
            item.style.opacity = '0.7';
            
            // Agregar mensaje de ignorado
            const ignoredMsg = document.createElement('div');
            ignoredMsg.style.cssText = `
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                padding: 6px;
                margin-top: 8px;
                font-size: 10px;
                color: #6b7280;
                text-align: center;
            `;
            ignoredMsg.innerHTML = '<span>ℹ️</span> Corrección ignorada';
            item.appendChild(ignoredMsg);
        }

        // Función para renovar autenticación (disponible globalmente)
        window.renewAuthentication = async function() {
            try {
                console.log('🔄 Iniciando renovación de autenticación...');
                
                // Primero, forzar la eliminación del token actual
                console.log('🗑️ Eliminando token actual para forzar nueva autenticación...');
                await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: 'clearAuthToken'
                    }, () => {
                        console.log('✅ Token eliminado');
                        resolve();
                    });
                });
                
                // Mostrar mensaje al usuario
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #3b82f6;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10001;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>🔄</span>
                        <span>Token eliminado. Abriendo extensión para nueva autenticación...</span>
                    </div>
                `;
                document.body.appendChild(notification);
                
                // Abrir la extensión para renovar autenticación
                // Esto abrirá el popup de la extensión donde el usuario puede renovar
                chrome.runtime.sendMessage({
                    action: 'openExtensionPopup'
                });
                
                // Remover notificación después de 5 segundos
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 5000);
                
                // Mostrar instrucciones adicionales
                setTimeout(() => {
                    const instructionNotification = document.createElement('div');
                    instructionNotification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #f59e0b;
                        color: white;
                        padding: 12px 16px;
                        border-radius: 8px;
                        font-size: 14px;
                        z-index: 10001;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        max-width: 300px;
                    `;
                    instructionNotification.innerHTML = `
                        <div style="margin-bottom: 8px;">
                            <strong>📋 Instrucciones:</strong>
                        </div>
                        <div style="font-size: 12px; line-height: 1.4;">
                            1. Haz clic en el ícono de Franbot en la barra de herramientas<br>
                            2. Cierra sesión y vuelve a iniciar sesión<br>
                            3. Autoriza los nuevos permisos<br>
                            4. Vuelve a intentar aplicar el enlace
                        </div>
                    `;
                    document.body.appendChild(instructionNotification);
                    
                    // Remover después de 10 segundos
                    setTimeout(() => {
                        if (instructionNotification.parentNode) {
                            instructionNotification.parentNode.removeChild(instructionNotification);
                        }
                    }, 10000);
                }, 1000);
                
            } catch (error) {
                 console.error('❌ Error al renovar autenticación:', error);
             }
         };

        // Función para aplicar un enlace individual
        async function applySingleLink(search, button, statusDiv) {
            try {
                // Cambiar estado del botón a "procesando"
                button.disabled = true;
                button.style.background = '#6b7280';
                button.innerHTML = '<span>⏳</span> Aplicando...';
                
                // Mostrar estado
                statusDiv.style.display = 'block';
                statusDiv.textContent = 'Aplicando enlace...';
                statusDiv.style.color = '#6b7280';
                
                // Obtener datos del enlace
                const nombreOriginal = search.input.nombre;
                const enlaceDestino = search.output.resultados[0].link;
                
                console.log(`🔗 Aplicando enlace para "${nombreOriginal}" -> ${enlaceDestino}`);
                
                // Enviar solicitud al background script para aplicar el enlace
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        action: 'applyLinkToDocument',
                        data: {
                            textToFind: nombreOriginal,
                            linkUrl: enlaceDestino,
                            documentId: extractGoogleDocId()
                        }
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                if (response.success) {
                    // Éxito
                    button.style.background = '#059669';
                    button.innerHTML = '<span>✅</span> Aplicado';
                    statusDiv.textContent = 'Enlace aplicado correctamente';
                    statusDiv.style.color = '#059669';
                    
                    console.log('✅ Enlace aplicado exitosamente');
                } else {
                    throw new Error(response.error || 'Error desconocido');
                }
                
            } catch (error) {
                console.error('❌ Error al aplicar enlace:', error);
                
                // Verificar si es un error de permisos
                if (error.message.includes('permission') || error.message.includes('insufficient authentication scopes')) {
                    button.disabled = false;
                    button.style.background = '#f59e0b';
                    button.innerHTML = '<span>🔑</span> Renovar';
                    statusDiv.innerHTML = `
                        <div style="color: #f59e0b; margin-bottom: 4px;">
                            Permisos insuficientes
                        </div>
                        <button onclick="renewAuthentication()" style="
                            background: #f59e0b;
                            color: white;
                            border: none;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-size: 9px;
                            cursor: pointer;
                        ">
                            Renovar permisos
                        </button>
                    `;
                    statusDiv.style.color = '#f59e0b';
                    
                    // Cambiar el comportamiento del botón para renovar autenticación
                     button.onclick = async (e) => {
                         e.stopPropagation();
                         await window.renewAuthentication();
                     };
                } else {
                    // Otros errores
                    button.disabled = false;
                    button.style.background = '#dc2626';
                    button.innerHTML = '<span>❌</span> Error';
                    statusDiv.textContent = `Error: ${error.message}`;
                    statusDiv.style.color = '#dc2626';
                    
                    // Restaurar botón después de 3 segundos
                    setTimeout(() => {
                        button.style.background = '#10b981';
                        button.innerHTML = '<span>✓</span> Aceptar';
                        statusDiv.style.display = 'none';
                    }, 3000);
                }
            }
        }

        // Función para aplicar las sugerencias de enlaces
        function applyLinkSuggestions(searchesWithResults) {
            console.log('🔗 Aplicando sugerencias de enlaces:', searchesWithResults);
            
            // Aquí puedes implementar la lógica para aplicar los enlaces al documento
            // Por ejemplo, reemplazar los nombres en el texto con enlaces
            
            // Mostrar confirmación
            panelContent.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                        ¡Enlaces aplicados!
                    </div>
                    <div style="color: #6b7280; font-size: 12px;">
                        Se han sugerido ${searchesWithResults.length} enlaces para el documento
                    </div>
                </div>
            `;
            
            // Cerrar automáticamente después de 2 segundos
            setTimeout(() => {
                toggleAnalysis();
            }, 2000);
        }

        // Agregar event listener al botón
        floatingButton.addEventListener('click', toggleAnalysis);

        // Prevenir que el botón interfiera con la página
        floatingButton.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        container.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        console.log('Botón flotante de FranBot inicializado correctamente');
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTailwindCSS);
    } else {
        loadTailwindCSS();
    }

})();