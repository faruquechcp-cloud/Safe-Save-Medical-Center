
import ReactDOM from 'react-dom/client';
import App from './App'; 
import ErrorBoundary from './components/ErrorBoundary';
import { generateLicenseKey } from './utils/licenseUtils';


// CSS is now loaded via Vite/PostCSS
import './index.css'; 

// Service Worker registration removed to prevent conflicts with the interactivity watchdog
// and to ensure the latest code is always loaded.

// Expose license generator globally for admin use (Debugging/Setup)
(window as any).generateAppLicense = generateLicenseKey;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
