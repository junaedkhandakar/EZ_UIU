import React from 'react';

/**
 * Minimal, XSS-safe renderer for assistant replies.
 * Builds React elements directly (never innerHTML) and supports the small
 * Markdown subset our prompts allow: bold, italic, inline code, headings,
 * bullet/numbered lists and pipe tables.
 */

const INLINE_TOKENS = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;

function renderInline(text, keyBase) {
  const parts = [];
  let last = 0;
  let match;
  let n = 0;
  INLINE_TOKENS.lastIndex = 0;

  while ((match = INLINE_TOKENS.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-${n++}`;
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={key}
          className="rounded bg-surface2 px-1 py-0.5 font-mono text-[0.9em] text-ink-2"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function isTableSeparator(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');
}

function parseTableRows(lines) {
  return lines
    .filter((line) => !isTableSeparator(line))
    .map((line) => {
      const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
      return trimmed.split('|').map((cell) => cell.trim());
    })
    .filter((cells) => cells.some((c) => c.length > 0));
}

function buildBlocks(text) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'table', rows: parseTableRows(rows) });
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '').trim());
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (/^\s*#{1,6}\s+/.test(line)) {
      blocks.push({ type: 'heading', text: line.replace(/^\s*#{1,6}\s+/, '').trim() });
      i += 1;
      continue;
    }

    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*\|/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*#{1,6}\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }

  return blocks;
}

export default function ChatText({ text = '' }) {
  const blocks = buildBlocks(text);
  let key = 0;

  return (
    <div className="text-[13.5px] leading-relaxed">
      {blocks.map((block) => {
        const blockKey = `b-${key++}`;

        if (block.type === 'heading') {
          return (
            <p key={blockKey} className="mt-2 font-semibold text-ink first:mt-0">
              {renderInline(block.text, blockKey)}
            </p>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={blockKey} className="my-1.5 space-y-1">
              {block.items.map((item, idx) => (
                <li key={`${blockKey}-${idx}`} className="flex gap-2">
                  <span aria-hidden="true" className="shrink-0 text-ink-3">
                    &bull;
                  </span>
                  <span>{renderInline(item, `${blockKey}-${idx}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={blockKey} className="my-1.5 space-y-1">
              {block.items.map((item, idx) => (
                <li key={`${blockKey}-${idx}`} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="num w-4 shrink-0 text-right text-ink-3"
                  >
                    {idx + 1}.
                  </span>
                  <span>{renderInline(item, `${blockKey}-${idx}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'table') {
          const [head, ...body] = block.rows;
          return (
            <div
              key={blockKey}
              className="my-2 overflow-x-auto overscroll-x-contain rounded-lg border border-line"
            >
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-surface2/70">
                    {(head || []).map((cell, idx) => (
                      <th
                        key={`${blockKey}-h-${idx}`}
                        className="border-b border-line px-2.5 py-1.5 text-left font-semibold text-ink-2"
                      >
                        {renderInline(cell, `${blockKey}-h-${idx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rIdx) => (
                    <tr key={`${blockKey}-r-${rIdx}`} className="border-b border-line/60 last:border-0">
                      {row.map((cell, cIdx) => (
                        <td
                          key={`${blockKey}-r-${rIdx}-c-${cIdx}`}
                          className="px-2.5 py-1.5 text-ink-2"
                        >
                          {renderInline(cell, `${blockKey}-r-${rIdx}-c-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={blockKey} className="my-1 first:mt-0 last:mb-0">
            {renderInline(block.text, blockKey)}
          </p>
        );
      })}
    </div>
  );
}
