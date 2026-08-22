/**
 * Global API Loading Indicator Controller.
 * Manages smooth top progress bar and floating loading badge using Tailwind CSS utilities.
 */
let activeRequests = 0;
let progressTimer = null;
let currentProgress = 0;

function getProgressBar() {
  let bar = document.getElementById('global-progress-bar');
  if (!bar && typeof document !== 'undefined' && document.body) {
    bar = document.createElement('div');
    bar.id = 'global-progress-bar';
    bar.className = 'fixed top-0 left-0 h-[3px] w-0 z-[99999] pointer-events-none opacity-0 transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]';
    document.body.prepend(bar);
  }
  return bar;
}

function getLoadingBadge() {
  let badge = document.getElementById('global-loading-badge');
  if (!badge && typeof document !== 'undefined' && document.body) {
    badge = document.createElement('div');
    badge.id = 'global-loading-badge';
    badge.className = 'fixed bottom-5 right-5 z-[9999] hidden items-center gap-2 px-3.5 py-2 rounded-full bg-gray-800/95 border border-indigo-500/40 text-indigo-200 text-xs font-semibold shadow-2xl backdrop-blur-md pointer-events-none transition-all transform duration-200';
    badge.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span><span>Đang tải...</span>';
    document.body.appendChild(badge);
  }
  return badge;
}

export function startLoading() {
  activeRequests++;
  const bar = getProgressBar();
  const badge = getLoadingBadge();

  if (activeRequests === 1 && bar) {
    bar.classList.remove('opacity-0');
    bar.classList.add('opacity-100');
    badge?.classList.remove('hidden');
    badge?.classList.add('flex');
    currentProgress = 20;
    bar.style.width = `${currentProgress}%`;

    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (currentProgress < 85) {
        currentProgress += Math.random() * 12 + 3;
        if (bar) {
          bar.style.width = `${Math.min(currentProgress, 88)}%`;
        }
      }
    }, 180);
  }
}

export function stopLoading() {
  activeRequests = Math.max(0, activeRequests - 1);

  if (activeRequests === 0) {
    clearInterval(progressTimer);
    const bar = getProgressBar();
    const badge = getLoadingBadge();

    if (bar) {
      bar.style.width = '100%';
      setTimeout(() => {
        bar.classList.remove('opacity-100');
        bar.classList.add('opacity-0');
        badge?.classList.remove('flex');
        badge?.classList.add('hidden');
        setTimeout(() => {
          if (activeRequests === 0) {
            bar.style.width = '0%';
          }
        }, 300);
      }, 200);
    } else {
      badge?.classList.remove('flex');
      badge?.classList.add('hidden');
    }
  }
}
