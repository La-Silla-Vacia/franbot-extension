import React from 'react';

const ErrorBanner = ({ error, onClearError }) => {
  if (!error) return null;

  return (
    <div className="error-banner">
      <div className="error-content">
        <svg viewBox="0 0 24 24" fill="currentColor" className="error-icon">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
        <span>{error}</span>
      </div>
      <button onClick={onClearError} className="error-close">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>
      </button>
    </div>
  );
};

export default ErrorBanner;