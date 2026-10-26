import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  GRADE_POINTS,
  LETTER_GRADES,
  calculateAcademicMetrics,
  getEffectiveCourses,
} from '../../utils/cgpaUtils';
import { TrendingUp, ArrowUpRight, RotateCcw, Check, Sparkles } from 'lucide-react';

export function RetakeOptimizer({ courses = [], effectiveCourses = [] }) {
  // Retake targets: { courseId: targetGrade }
  const [retakeSelections, setRetakeSelections] = useState({});

  // Eligible courses for retake (grades F, D, D+, C-, C, C+) that are in the effective completed courses
  const retakeCandidates = useMemo(() => {
    return effectiveCourses.filter(c => {
      const g = c.grade;
      return g === 'F' || g === 'D' || g === 'D+' || g === 'C-' || g === 'C' || g === 'C+';
    });
  }, [effectiveCourses]);

  // Current metrics
  const currentMetrics = useMemo(() => {
    return calculateAcademicMetrics(courses);
  }, [courses]);

  // Projected metrics when simulated retakes are applied
  const simulatedMetrics = useMemo(() => {
    // Clone courses and replace selected attempts with simulated new attempts
    const selectedKeys = Object.keys(retakeSelections);
    if (!selectedKeys.length) return currentMetrics;

    const simulatedList = courses.map(c => {
      if (retakeSelections[c.id]) {
        return {
          ...c,
          grade: retakeSelections[c.id],
        };
      }
      return c;
    });

    return calculateAcademicMetrics(simulatedList);
  }, [courses, retakeSelections, currentMetrics]);

  const toggleCourse = (courseId, defaultTarget = 'A') => {
    setRetakeSelections(prev => {
      const next = { ...prev };
      if (next[courseId]) {
        delete next[courseId];
      } else {
        next[courseId] = defaultTarget;
      }
      return next;
    });
  };

  const updateTargetGrade = (courseId, grade) => {
    setRetakeSelections(prev => ({
      ...prev,
      [courseId]: grade,
    }));
  };

  const selectAllCandidates = (targetGrade = 'A') => {
    const next = {};
    retakeCandidates.forEach(c => {
      next[c.id] = targetGrade;
    });
    setRetakeSelections(next);
  };

  const resetSimulation = () => {
    setRetakeSelections({});
  };

  const delta = (simulatedMetrics.cgpa - currentMetrics.cgpa);
  const activeCount = Object.keys(retakeSelections).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Simulation Result Comparison Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current CGPA */}
        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Current CGPA
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {currentMetrics.cgpa.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-400">/ 4.00</span>
          </div>
          <span className="text-xs text-zinc-500 mt-1">
            Across {currentMetrics.credits} completed credits
          </span>
        </Card>

        {/* Projected CGPA */}
        <Card className="p-5 flex flex-col justify-between border-apple-blue/30 bg-apple-blue/[0.02]">
          <span className="text-xs font-semibold text-apple-blue uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Projected CGPA
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-apple-blue tabular-nums">
              {simulatedMetrics.cgpa.toFixed(2)}
            </span>
            <span className="text-xs text-apple-blue/70">/ 4.00</span>
          </div>
          <span className="text-xs text-zinc-500 mt-1">
            {activeCount > 0 ? `With ${activeCount} retake course(s) replaced` : 'Select courses below to simulate'}
          </span>
        </Card>

        {/* Expected Jump / Delta */}
        <Card className="p-5 flex flex-col justify-between border-emerald-500/30 bg-emerald-500/[0.02]">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            CGPA Jump
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-extrabold tabular-nums ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600'}`}>
              {delta > 0 ? `+${delta.toFixed(2)}` : '0.00'}
            </span>
            {delta > 0 && <ArrowUpRight className="w-5 h-5 text-emerald-600" />}
          </div>
          <span className="text-xs text-zinc-500 mt-1">
            +{(simulatedMetrics.points - currentMetrics.points).toFixed(2)} total grade points gained
          </span>
        </Card>
      </div>

      {/* Retake Candidates List */}
      <Card>
        <CardHeader
          title="Eligible Retake Courses"
          subtitle="UIU allows retaking courses with low grades to permanently supersede the previous grade in CGPA"
          action={
            <div className="flex items-center gap-2">
              <Button size="xs" variant="secondary" onClick={() => selectAllCandidates('A')}>
                Simulate All with A
              </Button>
              {activeCount > 0 && (
                <Button size="xs" variant="ghost" onClick={resetSimulation}>
                  Reset
                </Button>
              )}
            </div>
          }
        />
        <CardContent>
          {retakeCandidates.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-xs">
              🎉 No eligible retake candidates found (all current course grades are B- or higher)!
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {retakeCandidates.map(course => {
                const isSelected = Boolean(retakeSelections[course.id]);
                const targetGrade = retakeSelections[course.id] || 'A';
                const currentPts = (GRADE_POINTS[course.grade] || 0) * course.credit;
                const projectedPts = (GRADE_POINTS[targetGrade] || 0) * course.credit;
                const pointDiff = projectedPts - currentPts;

                return (
                  <div
                    key={course.id}
                    className={`py-3.5 px-4 -mx-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-apple-blue/[0.04] dark:bg-apple-blue/[0.08]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCourse(course.id, targetGrade)}
                        className="w-4 h-4 rounded text-apple-blue focus:ring-apple-blue cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {course.courseId}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            {course.courseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                          <span>{course.credit} Credits</span>
                          <span>·</span>
                          <span>Term {course.trimester}</span>
                          <span>·</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            Current Grade: {course.grade} ({GRADE_POINTS[course.grade].toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Target Grade Selector */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-xs text-zinc-500">Target Grade:</span>
                      <select
                        disabled={!isSelected}
                        value={targetGrade}
                        onChange={e => updateTargetGrade(course.id, e.target.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border focus:outline-none transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-[#252528] border-apple-blue text-apple-blue cursor-pointer shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400 opacity-60'
                        }`}
                      >
                        {LETTER_GRADES.filter(g => GRADE_POINTS[g] > GRADE_POINTS[course.grade]).map(g => (
                          <option key={g} value={g}>
                            {g} ({GRADE_POINTS[g].toFixed(2)})
                          </option>
                        ))}
                      </select>

                      {isSelected && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{pointDiff.toFixed(2)} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
