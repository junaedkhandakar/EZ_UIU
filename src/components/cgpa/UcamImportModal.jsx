import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { parseUcamSource } from '../../utils/cgpaUtils';
import { CheckCircle2, AlertCircle, ClipboardPaste } from 'lucide-react';

export function UcamImportModal({ isOpen, onClose, onImportSuccess }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleChange = (text) => {
    setContent(text);
    setError('');
    setPreview(null);
    if (text.trim().length > 20) {
      try {
        setPreview(parseUcamSource(text));
      } catch {
        /* user still typing */
      }
    }
  };

  const handleImport = () => {
    try {
      setError('');
      const result = parseUcamSource(content);
      onImportSuccess(result.courses, result.dept);
      setContent('');
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not parse that content. Copy the full page source or table.');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Import from UCam"
      sub="One paste — full HTML source or just the copied grades table"
      width="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-line bg-surface2/60 p-4">
          <p className="text-xs font-bold text-ink">How to copy from UCam</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-ink-2">
            <li>
              Log into <b>ucam.uiu.ac.bd</b> and open <b>Grade Sheet</b> / <b>Registered Courses</b>.
            </li>
            <li>
              Press <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px]">Ctrl+U</kbd> for page
              source, select all, copy — or simply highlight the courses table on screen.
            </li>
            <li>Paste it below. Parsing happens instantly and stays on your device.</li>
          </ol>
        </div>

        <div className="relative">
          <ClipboardPaste className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-ink-3" />
          <textarea
            rows={7}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Paste UCam HTML source or table text here…"
            className="w-full resize-none rounded-2xl border border-line bg-surface2/60 py-3 pl-10 pr-3.5 font-mono text-[11.5px] leading-relaxed text-ink placeholder-ink-3 transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {preview && (
          <div className="fade-in flex items-center gap-2.5 rounded-xl border border-ok/25 bg-ok/10 p-3 text-xs font-medium text-ok">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Recognized <b>{preview.courses.length}</b> courses —{' '}
              {preview.dept === 'pharmacy' ? 'Pharmacy' : 'Regular'} program detected.
            </span>
          </div>
        )}

        {error && (
          <div className="fade-in flex items-center gap-2.5 rounded-xl border border-bad/25 bg-bad/10 p-3 text-xs font-medium text-bad">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!content.trim()} onClick={handleImport}>
            Import transcript
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default UcamImportModal;
