import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Calendar,
  Receipt,
  Sun,
  Moon,
  Upload,
  Download,
  Sparkles,
  ArrowRight,
  Plus,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onAddCourse,
  onOpenUcam,
  onLoadDemo,
  onExportCSV,
}) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleGlobalKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          e.preventDefault();
          onClose();
        }
      };
      document.addEventListener('keydown', handleGlobalKey, true);
      return () => document.removeEventListener('keydown', handleGlobalKey, true);
    }
  }, [isOpen, onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();

    const navActions = [
      {
        id: 'nav-cgpa',
        type: 'action',
        category: 'Navigation',
        title: 'Go to CGPA & Standing',
        desc: 'Academic calculator, transcript, honors & retake lab',
        icon: BookOpen,
        action: () => {
          setActiveTab('cgpa');
          onClose();
        },
      },
      {
        id: 'nav-tuition',
        type: 'action',
        category: 'Navigation',
        title: 'Go to Tuition & Waivers',
        desc: 'Official UIU fee breakdown, merit waiver & installments',
        icon: Receipt,
        action: () => {
          setActiveTab('tuition');
          onClose();
        },
      },
      {
        id: 'nav-advisor',
        type: 'action',
        category: 'Navigation',
        title: 'Go to AI Academic Advisor',
        desc: 'Optimal course baskets, prerequisite solver & graduation roadmap',
        icon: Sparkles,
        action: () => {
          setActiveTab('advisor');
          onClose();
        },
      },
      {
        id: 'nav-routine',
        type: 'action',
        category: 'Navigation',
        title: 'Go to Routine Builder',
        desc: 'Clash-free schedule solver & calendar sync',
        icon: Calendar,
        action: () => {
          setActiveTab('routine');
          onClose();
        },
      },
    ];

    const quickActions = [
      {
        id: 'act-theme',
        type: 'action',
        category: 'Quick Actions',
        title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        desc: 'Toggle application theme appearance',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: 'act-ucam',
        type: 'action',
        category: 'Quick Actions',
        title: 'Import from UCam',
        desc: '1-click transcript parser from ucam.uiu.ac.bd',
        icon: Upload,
        action: () => {
          onClose();
          onOpenUcam?.();
        },
      },
      {
        id: 'act-demo',
        type: 'action',
        category: 'Quick Actions',
        title: 'Load Demo Transcript',
        desc: 'Load authentic UIU student dataset with 27 courses',
        icon: Sparkles,
        action: () => {
          onClose();
          onLoadDemo?.();
        },
      },
      {
        id: 'act-export',
        type: 'action',
        category: 'Quick Actions',
        title: 'Export Transcript as CSV',
        desc: 'Download your full course transcript data',
        icon: Download,
        action: () => {
          onClose();
          onExportCSV?.();
        },
      },
    ];

    const courseMatches = COURSE_CATALOG.filter(
      (c) =>
        !q ||
        c.course_code.toLowerCase().includes(q) ||
        c.course_name.toLowerCase().includes(q)
    )
      .slice(0, 10)
      .map((c) => ({
        id: `course-${c.course_code}`,
        type: 'course',
        category: 'Courses & Curriculum',
        title: `${c.course_code} · ${c.course_name}`,
        desc: `${c.credit} Credits · ${c.type} · Difficulty: ${c.difficulty || 'Normal'}`,
        icon: Plus,
        course: c,
        action: () => {
          onAddCourse?.({
            id: 'c_' + Math.random().toString(36).substring(2, 9),
            trimester: '251',
            courseId: c.course_code,
            courseName: c.course_name,
            credit: c.credit || 3,
            grade: '',
            status: 'Running',
          });
          showToast(`Added ${c.course_code} to transcript!`, 'success');
          onClose();
        },
      }));

    if (!q) {
      return [...navActions, ...quickActions, ...courseMatches.slice(0, 5)];
    }

    const filteredActions = [...navActions, ...quickActions].filter(
      (a) => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );

    return [...filteredActions, ...courseMatches];
  }, [query, theme, setActiveTab, onClose, toggleTheme, onOpenUcam, onLoadDemo, onExportCSV, onAddCourse, showToast]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keep selected item in view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div
        className="fade-in fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="pop-in relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-line-specular bg-surface shadow-pop"
      >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-5 w-5 text-ink-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search courses, navigate tabs, or run actions..."
                className="w-full bg-transparent text-[15px] font-medium text-ink placeholder-ink-3 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  console.log('ESC button clicked');
                  onClose();
                }}
                className="kbd-shortcut cursor-pointer transition-colors hover:border-line-strong hover:text-ink"
                title="Press ESC to close"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-[380px] overflow-y-auto p-2"
              role="listbox"
            >
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-3">
                  No commands or courses found for "{query}"
                </div>
              ) : (
                items.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-colors ${
                        isSelected ? 'bg-accent text-white' : 'text-ink hover:bg-surface2'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-surface2 text-ink-2'
                          }`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <div className={`truncate text-[13.5px] font-bold ${isSelected ? 'text-white' : 'text-ink'}`}>
                            {item.title}
                          </div>
                          <div className={`truncate text-xs ${isSelected ? 'text-white/80' : 'text-ink-3'}`}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'course' && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-surface2 text-accent'
                            }`}
                          >
                            + Add
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="h-4 w-4 text-white/80" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line bg-surface2/40 px-4 py-2.5 text-xs text-ink-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="kbd-shortcut">↑</span>
                  <span className="kbd-shortcut">↓</span> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="kbd-shortcut">↵</span> Select
                </span>
              </div>
              <span className="text-[11px] font-semibold text-accent">UIU Intelligence Suite</span>
            </div>
          </div>
        </div>
  );
}
