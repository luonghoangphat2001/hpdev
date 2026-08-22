import { encodeActionArgs } from '../app/events.js';
import { getLogContent, getLogFiles } from '../api/logs.js';

let _rawText = '';
let _currentFile = '';

export async function loadLogs() {
  const list = document.getElementById('log-file-list');
  if (!list) return;

  try {
    const data = await getLogFiles();
    const files = Array.isArray(data) ? data : [];

    list.innerHTML = files.length
      ? files.map((f) =>
          `<div class="flex items-center gap-2">
            <button data-action="logs.viewFile" data-action-args="${encodeActionArgs(f.filename)}"
             class="log-file-btn px-3 py-1.5 rounded-lg text-xs font-mono border border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white transition">${escHtml(f.filename)}</button>
            <a href="/api/logs/${encodeURIComponent(f.filename)}"
               download="${escAttr(f.filename)}"
               class="px-2 py-1.5 rounded-lg text-xs border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
               title="Download ${escAttr(f.filename)}">⤓</a>
            <span class="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border ${f.source === 'server' ? 'border-amber-500 text-amber-300' : 'border-sky-500 text-sky-300'}">${escHtml(f.source || 'app')}</span>
            <span class="text-[11px] text-gray-500 font-mono">${formatSize(f.sizeBytes)}</span>
          </div>`
        ).join('')
      : '<span class="text-xs text-gray-500">Không có file log nào.</span>';

    // Auto-open today's log if available
    const today = new Date().toISOString().slice(0, 10) + '.log';
    if (files.some((f) => f.filename === today)) {
      await viewLogFile(today);
    } else if (files.length > 0) {
      await viewLogFile(files[0].filename);
    }
  } catch (err) {
    list.innerHTML = `<span class="text-xs text-red-400">Lỗi tải danh sách logs: ${escHtml(err.message)}</span>`;
  }
}

export async function viewLogFile(filename) {
  _currentFile = filename;
  const filenameEl = document.getElementById('log-filename');
  if (filenameEl) {
    filenameEl.textContent = filename;
  }

  // Highlight active button
  document.querySelectorAll('.log-file-btn').forEach((b) => {
    const active = b.textContent.trim() === filename;
    b.classList.toggle('border-indigo-500', active);
    b.classList.toggle('text-white', active);
    b.classList.toggle('border-gray-600', !active);
    b.classList.toggle('text-gray-300', !active);
  });

  try {
    _rawText = await getLogContent(filename);
    renderLog(_rawText);
  } catch (err) {
    const pre = document.getElementById('log-content');
    if (pre) {
      pre.textContent = `Lỗi tải nội dung file log "${filename}": ${err.message}`;
    }
  }
}

export function filterLog() {
  renderLog(_rawText);
}

function renderLog(raw) {
  const filter = (document.getElementById('log-filter')?.value || '').toLowerCase();
  const lines = String(raw || '').split('\n');
  const filtered = filter ? lines.filter((l) => l.toLowerCase().includes(filter)) : lines;

  // Colorize log levels
  const html = filtered.map((line) => {
    let cls = 'text-gray-300';
    if (/\[ERROR\]/.test(line)) cls = 'text-red-400';
    else if (/\[WARN\]/.test(line)) cls = 'text-yellow-400';
    else if (/\[INFO\]/.test(line)) cls = 'text-green-400';
    else if (/\[OpenClaw\]/.test(line)) cls = 'text-cyan-400';
    else if (/\[AIService\]/.test(line)) cls = 'text-indigo-300';
    return `<span class="${cls}">${esc(line)}</span>`;
  }).join('\n');

  const pre = document.getElementById('log-content');
  if (!pre) return;

  pre.innerHTML = html || '<span class="text-gray-500">File log trống.</span>';

  if (document.getElementById('log-autoscroll')?.checked) {
    pre.scrollTop = pre.scrollHeight;
  }
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  return esc(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escHtml(str) {
  return esc(String(str ?? ''));
}

function formatSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
