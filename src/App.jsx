import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CgpaDashboard } from './components/cgpa/CgpaDashboard';
import { TuitionCalculator } from './components/tuition/TuitionCalculator';
import { RoutineBuilder } from './components/routine/RoutineBuilder';
import { DEMO_TRANSCRIPT_COURSES } from './utils/cgpaUtils';

const STORAGE_COURSES = 'ez_uiu_courses';
const STORAGE_SETTINGS = 'ez_uiu_settings';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('cgpa');

  // Courses state
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COURSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEMO_TRANSCRIPT_COURSES;
  });

  // Settings state
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      dept: 'regular',
      programCredits: 138,
      tuitionPerCredit: 5000,
      perTrimesterFee: 6500,
    };
  });

  // Save courses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COURSES, JSON.stringify(courses));
    } catch (e) {}
  }, [courses]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'cgpa' && (
          <CgpaDashboard
            courses={courses}
            setCourses={setCourses}
            settings={settings}
            setSettings={setSettings}
            onSyncToTuition={() => setActiveTab('tuition')}
          />
        )}

        {activeTab === 'tuition' && (
          <TuitionCalculator
            courses={courses}
            defaultDept={settings.dept}
          />
        )}

        {activeTab === 'routine' && (
          <RoutineBuilder />
        )}
      </main>

      <Footer />
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
