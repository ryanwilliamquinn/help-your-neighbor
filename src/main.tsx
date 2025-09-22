import { createRoot } from 'react-dom/client';
import './index.css';
import App from './components/App.tsx';
import { AuthProvider } from './contexts';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
