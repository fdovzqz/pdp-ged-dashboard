import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import { DashboardLayout } from './layouts/DashboardLayout';
import { JanuaryDashboard } from './pages/JanuaryDashboard';
import { AnnualDashboard } from './pages/AnnualDashboard';
import './index.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<JanuaryDashboard />} />
          <Route path="annual" element={<AnnualDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
