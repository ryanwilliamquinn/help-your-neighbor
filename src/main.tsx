import { createRoot } from 'react-dom/client';
import './index.css';
import App from './components/App.tsx';
import { AuthProvider } from './contexts';

// Validate critical environment variables
function validateAppEnvironment(): void {
  const requiredVars = {
    VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      // eslint-disable-next-line no-console
      console.error(`Missing required environment variable: ${key}`);
      throw new Error(`Environment configuration error: ${key} is required`);
    }
  }

  // Validate VITE_USE_MOCK_API value
  if (!['true', 'false'].includes(requiredVars.VITE_USE_MOCK_API)) {
    // eslint-disable-next-line no-console
    console.error('VITE_USE_MOCK_API must be either "true" or "false"');
    throw new Error('Invalid VITE_USE_MOCK_API configuration');
  }

  // eslint-disable-next-line no-console
  console.log(
    `A Cup of Sugar starting in ${requiredVars.VITE_USE_MOCK_API === 'true' ? 'mock' : 'production'} mode`
  );
}

// Validate environment before starting the app
try {
  validateAppEnvironment();
} catch (error) {
  // Display error to user if environment is misconfigured
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fee;
    color: #c33;
    padding: 20px;
    border: 1px solid #fcc;
    border-radius: 8px;
    max-width: 500px;
    text-align: center;
    font-family: system-ui, sans-serif;
    z-index: 9999;
  `;
  errorDiv.innerHTML = `
    <h2>Configuration Error</h2>
    <p>${error instanceof Error ? error.message : 'Unknown configuration error'}</p>
    <p>Please check your environment variables and reload the page.</p>
  `;
  document.body.appendChild(errorDiv);
  throw error;
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
