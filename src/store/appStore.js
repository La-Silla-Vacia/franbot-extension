import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      // Estado de la aplicación
      currentTab: null,
      chatHistory: [],
      isProcessing: false,
      settings: {
        theme: 'light',
        language: 'es',
        autoAnalyze: true,
        notifications: true,
      },

      // Acciones para tabs
      setCurrentTab: (tab) => set({ currentTab: tab }),
      
      getCurrentTabInfo: async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          set({ currentTab: tab });
          return tab;
        } catch (error) {
          console.error('Error getting current tab:', error);
          return null;
        }
      },

      // Acciones para chat
      addMessage: (message) => {
        const newMessage = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...message
        };
        set(state => ({
          chatHistory: [...state.chatHistory, newMessage]
        }));
      },

      clearChatHistory: () => set({ chatHistory: [] }),

      updateLastMessage: (messageId, updates) => {
        set(state => ({
          chatHistory: state.chatHistory.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        }));
      },

      // Acciones para procesamiento
      setProcessing: (isProcessing) => set({ isProcessing }),

      // Acciones para configuración
      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      resetSettings: () => {
        set({
          settings: {
            theme: 'light',
            language: 'es',
            autoAnalyze: true,
            notifications: true,
          }
        });
      },

      // Análisis de contenido web
      analyzeCurrentPage: async () => {
        set({ isProcessing: true });
        
        try {
          const tab = await get().getCurrentTabInfo();
          
          if (!tab) {
            throw new Error('No se pudo obtener información de la pestaña actual');
          }

          // Ejecutar script de contenido para extraer información
          const results = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractPageContent'
          });

          const analysisMessage = {
            type: 'analysis',
            sender: 'system',
            content: {
              url: tab.url,
              title: tab.title,
              ...results
            }
          };

          get().addMessage(analysisMessage);
          
          set({ isProcessing: false });
          return analysisMessage;
        } catch (error) {
          console.error('Error analyzing page:', error);
          set({ isProcessing: false });
          
          const errorMessage = {
            type: 'error',
            sender: 'system',
            content: {
              error: error.message
            }
          };
          
          get().addMessage(errorMessage);
          return errorMessage;
        }
      },

      // Utilidades
      exportChatHistory: () => {
        const { chatHistory } = get();
        const dataStr = JSON.stringify(chatHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `franbot-chat-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
      },

      importChatHistory: (jsonData) => {
        try {
          const history = JSON.parse(jsonData);
          set({ chatHistory: history });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'franbot-app-storage',
      partialize: (state) => ({
        chatHistory: state.chatHistory,
        settings: state.settings,
      }),
    }
  )
);

export default useAppStore;