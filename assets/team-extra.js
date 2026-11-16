// =============================================
// VISTAS ACM — TEAM EXTRAS (bio + social links)
// Works on top of the existing carousel.
// =============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const $ = (id) => document.getElementById(id);
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const ICONS = {
  li: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  gh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
};

const nameEl = $("nm");
const roleEl = $("rl");
const tagEl = $("tm");
const numEl = $("in");

if (nameEl && roleEl) init();

async function init() {
  // ---- inject bio + social row into the existing .info block ----
  const bio = document.createElement("p");
  bio.id = "bio";
  bio.className = "bio";
  bio.hidden = true;
  bio.title = "Click to expand";
  bio.addEventListener("click", () => bio.classList.toggle("open"));

  const soc = document.createElement("div");
  soc.id = "soc";
  soc.className = "soc";
  soc.hidden = true;
  soc.innerHTML = [
    ["li", "LinkedIn"],
    ["gh", "GitHub"],
    ["ig", "Instagram"]
  ].map(([k, label]) =>
    `<a id="s-${k}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}" hidden>${ICONS[k]}</a>`
  ).join("");

  roleEl.after(bio);
  (tagEl || bio).after(soc);

  // ---- load members ----
  let members = [];
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Config unavailable");
    const cfg = await res.json();
    const supabase = createClient(cfg.supabaseUrl, cfg.supabaseKey);

    const { data, error } = await supabase
      .from("team_members")
      .select("name, designation, bio, linkedin_url, instagram_url, github_url, display_order")
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (error) throw error;
    members = data || [];
  } catch (err) {
    console.error("Team extras error:", err);
    return;
  }

  const byName = new Map(members.map((m) => [norm(m.name), m]));

  const safeUrl = (v) => {
    try {
      const u = new URL(String(v || "").trim());
      return /^https?:$/.test(u.protocol) ? u.href : null;
    } catch { return null; }
  };

  function currentMember() {
    // 1) match by name shown on screen
    const m = byName.get(norm(nameEl.textContent));
    if (m) return m;
    // 2) fall back to the "Member 08" number
    const n = parseInt(numEl?.textContent, 10);
    return Number.isFinite(n) ? members[n - 1] : null;
  }

  function render() {
    const m = currentMember();

    bio.textContent = m?.bio || "";
    bio.classList.remove("open");
    bio.hidden = !m?.bio;

    const links = {
      "s-li": safeUrl(m?.linkedin_url),
      "s-gh": safeUrl(m?.github_url),
      "s-ig": safeUrl(m?.instagram_url)
    };

    let any = false;
    for (const [id, url] of Object.entries(links)) {
      const a = $(id);
      if (url) { a.href = url; a.hidden = false; any = true; }
      else { a.hidden = true; a.removeAttribute("href"); }
    }
    soc.hidden = !any;
  }

  // re-run whenever the carousel changes the member
  new MutationObserver(render).observe(nameEl, {
    childList: true,
    characterData: true,
    subtree: true
  });

  render();
}