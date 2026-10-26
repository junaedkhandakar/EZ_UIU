import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { parseUcamSource } from '../../utils/cgpaUtils';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function UcamImportModal({ isOpen, onClose, onImportSuccess }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);

  const handleContentChange = text => {
    setContent(text);
    setError('');
    setParsedPreview(null);

    if (text.trim().length > 20) {
      try {
        const result = parseUcamSource(text);
        setParsedPreview(result);
      } catch (e) {
        // Wait until user clicks parse or finishes typing
      }
    }
  };

  const handleParse = () => {
    try {
      setError('');
      const result = parseUcamSource(content);
      onImportSuccess(result.courses, result.dept);
      setContent('');
      setParsedPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to parse UCam content. Please ensure you copied the entire page source or table.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import from UCam Grade Sheet"
      subtitle="1-Click automatic transcript parser supporting full HTML source or copied table"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        {/* Instructions */}
        <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
          <p className="font-semibold text-zinc-900 dark:text-zinc-200">
            How to copy from UCam:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Log into <b>ucam.uiu.ac.bd</b> and navigate to <b>Grade Sheet</b> or <b>Registered Courses</b>.</li>
            <li>Press <b>Ctrl+U</b> (or right-click → <i>View Page Source</i>), select all (Ctrl+A), copy (Ctrl+C), and paste below.</li>
            <li>Alternatively, highlight the courses table directly on the screen and paste here!</li>
          </ol>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            rows={7}
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Paste your copied UCam HTML source code or table text here..."
            className="w-full p-3.5 text-xs font-mono bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 resize-none transition-all"
          />
        </div>

        {/* Parsed Preview Notification */}
        {parsedPreview && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Successfully recognized <b>{parsedPreview.courses.length}</b> courses ({parsedPreview.dept === 'pharmacy' ? 'Pharmacy' : 'Regular'} program detected)!
            </span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!content.trim()}
            onClick={handleParse}
          >
            Import Transcript
          </Button>
        </div>
      </div>
    </Modal>
  );
}
