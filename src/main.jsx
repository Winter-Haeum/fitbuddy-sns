import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { FontScaleProvider } from './hooks/use-font-scale.jsx';
import { AuthProvider } from './hooks/use-auth.jsx';
import { TimerProvider } from './hooks/use-timer.jsx';
import ErrorBoundary from './components/common/error-boundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <FontScaleProvider>
        <AuthProvider>
          <TimerProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </TimerProvider>
        </AuthProvider>
      </FontScaleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
