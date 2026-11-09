import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import { MobileTopBar, MobileTabBar } from './components/layout/MobileBar';
import CgpaView from './components/cgpa/CgpaView';
import TuitionView from './components/tuition/TuitionView';
import RoutineView from './components/routine/RoutineView';
import AdvisorView from './components/advisor/AdvisorView';
import CommuteView from './components/commute/CommuteView';
import CoverPageView from './components/coverpage/CoverPageView';
import CommandPalette from './components/ui/CommandPalette';
import { DEMO_TRANSCRIPT_COURSES, exportCSV } from './utils/cgpaUtils';
import { handleKonamiKey } from './utils/easterEggs';

const STORAGE_COURSES = 'ez_uiu_courses';
const STORAGE_SETTINGS = 'ez_uiu_settings';

export function AppContent() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('cgpa');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [ucamModalTrigger, setUcamModalTrigger] = useState(false);

  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COURSES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEMO_TRANSCRIPT_COURSES;
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      dept: 'regular',
      programCredits: 138,
      tuitionPerCredit: 6500,
      perTrimesterFee: 6500,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COURSES, JSON.stringify(courses));
    } catch {}
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, 1-6 tab navigation, / search, Konami Code)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      // Secret Konami Code Easter Egg (↑ ↑ ↓ ↓ ← → ← → B A)
      handleKonamiKey(e.key, () => {
        showToast('🎮 KONAMI CHEAT CODE ACTIVATED: 30 Extra Lives Granted! Summa Cum Laude achieved!', 'success');
      });

      if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (!isInput) {
        if (e.key === '1') setActiveTab('cgpa');
        else if (e.key === '2') setActiveTab('advisor');
        else if (e.key === '3') setActiveTab('routine');
        else if (e.key === '4') setActiveTab('tuition');
        else if (e.key === '5') setActiveTab('commute');
        else if (e.key === '6') setActiveTab('coverpage');
        else if (e.key === '/') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddCourse = useCallback((newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
  }, []);

  const handleLoadDemo = useCallback(() => {
    setCourses(DEMO_TRANSCRIPT_COURSES);
  }, []);

  const handleExportCSV = useCallback(() => {
    exportCSV(courses);
  }, [courses]);

  return (
    <div className="min-h-dvh bg-base text-ink antialiased">
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />
      <MobileTopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pl-[calc(228px+2rem)] lg:pr-8 lg:pt-8">
        <div key={activeTab} className="pop-in">
          {activeTab === 'cgpa' && (
            <CgpaView
              courses={courses}
              setCourses={setCourses}
              settings={settings}
              setSettings={setSettings}
              forceOpenUcam={ucamModalTrigger}
              onResetUcamTrigger={() => setUcamModalTrigger(false)}
            />
          )}
          {activeTab === 'advisor' && (
            <AdvisorView
              courses={courses}
              settings={settings}
              onNavigateToRoutine={() => setActiveTab('routine')}
            />
          )}
          {activeTab === 'routine' && <RoutineView />}
          {activeTab === 'tuition' && (
            <TuitionView courses={courses} settings={settings} defaultDept={settings.dept} />
          )}
          {activeTab === 'commute' && <CommuteView />}
          {activeTab === 'coverpage' && <CoverPageView />}
        </div>
      </main>

      <MobileTabBar active={activeTab} onChange={setActiveTab} />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddCourse={handleAddCourse}
        onOpenUcam={() => {
          setActiveTab('cgpa');
          setUcamModalTrigger(true);
        }}
        onLoadDemo={handleLoadDemo}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
