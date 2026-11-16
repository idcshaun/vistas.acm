import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* VISTAS ACM — public events experience */
const $ = (id) => document.getElementById(id);
const list = $("event-list");
const featured = $("featured-event");
const filters = [...document.querySelectorAll("[data-event-filter]")];
let allEvents = [];
let activeFilter = "all";

const safeURL = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};

const formatDate = (value) => {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: undefined
  }).format(date);
};

const isUpcoming = (event) => event.event_date && new Date(event.event_date).getTime() >= Date.now();

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFeatured(event) {
  const visual = $("featured-visual");
  const title = $("featured-title");
  const description = $("featured-description");
  const date = $("featured-date");
  const meta = $("featured-meta");
  const link = $("featured-link");

  if (!event) {
    title.textContent = "A space to learn, build and connect.";
    description.textContent = "Discover the workshops, talks and experiences organised by the VISTAS ACM Student Chapter.";
    date.textContent = "THE VISTAS ACM PROGRAM";
    meta.replaceChildren();
    link.hidden = true;
    visual.style.removeProperty("--event-image");
    return;
  }

  title.textContent = event.title || "VISTAS ACM Event";
  description.textContent = event.description || "A VISTAS ACM community experience.";
  date.textContent = isUpcoming(event) ? "UP NEXT · " + formatDate(event.event_date).toUpperCase() : "FROM THE CHAPTER ARCHIVE";
  visual.style.setProperty("--event-image", event.image_url ? `url("${safeURL(event.image_url)}")` : "none");

  meta.replaceChildren();
  if (event.venue) meta.append(makeElement("span", "events-meta-item", event.venue));
  if (event.event_date) meta.append(makeElement("span", "events-meta-item", formatDate(event.event_date)));

  const registration = safeURL(event.registration_url);
  link.hidden = !registration;
  if (registration) {
    link.href = registration;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Register / Learn more ↗";
  }
}

function createEventCard(event, index) {
  const article = makeElement("article", "event-card rv");
  article.style.setProperty("--event-order", String(index));

  const media = makeElement("div", "event-card-media");
  if (event.image_url && safeURL(event.image_url)) {
    const img = document.createElement("img");
    img.src = safeURL(event.image_url);
    img.alt = event.title ? `${event.title} event` : "VISTAS ACM event";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => img.remove();
    media.append(img);
  }
  media.append(makeElement("span", "event-card-number", String(index + 1).padStart(2, "0")));

  const body = makeElement("div", "event-card-body");
  const dateLine = makeElement("span", "mono event-card-date", formatDate(event.event_date));
  const heading = makeElement("h3", "", event.title || "VISTAS ACM Event");
  const description = makeElement("p", "event-card-description", event.description || "More details about this event will be shared soon.");
  const footer = makeElement("div", "event-card-footer");
  const venue = makeElement("span", "event-card-venue", event.venue || "VISTAS ACM");
  footer.append(venue);

  const registration = safeURL(event.registration_url);
  if (registration) {
    const anchor = makeElement("a", "event-card-link", "Explore ↗");
    anchor.href = registration;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.setAttribute("aria-label", `Explore ${event.title || "event"}`);
    footer.append(anchor);
  } else {
    footer.append(makeElement("span", "event-card-status", isUpcoming(event) ? "UPCOMING" : "COMPLETED"));
  }

  body.append(dateLine, heading, description, footer);
  article.append(media, body);
  return article;
}

function renderList() {
  list.replaceChildren();
  const filtered = allEvents.filter((event) => {
    if (activeFilter === "upcoming") return isUpcoming(event);
    if (activeFilter === "past") return !isUpcoming(event);
    return true;
  });

  if (!filtered.length) {
    const empty = makeElement("div", "events-empty");
    empty.append(
      makeElement("span", "mono", activeFilter === "upcoming" ? "NOTHING SCHEDULED JUST YET" : "NO EVENTS TO SHOW"),
      makeElement("h3", "", activeFilter === "upcoming" ? "Something is in the works." : "The next chapter starts here."),
      makeElement("p", "", activeFilter === "upcoming" ? "Check back soon for upcoming VISTAS ACM events." : "Published events will appear here once they are added by the chapter team.")
    );
    list.append(empty);
    return;
  }

  filtered.forEach((event, index) => list.append(createEventCard(event, index)));
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

function setFilter(filter) {
  activeFilter = filter;
  filters.forEach((button) => {
    const active = button.dataset.eventFilter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderList();
}

filters.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.eventFilter)));

async function init() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load website configuration.");
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseKey) throw new Error("Supabase configuration is incomplete.");

    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    const { data, error } = await supabase
      .from("events")
      .select("title, slug, description, event_date, venue, image_url, registration_url, status")
      .eq("status", "published")
      .order("event_date", { ascending: true, nullsFirst: false });

    if (error) throw error;
    allEvents = data || [];

    const featuredEvent = allEvents.find(isUpcoming) || [...allEvents].sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))[0] || null;
    renderFeatured(featuredEvent);
    renderList();
    const footnote = $("events-footnote");
    if (footnote) footnote.textContent = `${allEvents.length} published ${allEvents.length === 1 ? "event" : "events"} from the VISTAS ACM chapter.`;
  } catch (error) {
    console.error("[Public Events]", error);
    list.replaceChildren();
    const message = makeElement("div", "events-empty");
    message.append(
      makeElement("span", "mono", "EVENTS UNAVAILABLE"),
      makeElement("h3", "", "We couldn't load the event program."),
      makeElement("p", "", "Please try again in a little while.")
    );
    list.append(message);
  }
}

init();
