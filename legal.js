// PRIME POPS legal-page theme and navigation controls
(() => {
  const root = document.documentElement;

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
      return true;
    }
    return false;
  }

  function initializeLegalPage() {
    const themeButton = document.getElementById('legal-theme-toggle');
    const backHomeLink = document.getElementById('legal-back-home');

    function setTheme(isDark) {
      root.classList.toggle('dark', isDark);

      try {
        window.localStorage.setItem(
          'primepops-theme',
          isDark ? 'dark' : 'light'
        );
      } catch (error) {
        // The page still works when browser storage is unavailable.
      }

      document.querySelectorAll('.theme-icon').forEach((icon) => {
        icon.classList.remove('theme-icon-spin');
        void icon.offsetWidth;
        icon.classList.add('theme-icon-spin');
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      });

      themeButton?.setAttribute('aria-pressed', String(isDark));
      themeButton?.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );

      refreshIcons();
    }

    function toggleTheme() {
      setTheme(!root.classList.contains('dark'));
    }

    function returnToHome(event) {
      event.preventDefault();

      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();

        window.setTimeout(() => {
          window.location.href = './index.html';
        }, 150);
        return;
      }

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = './index.html';
    }

    const isDark = root.classList.contains('dark');

    document.querySelectorAll('.theme-icon').forEach((icon) => {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    });

    themeButton?.setAttribute('aria-pressed', String(isDark));
    themeButton?.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );

    themeButton?.addEventListener('click', toggleTheme);
    backHomeLink?.addEventListener('click', returnToHome);

    // Lucide is loaded with defer. Render immediately when available,
    // and retry once after all page resources have finished loading.
    refreshIcons();
    window.addEventListener('load', refreshIcons, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLegalPage, {
      once: true
    });
  } else {
    initializeLegalPage();
  }
})();
