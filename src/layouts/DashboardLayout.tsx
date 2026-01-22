import { useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarRange } from 'lucide-react';
import { Header, Footer } from '../components/sections';

export const DashboardLayout = () => {
  const handleExport = useCallback(() => {
    // Future: Implement PDF/CSV export
    console.log('Export functionality coming soon');
  }, []);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 dot-pattern pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <Header onExport={handleExport} onFullscreen={handleFullscreen} />

        {/* Navigation */}
        <nav className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 backdrop-blur-md w-fit">
          <NavLink to="/" className={navLinkClass} end>
            <LayoutDashboard size={18} />
            Análisis Enero
          </NavLink>
          <NavLink to="/annual" className={navLinkClass}>
            <CalendarRange size={18} />
            Histórico Anual
          </NavLink>
        </nav>

        {/* Page Content */}
        <main>
            <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
