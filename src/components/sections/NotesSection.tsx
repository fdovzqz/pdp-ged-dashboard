import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface NotesSectionProps {
  month?: number;
  monthName?: string;
}

const ACCENT_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  violet: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/30 text-violet-400',
    text: 'text-violet-400',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/30 text-emerald-400',
    text: 'text-emerald-400',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/30 text-cyan-400',
    text: 'text-cyan-400',
  },
};

export const NotesSection = ({ month = 1, monthName = 'Enero' }: NotesSectionProps) => {
  const notes = useQuery(api.queries.getAnalysisNotes);
  const lastAvailableDay = useQuery(api.queries.getLastAvailableDay, { month });

  if (notes === undefined || lastAvailableDay === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="bg-linear-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm rounded-3xl border border-slate-600/30 p-6"
      >
        <div className="flex items-center justify-center min-h-[100px]">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        </div>
      </motion.div>
    );
  }

  const interpolateContent = (content: string): string => {
    return content
      .replace(/\{lastAvailableDay\}/g, String(lastAvailableDay))
      .replace(/\{monthName\}/g, monthName);
  };

  const getDisplayContent = (content: string): string => interpolateContent(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45 }}
      className="bg-linear-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-6 min-w-0 overflow-hidden col-span-full"
    >
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 font-display">
        <AlertTriangle size={18} className="text-amber-400" />
        Notas Importantes para el Análisis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {notes.map((note) => {
          const styles = ACCENT_STYLES[note.accentColor] ?? ACCENT_STYLES.cyan;
          return (
            <div
              key={note.id}
              className={`${styles.bg} border ${styles.border} rounded-xl p-5 min-w-0`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`${styles.badge} p-2 rounded-lg shrink-0`}>
                  {note.yearLabel ? (
                    <span className={`text-sm font-bold ${styles.text}`}>{note.yearLabel}</span>
                  ) : (
                    <CheckCircle size={16} className={styles.text} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {getDisplayContent(note.content)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
