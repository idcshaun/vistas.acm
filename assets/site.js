/* =========================================================
   VISTAS ACM — MAIN WEBSITE JAVASCRIPT
========================================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const LOGO = "assets/vistas-acm-blue-logo.jpg";

  const WORDS = [
    "Build", "Lead", "Create", "Connect", "Explore",
    "Design", "Code", "Share", "Learn", "Ship",
    "Test", "Inspire", "Solve", "Grow", "Imagine"
  ];

  const HUES = [
    210, 202, 216, 206, 220,
    198, 212, 205, 218, 200,
    214, 208, 222, 204, 216
  ];

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;


  /* =========================================
     FIRST-VISIT VIDEO INTRO
     Plays once per browser tab session.
  ========================================= */
  function showIntroLoader() {
    const introKey = "vistas-acm-intro-seen";
    if (reducedMotion || sessionStorage.getItem(introKey) === "1") return;

    sessionStorage.setItem(introKey, "1");

    const loader = document.createElement("div");
    loader.id = "intro-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-label", "Loading VISTAS ACM");

    const video = document.createElement("video");
    video.src = "assets/vistas-intro-loader.mp4";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.disablePictureInPicture = true;
    video.playbackRate = 1.8;

    const brand = document.createElement("span");
    brand.className = "intro-brand";
    brand.textContent = "VISTAS ACM · STUDENT CHAPTER";

    loader.append(video, brand);
    document.body.prepend(loader);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      loader.classList.add("is-leaving");
      window.setTimeout(() => loader.remove(), 750);
    };

    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", () => window.setTimeout(finish, 900), { once: true });

    // Keep the intro premium but brief; don't trap visitors on a long loader.
    const safetyTimer = window.setTimeout(finish, 5900);

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        window.clearTimeout(safetyTimer);
        window.setTimeout(finish, 1100);
      });
    }

    // If the visitor backgrounds the tab during the intro, finish it promptly.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.clearTimeout(safetyTimer);
        finish();
      }
    }, { once: true });
  }

  showIntroLoader();

  // Thin reading-progress line for the homepage storytelling flow.
  if (!$("#page-progress")) {
    const progress = document.createElement("div");
    progress.id = "page-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
  }

  const pageProgress = $("#page-progress");
  let progressTicking = false;
  function updatePageProgress() {
    if (!pageProgress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    pageProgress.style.width = `${Math.min(100, Math.max(0, amount))}%`;
    progressTicking = false;
  }
  window.addEventListener("scroll", () => {
    if (!progressTicking) {
      window.requestAnimationFrame(updatePageProgress);
      progressTicking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", updatePageProgress, { passive: true });
  updatePageProgress();

  const nav = $("#nv");
  const wipe = $("#wipe");
  const cursor = $("#cur");
  const isSPA = Boolean($("#v-home"));

  const pad = n => String(n).padStart(2, "0");

  const setText = (element, value) => {
    if (element) element.textContent = value ?? "";
  };

  /* =========================================================
     YEAR
  ========================================================= */

  $$("[data-year]").forEach(element => {
    setText(element, new Date().getFullYear());
  });

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function currentPage() {
    if (document.body.dataset.page) {
      return document.body.dataset.page.toLowerCase();
    }

    return (
      location.pathname.split("/").pop() || "index.html"
    )
      .replace(/\.html?$/i, "")
      .toLowerCase() || "home";
  }

  function setActiveNavigation(page) {
    $$(".nav .menu .l, .ft nav a[data-p]").forEach(link => {
      const active = link.dataset.p === page;

      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (!isSPA) {
    setActiveNavigation(currentPage());
  }

  /* =========================================================
     NAVIGATION ACTIVE PILL
     ACM-VIT-inspired moving indicator, VISTAS styling.
  ========================================================= */

  const navMenu = $(".nav .menu");
  let navIndicator = null;

  function setupNavIndicator() {
    if (!navMenu) return;

    if (!navIndicator) {
      navIndicator = document.createElement("span");
      navIndicator.className = "nav-indicator";
      navIndicator.setAttribute("aria-hidden", "true");
      navMenu.appendChild(navIndicator);
    }

    const activeLink = $(".nav .menu .l.is-active");
    if (!activeLink || window.innerWidth <= 860) {
      navIndicator.classList.remove("is-visible");
      return;
    }

    const menuRect = navMenu.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    navIndicator.style.width = `${linkRect.width}px`;
    navIndicator.style.height = `${linkRect.height}px`;
    navIndicator.style.transform = `translate(${linkRect.left - menuRect.left}px, ${linkRect.top - menuRect.top}px)`;
    navIndicator.classList.add("is-visible");
  }

  setupNavIndicator();
  window.addEventListener("resize", setupNavIndicator, { passive: true });
  window.addEventListener("load", setupNavIndicator, { once: true });

  /* =========================================================
     MOBILE MENU
  ========================================================= */

  const menuToggle = $("#mt");

  function closeMenu() {
    if (!nav) return;

    nav.classList.remove("o");

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const opened = nav.classList.toggle("o");

      menuToggle.setAttribute(
        "aria-expanded",
        String(opened)
      );

      menuToggle.setAttribute(
        "aria-label",
        opened ? "Close menu" : "Open menu"
      );
    });

    $$(".nav .menu a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("pointerdown", event => {
      if (
        nav.classList.contains("o") &&
        !nav.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  /* =========================================================
     NAVBAR SCROLL
  ========================================================= */

  function updateNavbar() {
    if (nav) {
      nav.classList.toggle("s", window.scrollY > 40);
    }
  }

  /* =========================================================
     CARD POINTER EFFECT
  ========================================================= */

  $$(".card").forEach(card => {
    card.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse") return;

      const rect = card.getBoundingClientRect();

      card.style.setProperty(
        "--mx",
        `${event.clientX - rect.left}px`
      );

      card.style.setProperty(
        "--my",
        `${event.clientY - rect.top}px`
      );
    });
  });

  /* =========================================================
     CUSTOM CURSOR
  ========================================================= */

  if (
    cursor &&
    window.matchMedia("(pointer: fine)").matches
  ) {
    window.addEventListener("pointermove", event => {
      cursor.style.opacity = "1";

      cursor.style.transform =
        `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    });

    document.addEventListener("pointerleave", () => {
      cursor.style.opacity = "0";
    });
  }

  /* =========================================================
     HERO PARALLAX
  ========================================================= */

  const hero = $(".hero");
  const canvas = $("#fx");

  if (hero && !reducedMotion) {
    hero.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse") return;

      const rect = hero.getBoundingClientRect();

      hero.style.setProperty(
        "--px",
        ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3)
      );

      hero.style.setProperty(
        "--py",
        ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3)
      );
    });
  }

  /* =========================================================
     PARTICLE ANIMATION
  ========================================================= */

  if (hero && canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");

    if (ctx) {
      let width = 0;
      let height = 0;
      let animationFrame = 0;
      let time = 0;

      const particles = Array.from(
        {
          length: window.innerWidth < 600 ? 38 : 85
        },
        () => ({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 1.8 + 0.5,
          speed: Math.random() * 0.00055 + 0.0002,
          phase: Math.random() * Math.PI * 2
        })
      );

      function resizeCanvas() {
        const rect = hero.getBoundingClientRect();

        const dpr = Math.min(
          window.devicePixelRatio || 1,
          2
        );

        width = rect.width;
        height = rect.height;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function drawParticles() {
        if (document.hidden) {
          animationFrame = 0;
          return;
        }

        ctx.clearRect(0, 0, width, height);

        time += 0.018;

        particles.forEach(particle => {
          particle.y -= particle.speed;

          if (particle.y < -0.02) {
            particle.y = 1.02;
            particle.x = Math.random();
          }

          ctx.beginPath();

          ctx.fillStyle =
            `rgba(30,160,255,${
              0.16 +
              0.42 * Math.abs(
                Math.sin(time + particle.phase)
              )
            })`;

          ctx.shadowColor = "#19a8ff";
          ctx.shadowBlur = 9;

          ctx.arc(
            particle.x * width +
              Math.sin(time + particle.phase) * 12,
            particle.y * height,
            particle.size,
            0,
            Math.PI * 2
          );

          ctx.fill();
        });

        ctx.shadowBlur = 0;

        animationFrame = requestAnimationFrame(drawParticles);
      }

      function startParticles() {
        if (!animationFrame && !document.hidden) {
          animationFrame = requestAnimationFrame(drawParticles);
        }
      }

      function stopParticles() {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }

        animationFrame = 0;
      }

      resizeCanvas();

      if ("ResizeObserver" in window) {
        new ResizeObserver(resizeCanvas).observe(hero);
      } else {
        window.addEventListener("resize", resizeCanvas);
      }

      document.addEventListener("visibilitychange", () => {
        document.hidden
          ? stopParticles()
          : startParticles();
      });

      startParticles();
    }
  }

  /* =========================================================
     FILTER CHIPS
  ========================================================= */

  $$("[data-chips]").forEach(box => {
    const grid = box.nextElementSibling;

    if (!grid) return;

    $$(".chip", box).forEach(button => {
      button.addEventListener("click", () => {
        $$(".chip", box).forEach(chip => {
          chip.setAttribute(
            "aria-pressed",
            String(chip === button)
          );
        });

        $$(".ev", grid).forEach(card => {
          card.hidden =
            button.dataset.f !== "All" &&
            card.dataset.c !== button.dataset.f;
        });
      });
    });
  });

  /* =========================================================
     TEAM CAROUSEL
  ========================================================= */

  const track = $("#tk");
  const teamTitle = $(".tt");
  const wordsContainer = $("#wds");
  const slidesContainer = $("#sls");

  const totalElement = $("#total-members");
  const hint = $("#hn");

  const nameElement = $("#nm");
  const roleElement = $("#rl");
  const domainElement = $("#tm");

  const counterElement = $("#ct");
  const indexElement = $("#in");

  let members = [];
  let wordElements = [];
  let portraitElements = [];

  let activeIndex = -1;
  let mobileTimer = null;

  let touchStartX = null;
  let touchStartY = null;

  function animateText(element, value) {
    if (!element || element.textContent === value) return;

    element.textContent = value ?? "";

    if (!reducedMotion && element.animate) {
      element.animate(
        [
          {
            opacity: 0,
            transform: "translateY(14px)"
          },
          {
            opacity: 1,
            transform: "translateY(0)"
          }
        ],
        {
          duration: 420,
          easing: "cubic-bezier(.2,.8,.2,1)"
        }
      );
    }
  }

  function isMobileTeam() {
    return window.matchMedia(
      "(max-width: 700px), (pointer: coarse)"
    ).matches;
  }

  function sizeTrack() {
    if (!track) return;

    const height = window.innerHeight;

    if (!members.length) {
      track.style.height = `${height}px`;
      return;
    }

    const mobile = window.matchMedia(
      "(max-width: 700px)"
    ).matches;

    const step = mobile
      ? Math.max(520, Math.round(height * 0.78))
      : Math.max(560, Math.round(height * 0.72));

    track.style.height =
      `${height + members.length * step}px`;
  }

  function showEmptyTeam(message) {
    if (wordsContainer) {
      wordsContainer.replaceChildren();

      const empty = document.createElement("div");
      empty.className = "team-empty";
      empty.textContent = message;

      wordsContainer.appendChild(empty);
    }

    if (slidesContainer) {
      slidesContainer.replaceChildren();
    }

    animateText(nameElement, "Coming Soon");
    animateText(roleElement, "Meet our team");
    animateText(domainElement, "VISTAS ACM");
    animateText(counterElement, "00");

    setText(totalElement, "/ 00");
    setText(indexElement, "00");

    if (hint) hint.style.opacity = "0";

    sizeTrack();
  }

  function setMember(index) {
    if (
      !members.length ||
      index < 0 ||
      index >= members.length ||
      index === activeIndex
    ) {
      return;
    }

    activeIndex = index;

    const member = members[index];

    wordElements.forEach((element, i) => {
      element.className =
        `wd${
          i === index
            ? " on"
            : i < index
              ? " up"
              : ""
        }`;
    });

    portraitElements.forEach((element, i) => {
      element.className =
        `sl${members[i].image ? "" : " ph"}${
          i === index
            ? " on"
            : i < index
              ? " up"
              : ""
        }`;
    });

    if (teamTitle) {
      teamTitle.style.setProperty("--h", member.hue);
    }

    animateText(nameElement, member.name);
    animateText(roleElement, member.role);
    animateText(domainElement, member.domain);

    animateText(counterElement, pad(index + 1));

    setText(indexElement, pad(index + 1));

    if (hint) {
      hint.style.opacity = index > 0 ? "0" : "1";
    }

    const bar = $(".bar");

    if (bar) {
      bar.style.setProperty(
        "--p",
        String((index + 1) / members.length)
      );
    }
  }

  function buildTeamSlides() {
    if (!track || !wordsContainer || !slidesContainer) return;

    wordsContainer.replaceChildren();
    slidesContainer.replaceChildren();

    if (!members.length) {
      showEmptyTeam("TEAM PROFILES WILL BE ANNOUNCED SOON.");
      return;
    }

    members.forEach((member, index) => {
      const word = document.createElement("div");

      word.className = "wd";
      word.textContent = member.word;
      word.setAttribute("aria-hidden", "true");

      wordsContainer.appendChild(word);

      const slide = document.createElement("div");

      slide.className = `sl${member.image ? "" : " ph"}`;

      const img = document.createElement("img");

      img.src = member.image || LOGO;

      img.alt = member.image
        ? `Portrait of ${member.name}`
        : "VISTAS ACM member";

      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";

      img.addEventListener("error", () => {
        img.onerror = null;
        img.src = LOGO;
        slide.classList.add("ph");
      });

      slide.appendChild(img);
      slidesContainer.appendChild(slide);
    });

    wordElements = $$(".wd", wordsContainer);
    portraitElements = $$(".sl", slidesContainer);

    sizeTrack();
    activeIndex = -1;

    setText(totalElement, `/ ${pad(members.length)}`);

    setMember(0);

    setupMobileTeam();
  }

  async function loadTeam() {
    if (!track) return;

    try {
      const response = await fetch("/api/config", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Configuration request failed: ${response.status}`
        );
      }

      const config = await response.json();

      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error("Supabase configuration is incomplete.");
      }

      const { createClient } = await import(
        "https://esm.sh/@supabase/supabase-js@2"
      );

      const supabase = createClient(
        config.supabaseUrl,
        config.supabaseKey
      );

      const { data, error } = await supabase
        .from("team_members")
        .select(
          "id, name, designation, domain, image_url, display_order"
        )
        .eq("status", "published")
        .order("display_order", { ascending: true });

      if (error) throw error;

      members = (data || []).map((member, index) => ({
        id: member.id,
        word: WORDS[index % WORDS.length],
        hue: HUES[index % HUES.length],
        name: member.name || "VISTAS ACM Member",
        role: member.designation || "Team Member",
        domain: member.domain || "VISTAS ACM",
        image: member.image_url || ""
      }));

      console.info(
        `VISTAS ACM: Loaded ${members.length} team members.`
      );

      buildTeamSlides();

    } catch (error) {
      console.error("Team loading failed:", error);

      showEmptyTeam(
        "TEAM PROFILES COULD NOT BE LOADED."
      );
    }
  }

  if (track) {
    sizeTrack();
    loadTeam();
  }

  /* =========================================================
     MOBILE TEAM SLIDESHOW
  ========================================================= */

  function stopMobileTimer() {
    if (mobileTimer) {
      clearInterval(mobileTimer);
    }

    mobileTimer = null;
  }

  function startMobileTimer() {
    stopMobileTimer();

    if (
      !members.length ||
      members.length < 2 ||
      !isMobileTeam() ||
      reducedMotion
    ) {
      return;
    }

    mobileTimer = setInterval(() => {
      if (document.hidden) return;

      setMember(
        (activeIndex + 1) % members.length
      );
    }, 5000);
  }

  function setupMobileTeam() {
    startMobileTimer();

    const stage = $(".tstage");

    if (!stage || stage.dataset.swipeReady) return;

    stage.dataset.swipeReady = "true";

    stage.addEventListener("touchstart", event => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchend", event => {
      if (
        touchStartX === null ||
        touchStartY === null ||
        !members.length
      ) {
        return;
      }

      const dx =
        event.changedTouches[0].clientX - touchStartX;

      const dy =
        event.changedTouches[0].clientY - touchStartY;

      if (
        Math.abs(dx) > 42 &&
        Math.abs(dx) > Math.abs(dy) * 1.2
      ) {
        const next =
          (
            activeIndex +
            (dx < 0 ? 1 : -1) +
            members.length
          ) % members.length;

        setMember(next);
        startMobileTimer();
      }

      touchStartX = null;
      touchStartY = null;
    }, { passive: true });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopMobileTimer();
    } else {
      startMobileTimer();
    }
  });

  /* =========================================================
     SCROLL PROGRESS
  ========================================================= */

  function updateTeamScroll() {
    if (
      !track ||
      !members.length ||
      isMobileTeam()
    ) {
      return;
    }

    const rect = track.getBoundingClientRect();

    const span = Math.max(
      1,
      rect.height - window.innerHeight
    );

    const progress = Math.min(
      1,
      Math.max(0, -rect.top / span)
    );

    const index = Math.min(
      members.length - 1,
      Math.floor(progress * members.length)
    );

    setMember(index);
  }

  let scrollFrame = 0;

  function onScroll() {
    scrollFrame = 0;

    const max =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress = max > 0
      ? window.scrollY / max
      : 0;

    const progressBar = $("#pg");

    if (progressBar) {
      progressBar.style.transform =
        `scaleX(${progress})`;
    }

    updateNavbar();
    updateTeamScroll();
  }

  function requestScroll() {
    if (!scrollFrame) {
      scrollFrame = requestAnimationFrame(onScroll);
    }
  }

  if (!$("#pg")) {
    const progressBar = document.createElement("div");

    progressBar.id = "pg";

    document.body.appendChild(progressBar);
  }

  window.addEventListener("scroll", requestScroll, {
    passive: true
  });

  window.addEventListener("resize", () => {
    sizeTrack();
    startMobileTimer();
    requestScroll();
  });

  updateNavbar();
  requestScroll();

  /* =========================================================
     REVEAL ANIMATIONS
  ========================================================= */

  function countUp(element) {
    if (element.dataset.counted === "true") return;

    const target = Number(element.dataset.n);

    if (!Number.isFinite(target)) return;

    element.dataset.counted = "true";

    if (reducedMotion) {
      element.textContent = String(target);
      return;
    }

    const start = performance.now();
    const duration = 1300;

    function animate(now) {
      const progress = Math.min(
        1,
        (now - start) / duration
      );

      const value = Math.round(
        target * (1 - Math.pow(1 - progress, 3))
      );

      element.textContent = String(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  const revealElements = $$(".rv");

  if (
    "IntersectionObserver" in window &&
    !reducedMotion
  ) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("in");

          const counter = $("[data-n]", entry.target);

          if (counter) countUp(counter);

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );

    revealElements.forEach((element, index) => {
      element.style.transitionDelay =
        `${(index % 4) * 70}ms`;

      observer.observe(element);
    });

  } else {
    revealElements.forEach(element => {
      element.classList.add("in");
    });

    $$("[data-n]").forEach(countUp);
  }

  /* =========================================================
     GSAP ENHANCEMENTS
  ========================================================= */

  function initGSAP() {
    if (
      reducedMotion ||
      !window.gsap ||
      !window.ScrollTrigger
    ) {
      return;
    }

    const gsap = window.gsap;

    gsap.registerPlugin(window.ScrollTrigger);

    const heroItems = $$(
      ".hero .mono, .hero h1, .hero .lead, .hero .acts"
    );

    if (heroItems.length) {
      gsap.fromTo(
        heroItems,
        {
          y: 30,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.2,
          clearProps: "transform,opacity"
        }
      );
    }

    $$(".gsap-reveal").forEach(element => {
      gsap.fromTo(
        element,
        {
          y: 34,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true
          }
        }
      );
    });
  }

  if (document.readyState === "complete") {
    initGSAP();
  } else {
    window.addEventListener("load", initGSAP, { once: true });
  }

  /* =========================================================
     CONTACT FORM
  ========================================================= */

  const contactForm = $("#f");

  if (contactForm) {
    contactForm.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(contactForm);

      const body = [
        `Name: ${data.get("name") || ""}`,
        `Email: ${data.get("email") || ""}`,
        `Branch/Year: ${data.get("by") || ""}`,
        `Interest: ${data.get("int") || ""}`,
        "",
        String(data.get("msg") || "")
      ].join("\n");

      const subject = encodeURIComponent(
        "VISTAS ACM membership request"
      );

      location.href =
        `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;

      setText(
        $("#ok"),
        "Opening your email application."
      );
    });
  }

  /* =========================================================
     PAGE TRANSITIONS
  ========================================================= */

  function wipeIn(callback) {
    if (!wipe || reducedMotion) {
      callback();
      return;
    }

    wipe.style.animation = "none";
    wipe.style.transition = "none";
    wipe.style.transform = "translateY(100%)";

    void wipe.offsetWidth;

    wipe.style.transition =
      "transform .55s cubic-bezier(.7,0,.2,1)";

    wipe.style.transform = "translateY(0)";

    setTimeout(callback, 560);
  }

  function wipeOut() {
    if (!wipe || reducedMotion) return;

    wipe.style.animation = "none";

    wipe.style.transition =
      "transform .7s cubic-bezier(.7,0,.2,1)";

    wipe.style.transform = "translateY(-100%)";
  }

  /* =========================================================
     SPA ROUTING
  ========================================================= */

  const TITLES = window.TITLES || {};

  function routeSPA(first = false) {
    let page = location.hash.slice(1);

    if (!TITLES[page]) {
      page = "home";
    }

    $$(".view").forEach(view => {
      view.hidden = view.id !== `v-${page}`;
    });

    if (TITLES[page]) {
      document.title = TITLES[page];
    }

    document.body.classList.toggle(
      "home",
      page === "home"
    );

    setActiveNavigation(page);

    window.scrollTo({
      top: 0,
      behavior: "instant"
    });

    sizeTrack();
    activeIndex = -1;

    setMember(0);
    updateNavbar();
    closeMenu();

    if (!first) {
      wipeOut();
    }
  }

  if (isSPA) {
    window.addEventListener("hashchange", () => {
      routeSPA(false);
    });

    routeSPA(true);
  }

  /* =========================================================
     INTERNAL PAGE NAVIGATION
  ========================================================= */

  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-p]");

    if (
      !link ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    const href = link.getAttribute("href");

    if (!href || href.startsWith("#")) return;

    let destination;

    try {
      destination = new URL(href, location.href);
    } catch {
      return;
    }

    if (destination.origin !== location.origin) return;

    const page = link.dataset.p;

    if (isSPA) {
      event.preventDefault();

      if (location.hash.slice(1) !== page) {
        wipeIn(() => {
          location.hash = page;
        });
      }

      return;
    }

    if (destination.pathname === location.pathname) return;

    event.preventDefault();

    closeMenu();

    wipeIn(() => {
      location.href = destination.href;
    });
  });

  /* =========================================================
     INITIALIZATION
  ========================================================= */

  console.info("VISTAS ACM website initialized.");

})();

/* =========================================================
   PHASE 8 — ACCESSIBLE BACK-TO-TOP CONTROL
========================================================= */
(() => {
  if (document.querySelector('.vistas-back-top')) return;

  const button = document.createElement('button');
  button.className = 'vistas-back-top';
  button.type = 'button';
  button.setAttribute('aria-label', 'Back to top');
  button.title = 'Back to top';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(button);

  const update = () => {
    button.classList.toggle('is-visible', window.scrollY > 420);
  };

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* =========================================================
   PHASE 9 — LIGHTWEIGHT AMBIENT PARTICLE NETWORK
   Decorative only; disabled for reduced-motion preferences.
========================================================= */
(() => {
  const page = document.body?.dataset?.page;
  if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "vistas-atmosphere-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    canvas.remove();
    return;
  }

  const pointer = { x: -1000, y: -1000 };
  let points = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let running = !document.hidden;
  let lastFrame = 0;

  const isSmall = window.matchMedia("(max-width: 700px)").matches;
  const count = isSmall ? 24 : 48;
  const connectionDistance = isSmall ? 92 : 128;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .20,
      vy: (Math.random() - .5) * .20,
      radius: Math.random() * 1.15 + .45,
      alpha: Math.random() * .28 + .12
    }));
  }

  function draw(timestamp) {
    if (!running) return;
    frame = requestAnimationFrame(draw);

    // Cap the decorative effect at roughly 30fps.
    if (timestamp - lastFrame < 32) return;
    lastFrame = timestamp;

    context.clearRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      point.x += point.vx;
      point.y += point.vy;

      if (point.x < -8 || point.x > width + 8) point.vx *= -1;
      if (point.y < -8 || point.y > height + 8) point.vy *= -1;

      const dx = pointer.x - point.x;
      const dy = pointer.y - point.y;
      const distanceToPointer = Math.hypot(dx, dy);

      if (distanceToPointer < 115) {
        point.x -= dx * .00045;
        point.y -= dy * .00045;
      }

      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(115, 190, 255, ${point.alpha})`;
      context.fill();

      for (let j = i + 1; j < points.length; j++) {
        const other = points[j];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);

        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * .105;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(65, 151, 235, ${opacity})`;
          context.lineWidth = .7;
          context.stroke();
        }
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  frame = requestAnimationFrame(draw);
})();


/* =========================================================
   PHASE 9.1 — GLOBAL TOPOGRAPHIC BACKGROUND VIDEO
   Injected only on public pages (body[data-page]); the
   admin dashboard is intentionally left unchanged.
========================================================= */
(() => {
  const body = document.body;
  if (!body || !body.matches("[data-page]")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.getElementById("vistas-bg-motion")) return;

  const layer = document.createElement("div");
  layer.className = "vistas-bg-motion";
  layer.id = "vistas-bg-motion";
  layer.setAttribute("aria-hidden", "true");

  const video = document.createElement("video");
  video.src = "assets/vistas-topography.mp4";
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  layer.appendChild(video);
  body.prepend(layer);

  const playVideo = () => {
    if (!document.hidden) video.play().catch(() => {});
  };
  const pauseVideo = () => video.pause();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseVideo();
    else playVideo();
  });

  // Start after the page's first paint to avoid delaying content.
  if ("requestIdleCallback" in window) {
    requestIdleCallback(playVideo, { timeout: 1800 });
  } else {
    window.setTimeout(playVideo, 250);
  }
})();
