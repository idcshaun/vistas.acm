import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* VISTAS ACM — public gallery archive */
const $ = (id) => document.getElementById(id);
const grid = $("gallery-grid");
const filtersEl = $("gallery-filters");
const countEl = $("gallery-count");
const lightbox = $("gallery-lightbox");
const lightboxImage = $("gallery-lightbox-image");
const lightboxTitle = $("gallery-lightbox-title");
const lightboxDescription = $("gallery-lightbox-description");
const lightboxEvent = $("gallery-lightbox-event");

let items = [];
let visibleItems = [];
let activeEvent = "all";
let activeIndex = 0;
let lastFocused = null;

const safeURL = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderFilters() {
  filtersEl.replaceChildren();
  const events = [...new Set(items.map(item => (item.event_name || "Community").trim()).filter(Boolean))];
  ["all", ...events].forEach(value => {
    const button = node("button", "gallery-filter", value === "all" ? "All moments" : value);
    button.type = "button";
    button.setAttribute("aria-pressed", String(activeEvent === value));
    button.classList.toggle("is-active", activeEvent === value);
    button.addEventListener("click", () => {
      activeEvent = value;
      renderFilters();
      renderGrid();
    });
    filtersEl.append(button);
  });
}

function createCard(item, index) {
  const button = node("button", "gallery-tile");
  button.type = "button";
  button.setAttribute("aria-label", `View ${item.title || item.event_name || "gallery image"}`);
  button.style.setProperty("--tile-index", index % 8);
  const image = document.createElement("img");
  image.src = safeURL(item.media_url);
  image.alt = item.title || `${item.event_name || "VISTAS ACM"} gallery photograph`;
  image.loading = "lazy";
  image.decoding = "async";
  image.onerror = () => button.remove();
  const overlay = node("span", "gallery-tile-overlay");
  const meta = node("span", "gallery-tile-meta mono", item.event_name || "VISTAS ACM / COMMUNITY");
  const title = node("strong", "gallery-tile-title", item.title || "A moment from the chapter");
  const expand = node("span", "gallery-tile-expand", "↗");
  overlay.append(meta, title, expand);
  button.append(image, overlay);
  button.addEventListener("click", () => openLightbox(item, index));
  return button;
}

function renderGrid() {
  visibleItems = items.filter(item => activeEvent === "all" || (item.event_name || "Community").trim() === activeEvent);
  countEl.textContent = String(visibleItems.length).padStart(2, "0");
  grid.replaceChildren();
  if (!visibleItems.length) {
    const state = node("div", "gallery-state");
    state.append(node("span", "mono", "NO FRAMES IN THIS COLLECTION"), node("p", "", "Try another event or check back as new moments are added."));
    grid.append(state);
    return;
  }
  visibleItems.forEach((item, index) => grid.append(createCard(item, index)));
}

function updateLightbox() {
  const item = visibleItems[activeIndex];
  if (!item) return;
  lightboxImage.src = safeURL(item.media_url);
  lightboxImage.alt = item.title || "VISTAS ACM gallery photograph";
  lightboxTitle.textContent = item.title || "A moment from the chapter";
  lightboxDescription.textContent = item.description || "";
  lightboxEvent.textContent = item.event_name || "VISTAS ACM / COMMUNITY";
}

function openLightbox(item, index) {
  lastFocused = document.activeElement;
  activeIndex = index;
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-viewer-open");
  $("gallery-lightbox-close").focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gallery-viewer-open");
  lightboxImage.removeAttribute("src");
  lastFocused?.focus?.();
}

function moveLightbox(direction) {
  if (!visibleItems.length) return;
  activeIndex = (activeIndex + direction + visibleItems.length) % visibleItems.length;
  updateLightbox();
}

async function init() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load website configuration.");
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseKey) throw new Error("Supabase configuration is incomplete.");
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    const { data, error } = await supabase
      .from("gallery")
      .select("title, description, media_url, media_type, event_name, display_order, status")
      .eq("status", "published")
      .eq("media_type", "image")
      .order("display_order", { ascending: true });
    if (error) throw error;
    items = (data || []).filter(item => safeURL(item.media_url));
    renderFilters();
    renderGrid();
    if (!items.length) {
      const state = node("div", "gallery-state");
      state.append(node("span", "mono", "THE ARCHIVE IS TAKING SHAPE"), node("p", "", "Published photographs will appear here as the chapter adds them through the gallery manager."));
      grid.replaceChildren(state);
    }
  } catch (error) {
    console.error("[Public Gallery]", error);
    grid.replaceChildren();
    const state = node("div", "gallery-state");
    state.append(node("span", "mono", "ARCHIVE UNAVAILABLE"), node("p", "", "We couldn't load the gallery right now. Please try again shortly."));
    grid.append(state);
  }
}

$("gallery-lightbox-close")?.addEventListener("click", closeLightbox);
$("gallery-prev")?.addEventListener("click", () => moveLightbox(-1));
$("gallery-next")?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", event => {
  if (!lightbox?.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

init();
