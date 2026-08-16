import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import theme from './theme.js';
import { AuthProvider } from './hooks/use-auth.jsx';
import { TimerProvider } from './hooks/use-timer.jsx';
import ErrorBoundary from './components/common/error-boundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <TimerProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </TimerProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
