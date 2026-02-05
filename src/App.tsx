import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import { DashboardLayout } from './layouts/DashboardLayout';
import './index.css';

// Lazy load pages for better initial bundle size
const JanuaryDashboard = lazy(() => import('./pages/JanuaryDashboard').then(m => ({ default: m.JanuaryDashboard })));
const AnnualDashboard = lazy(() => import('./pages/AnnualDashboard').then(m => ({ default: m.AnnualDashboard })));
const CurrentMonthDashboard = lazy(() => import('./pages/CurrentMonthDashboard').then(m => ({ default: m.CurrentMonthDashboard })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Cargando...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <CurrentMonthDashboard />
            </Suspense>
          } />
          <Route path="enero" element={
            <Suspense fallback={<PageLoader />}>
              <JanuaryDashboard />
            </Suspense>
          } />
          <Route path="annual" element={
            <Suspense fallback={<PageLoader />}>
              <AnnualDashboard />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
