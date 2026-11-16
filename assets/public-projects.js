import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* VISTAS ACM — public projects showcase */
const $ = (id) => document.getElementById(id);
const grid = $("projects-grid");
const featured = $("project-featured");
const filtersEl = $("project-filters");
const countEl = $("projects-count");

let projects = [];
let activeCategory = "all";

const safeURL = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function setImage(container, url, alt) {
  const safe = safeURL(url);
  if (!safe) return;
  const img = document.createElement("img");
  img.src = safe;
  img.alt = alt || "VISTAS ACM project";
  img.loading = "lazy";
  img.decoding = "async";
  img.onerror = () => img.remove();
  container.append(img);
}

function renderFeatured(project) {
  const media = $("project-featured-media");
  const category = $("project-featured-category");
  const title = $("project-featured-title");
  const description = $("project-featured-description");
  const link = $("project-featured-link");
  media.replaceChildren();

  if (!project) {
    category.textContent = "THE VISTAS ACM PROJECT SPACE";
    title.textContent = "Ideas deserve to be built.";
    description.textContent = "A showcase of experiments, useful tools and collaborative work from our community.";
    link.hidden = true;
    return;
  }

  category.textContent = (project.category || "COMMUNITY PROJECT").toUpperCase();
  title.textContent = project.title || "Untitled project";
  description.textContent = project.description || "A project built by the VISTAS ACM community.";
  setImage(media, project.image_url, project.title);
  const url = safeURL(project.project_url);
  link.hidden = !url;
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
}

function createCard(project, index) {
  const article = node("article", "project-showcase-card rv");
  article.style.setProperty("--project-order", String(index));

  const visual = node("div", "project-card-visual");
  setImage(visual, project.image_url, project.title);
  visual.append(node("span", "project-card-index", String(index + 1).padStart(2, "0")));

  const body = node("div", "project-card-body");
  const category = node("span", "project-card-category mono", project.category || "COMMUNITY PROJECT");
  const title = node("h3", "", project.title || "Untitled project");
  const description = node("p", "project-card-description", project.description || "More details about this project will be shared soon.");
  const footer = node("div", "project-card-footer");
  footer.append(node("span", "project-card-label mono", "VISTAS ACM / PROJECT"));

  const url = safeURL(project.project_url);
  if (url) {
    const anchor = node("a", "project-card-link", "View project ↗");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.setAttribute("aria-label", `View ${project.title || "project"}`);
    footer.append(anchor);
  } else {
    footer.append(node("span", "project-card-label mono", "SHOWCASE"));
  }

  body.append(category, title, description, footer);
  article.append(visual, body);
  return article;
}

function renderFilters() {
  filtersEl.replaceChildren();
  const categories = [...new Set(projects.map(p => (p.category || "Other").trim()).filter(Boolean))];
  const values = ["all", ...categories];
  values.forEach(category => {
    const button = node("button", "project-filter", category === "all" ? "All projects" : category);
    button.type = "button";
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.classList.toggle("is-active", category === activeCategory);
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFilters();
      renderGrid();
    });
    filtersEl.append(button);
  });
}

function renderGrid() {
  grid.replaceChildren();
  const filtered = projects.filter(project => activeCategory === "all" || (project.category || "Other").trim() === activeCategory);
  countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "PROJECT" : "PROJECTS"}`;

  if (!filtered.length) {
    const empty = node("div", "projects-empty");
    empty.append(
      node("span", "mono", "NOTHING IN THIS CATEGORY YET"),
      node("h3", "", "More ideas are taking shape."),
      node("p", "", "Choose another category to explore published projects.")
    );
    grid.append(empty);
    return;
  }

  filtered.forEach((project, index) => grid.append(createCard(project, index)));
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

async function init() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load website configuration.");
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseKey) throw new Error("Supabase configuration is incomplete.");

    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    const { data, error } = await supabase
      .from("projects")
      .select("title, description, category, image_url, project_url, status")
      .eq("status", "published")
      .order("title", { ascending: true });

    if (error) throw error;
    projects = data || [];
    renderFeatured(projects[0] || null);
    renderFilters();
    renderGrid();
    const note = $("projects-footnote");
    if (note) note.textContent = `${projects.length} published ${projects.length === 1 ? "project" : "projects"} from the VISTAS ACM community.`;
  } catch (error) {
    console.error("[Public Projects]", error);
    grid.replaceChildren();
    const message = node("div", "projects-empty");
    message.append(
      node("span", "mono", "PROJECTS UNAVAILABLE"),
      node("h3", "", "We couldn't load the project showcase."),
      node("p", "", "Please try again in a little while.")
    );
    grid.append(message);
  }
}

init();
