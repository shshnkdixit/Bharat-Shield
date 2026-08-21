import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { installLocalApi } from '@/lib/local-api';

import './index.css';

// Serve the /api/* analysis routes client-side so the app works end-to-end in
// both the static preview and Vercel production without a running API server.
installLocalApi();

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
