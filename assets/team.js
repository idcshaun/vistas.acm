// =============================================
// VISTAS ACM — PUBLIC TEAM CAROUSEL
// =============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

const HUES = [210, 222, 200, 235, 190, 215, 228, 205, 218, 195];
const FALLBACK_IMG = "assets/vistas-acm-blue-logo.jpg";

const track = $("tk");
const stage = track?.querySelector(".tstage");
const section = $("team");
const wds = $("wds");
const sls = $("sls");
const info = $("info");
const bar = document.querySelector(".cnt .bar");

let members = [];
let active = -1;
let swapTimer = null;
let ticking = false;

// ---------- Load ----------
async function load() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Config unavailable");
    const cfg = await res.json();

    const supabase = createClient(cfg.supabaseUrl, cfg.supabaseKey);

    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, designation, domain, bio, image_url, linkedin_url, instagram_url, github_url, display_order")
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (error) throw error;
    members = data || [];
  } catch (err) {
    console.error("Team load error:", err);
    members = [];
  }

  if (!members.length) {
    $("nm").textContent = "Team coming soon";
    $("rl").textContent = "Check back shortly.";
    $("hn").hidden = true;
    track.style.setProperty("--n", 1);
    return;
  }

  build();
  update();
}

// ---------- Build ----------
function build() {
  const n = members.length;

  track.style.setProperty("--n", n);
  $("team-count").textContent = n === 1 ? "one member" : `${n} members`;
  $("ct-total").textContent = `/ ${pad(n)}`;

  members.forEach((m, i) => {
    // Big background word
    const word = (m.domain || m.designation || "Team").toUpperCase();
    const w = document.createElement("div");
    w.className = "wd " + (word.length > 14 ? "xl" : word.length > 8 ? "long" : "");
    w.textContent = word;
    w.setAttribute("aria-hidden", "true");
    wds.appendChild(w);

    // Portrait
    const s = document.createElement("div");
    s.className = "sl";
    const img = new Image();
    img.decoding = "async";
    img.alt = m.name || "";
    if (i > 1) img.loading = "lazy";
    if (m.image_url) {
      img.src = m.image_url;
    } else {
      img.src = FALLBACK_IMG;
      s.classList.add("noimg");
    }
    s.appendChild(img);
    sls.appendChild(s);
  });

  // Tap bio to expand / collapse
  $("bio").addEventListener("click", (e) => e.currentTarget.classList.toggle("open"));
}

// ---------- Member info ----------
function safeUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

function fillInfo(m) {
  $("in").textContent = pad(active + 1);
  $("nm").textContent = m.name || "";
  $("rl").textContent = m.designation || "";

  const tm = $("tm");
  tm.textContent = m.domain || "";
  tm.hidden = !m.domain;

  const bio = $("bio");
  bio.textContent = m.bio || "";
  bio.classList.remove("open");
  bio.hidden = !m.bio;

  const links = {
    "s-li": safeUrl(m.linkedin_url),
    "s-gh": safeUrl(m.github_url),
    "s-ig": safeUrl(m.instagram_url)
  };

  let any = false;
  for (const [id, url] of Object.entries(links)) {
    const a = $(id);
    if (url) {
      a.href = url;
      a.hidden = false;
      any = true;
    } else {
      a.hidden = true;
      a.removeAttribute("href");
    }
  }
  $("soc").hidden = !any;
}

// ---------- Activate a member ----------
function setActive(i) {
  if (i === active) return;
  const first = active === -1;
  active = i;

  [...wds.children].forEach((el, k) => {
    el.classList.toggle("on", k === i);
    el.classList.toggle("up", k < i);
  });
  [...sls.children].forEach((el, k) => {
    el.classList.toggle("on", k === i);
    el.classList.toggle("up", k < i);
  });

  section.style.setProperty("--h", HUES[i % HUES.length]);
  $("ct").textContent = pad(i + 1);

  if (first) {
    fillInfo(members[i]);
  } else {
    info.classList.add("out");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      fillInfo(members[active]);
      info.classList.remove("out");
    }, 200);
  }
}

// ---------- Scroll-driven ----------
function update() {
  ticking = false;
  if (!members.length) return;

  const rect = track.getBoundingClientRect();
  const total = track.offsetHeight - window.innerHeight;
  const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
  const i = Math.min(members.length - 1, Math.floor(p * members.length));

  setActive(i);
  bar?.style.setProperty("--p", p.toFixed(3));
  $("hn").style.opacity = p > 0.02 ? "0" : "1";
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

load();