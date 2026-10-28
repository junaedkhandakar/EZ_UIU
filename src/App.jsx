import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import { MobileTopBar, MobileTabBar } from './components/layout/MobileBar';
import CgpaView from './components/cgpa/CgpaView';
import TuitionView from './components/tuition/TuitionView';
import RoutineView from './components/routine/RoutineView';
import { DEMO_TRANSCRIPT_COURSES } from './utils/cgpaUtils';

const STORAGE_COURSES = 'ez_uiu_courses';
const STORAGE_SETTINGS = 'ez_uiu_settings';

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-48 left-1/4 h-[420px] w-[640px] rounded-full bg-accent2/10 blur-[130px]" />
      <div className="absolute -top-24 right-[-140px] h-[380px] w-[520px] rounded-full bg-accent/[0.07] blur-[130px]" />
      <div className="absolute bottom-[-220px] left-[-120px] h-[380px] w-[480px] rounded-full bg-accent/[0.05] blur-[130px]" />
    </div>
  );
}

export function AppContent() {
  const [activeTab, setActiveTab] = useState('cgpa');

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
      tuitionPerCredit: 5000,
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

  return (
    <div className="min-h-dvh bg-base text-ink">
      <Aurora />
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <MobileTopBar />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:pl-[calc(228px+2rem)] lg:pr-8 lg:pt-8 lg:pb-10">
        <div key={activeTab}>
          {activeTab === 'cgpa' && (
            <CgpaView courses={courses} setCourses={setCourses} settings={settings} setSettings={setSettings} />
          )}
          {activeTab === 'tuition' && (
            <TuitionView courses={courses} settings={settings} defaultDept={settings.dept} />
          )}
          {activeTab === 'routine' && <RoutineView />}
        </div>
      </main>

      <MobileTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
