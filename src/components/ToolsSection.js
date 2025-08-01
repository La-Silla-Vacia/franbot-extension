import React from 'react';

const ToolsSection = ({ 
  isAuthenticated, 
  isProcessing, 
  onAnalyzePage 
}) => {
  const tools = [
    {
      id: 'analyze',
      title: 'Analizar Página',
      description: 'Analiza el contenido de la página actual',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>
      ),
      action: onAnalyzePage,
      disabled: !isAuthenticated || isProcessing,
      buttonText: isProcessing ? 'Analizando...' : 'Analizar'
    }
  ];

  return (
    <div className="tools-section">
      <div className="tools-grid">
        {tools.map(tool => (
          <div key={tool.id} className="tool-card">
            <div className="tool-icon">
              {tool.icon}
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <button 
              onClick={tool.action}
              disabled={tool.disabled}
              className="tool-btn"
            >
              {tool.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsSection;