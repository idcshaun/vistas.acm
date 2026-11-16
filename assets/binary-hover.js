/* =========================================================
   VISTAS ACM — ENGLISH DEFAULT / BINARY HOVER DECODE
   English is always the default text.
   Hover/focus: binary digits scramble into the original English.
   Mouse leave/blur: the original English is restored immediately.
========================================================= */
(() => {
  "use strict";

  const EXCLUDED = [
    ".card", "[class*=\"card\"]", ".container", "[class*=\"-container\"]", "[class*=\"__container\"]",
    ".step", ".journey-step", ".ev", ".mini", ".form", ".nav", "#nv",
    "header", "footer", ".team-showcase", ".team-slide-info",
    ".team-preview-info", ".instagram-placeholder", ".instagram-feed",
    ".info", ".member-bio", ".member-socials", ".member-social-button",
    "button", "input", "textarea", "select", "option",
    "script", "style", "noscript", "svg", "canvas",
    "[contenteditable='true']", "[aria-hidden='true']",
    "[data-no-decode]", ".binary-hover-word"
  ].join(",");

  const GLYPHS = "01";

  const eligibleTextSelector =
    "h1,h2,h3,h4,h5,h6,p,a,span,b,strong,em,small,li,label,summary,time,blockquote";

  function scrambleToEnglish(element) {
    if (element.dataset.binaryAnimating === "1") return;

    const original = element.dataset.originalText;
    if (!original) return;

    element.dataset.binaryAnimating = "1";
    element.classList.add("binary-hovering");

    const chars = Array.from(original);
    const start = performance.now();
    const duration = 520;
    let frameId = 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const revealCount = Math.floor(progress * chars.length);
      let output = "";

      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/\s/.test(ch) || !/[\p{L}\p{N}]/u.test(ch)) output += ch;
        else if (i < revealCount) output += ch;
        else output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }

      element.textContent = output;
      if (progress < 1 && element.matches(":hover, :focus")) {
        frameId = requestAnimationFrame(tick);
      } else {
        stopAnimation(element);
      }
    }

    frameId = requestAnimationFrame(tick);
    element._binaryHoverFrame = frameId;
  }

  function stopAnimation(element) {
    if (element._binaryHoverFrame) cancelAnimationFrame(element._binaryHoverFrame);
    element._binaryHoverFrame = 0;
    element.textContent = element.dataset.originalText || element.textContent;
    element.dataset.binaryAnimating = "0";
    element.classList.remove("binary-hovering");
  }

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent || parent.closest(EXCLUDED)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!parent.closest(eligibleTextSelector)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Avoid wrapping text inside a larger eligible text element:
        // only wrap text nodes directly within the selected element.
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || parent.closest(EXCLUDED)) return;

    // Leave whitespace and punctuation-only text nodes alone.
    const text = node.nodeValue;
    if (!/[\p{L}\p{N}]/u.test(text)) return;

    const fragment = document.createDocumentFragment();
    const pieces = text.split(/(\s+)/);

    pieces.forEach(piece => {
      if (!piece) return;

      if (/^\s+$/.test(piece) || !/[\p{L}\p{N}]/u.test(piece)) {
        fragment.appendChild(document.createTextNode(piece));
        return;
      }

      const span = document.createElement("span");
      span.className = "binary-hover-word";
      span.textContent = piece;
      span.dataset.originalText = piece;
      span.dataset.binaryAnimating = "0";
      span.setAttribute("aria-label", piece);

      span.addEventListener("mouseenter", () => scrambleToEnglish(span));
      span.addEventListener("mouseleave", () => stopAnimation(span));
      span.addEventListener("focus", () => scrambleToEnglish(span));
      span.addEventListener("blur", () => stopAnimation(span));

      fragment.appendChild(span);
    });

    node.parentNode.replaceChild(fragment, node);
  });

  document.documentElement.classList.add("binary-hover-ready");
})();
