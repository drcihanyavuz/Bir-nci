import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './styles/theme.css';

Sentry.init({
  dsn: 'https://2bd70e6e3858d2a5a6b8e7aedbf2c9ba@o4512101822103552.ingest.de.sentry.io/4512101866012752',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
  environment: import.meta.env.MODE,
});

function ErrorFallback() {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Bir şeyler ters gitti</h1>
      <p>Sayfayı yenilemeyi deneyin. Sorun devam ederse bize bildirin.</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
        Sayfayı Yenile
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
