/* VISTAS ACM — Phase 3 interactive domain explorer */
(() => {
  const tabs = [...document.querySelectorAll('[data-domain-target]')];
  const panels = [...document.querySelectorAll('[data-domain-panel]')];
  if (!tabs.length || !panels.length) return;

  const setActive = (index) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const index = Number(tab.dataset.domainTarget);
      const panel = panels[index];
      if (!panel) return;
      setActive(index);
      panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number(visible.target.dataset.domainPanel));
    }, { threshold: [0.25, 0.45, 0.65], rootMargin: '-15% 0px -15% 0px' });
    panels.forEach(panel => observer.observe(panel));
  }
})();
