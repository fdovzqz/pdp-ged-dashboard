import { useCallback, useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarRange } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Header, Footer } from '../components/sections';

export const DashboardLayout = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);
    
    try {
      const element = contentRef.current;
      
      // Use html-to-image which is more robust for modern CSS
      const dataUrl = await toPng(element, {
        quality: 1.0,
        backgroundColor: '#020617', // slate-950 forcing solid background
        pixelRatio: 2, // Better resolution
        style: {
          transform: 'none', // Prevent transform issues
        },
        filter: (node) => {
          // Filter out noscript and interactive elements that might cause issues
          const tagName = (node as HTMLElement).tagName;
          return tagName !== 'NOSCRIPT';
        },
      });

      // Create an image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      // Calculate PDF dimensions (A4 landscape for dashboard)
      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (img.height * imgWidth) / img.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add additional pages if content is longer
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`dashboard-pagob-durango-${date}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

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
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <Header onExport={handleExport} onFullscreen={handleFullscreen} isExporting={isExporting} />

        {/* Navigation */}
        <nav className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 backdrop-blur-md w-full sm:w-fit">
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
