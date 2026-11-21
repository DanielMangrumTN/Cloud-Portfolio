// ============================================================
// Cloud Portfolio — page behavior
//   1. Tabs: show one section (About / Resume / Projects / Contact)
//      at a time, based on the address (#about, #projects, ...)
//   2. Sidebar "Show contacts" button on small screens
//   3. Skill bars
//   4. Load projects from data/projects.json, draw cards, filter
//   5. Visitor count (once the API exists in Phase 4)
// ============================================================

const PAGES = ["about", "resume", "projects", "contact"];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  setUpTabs();
  setUpSidebarToggle();
  loadProjects();
  loadVisitorCount();
});

// ---------- 1. Tabs ----------

function setUpTabs() {
  window.addEventListener("hashchange", showCurrentPage);
  showCurrentPage();
}

function showCurrentPage() {
  const requested = location.hash.slice(1);
  const page = PAGES.includes(requested) ? requested : "about";

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.page === page);
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isActive = link.dataset.target === page;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (page === "resume") animateSkills();
  if (requested) window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- 2. Sidebar toggle (small screens) ----------

function setUpSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const button = document.getElementById("contacts-toggle");
  button.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    button.setAttribute("aria-expanded", open);
    button.querySelector("span").textContent = open ? "Hide contacts" : "Show contacts";
  });
}

// ---------- 3. Skill bars ----------

function animateSkills() {
  document.querySelectorAll(".skill").forEach((skill) => {
    const level = Math.max(0, Math.min(100, Number(skill.dataset.level) || 0));
    skill.querySelector("data").textContent = level + "%";
    skill.querySelector("data").value = level;
    const fill = skill.querySelector(".skill-fill");
    fill.style.width = "0";
    // a short delay so the bar visibly grows from 0
    setTimeout(() => (fill.style.width = level + "%"), 60);
  });
}

// ---------- 4. Projects ----------

async function loadProjects() {
  const featured = document.getElementById("featured-projects");
  const list = document.getElementById("project-list");

  let projects;
  try {
    const response = await fetch("data/projects.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    projects = await response.json();
  } catch (err) {
    const message = "Couldn't load projects. (Opening the file directly? Run a local server instead; see the README.)";
    [featured, list].forEach((el) => showEmpty(el, message));
    console.error("Failed to load projects:", err);
    return;
  }

  // Newest first. Dates are "YYYY-MM", so text sorting works.
  projects.sort((a, b) => b.date.localeCompare(a.date));

  renderProjects(featured, projects.slice(0, 3));
  setUpFilters(list, projects);
}

function setUpFilters(list, projects) {
  const state = { source: "all", tech: "all" };

  // Source tabs (All / WGU / Personal) are already in the HTML.
  document.querySelectorAll("#source-filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.source = btn.dataset.source;
      setActive("#source-filters", btn);
      apply();
    });
  });

  // Technology chips are built from whatever tech the projects use.
  const techBox = document.getElementById("tech-filters");
  const allTech = [...new Set(projects.flatMap((p) => p.tech))].sort();
  ["all", ...allTech].forEach((tech) => {
    const btn = el("button", tech === "all" ? "active" : "", tech === "all" ? "Any technology" : tech);
    btn.addEventListener("click", () => {
      state.tech = tech;
      setActive("#tech-filters", btn);
      apply();
    });
    techBox.appendChild(btn);
  });

  function apply() {
    const shown = projects.filter(
      (p) =>
        (state.source === "all" || p.source === state.source) &&
        (state.tech === "all" || p.tech.includes(state.tech))
    );
    renderProjects(list, shown);
  }

  apply();
}

function setActive(groupSelector, activeBtn) {
  document.querySelectorAll(`${groupSelector} button`).forEach((b) => b.classList.remove("active"));
  activeBtn.classList.add("active");
}

function renderProjects(container, projects) {
  container.replaceChildren();
  if (projects.length === 0) {
    showEmpty(container, "No projects match these filters yet.");
    return;
  }
  projects.forEach((p) => container.appendChild(projectCard(p)));
}

// Builds one card. Uses textContent (never innerHTML) for text from the
// data file, so it can't inject HTML into the page: a good security habit.
function projectCard(p) {
  const card = el("li", "project-card");

  // Thumbnail: a screenshot if the project has one, otherwise a cloud icon.
  const thumb = el("div", "project-thumb");
  if (p.image) {
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.title;
    img.loading = "lazy";
    thumb.appendChild(img);
  } else {
    thumb.appendChild(svgIcon("i-cloud"));
  }
  card.appendChild(thumb);

  card.appendChild(el("h3", "", p.title));
  card.appendChild(el("span", "project-category", `${p.source} · ${p.status} · ${formatDate(p.date)}`));
  card.appendChild(el("p", "project-summary", p.summary));

  const tags = el("div", "tags");
  p.tech.forEach((t) => tags.appendChild(el("span", "tag", t)));
  card.appendChild(tags);

  const links = el("div", "project-links");
  const labels = { repo: "Code", live: "Live site", writeup: "Write-up" };
  Object.entries(labels).forEach(([key, label]) => {
    const url = p.links && p.links[key];
    if (url) {
      const a = el("a", "", label + " →");
      a.href = url;
      links.appendChild(a);
    }
  });
  if (links.children.length) card.appendChild(links);

  return card;
}

// ---------- 5. Visitor counter (Phase 4) ----------

async function loadVisitorCount() {
  const target = document.getElementById("visitor-count");
  const url = window.SITE_CONFIG && window.SITE_CONFIG.counterApiUrl;
  if (!target || !url) return; // no API yet: leave the "—"

  try {
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();
    target.textContent = Number(data.count).toLocaleString();
  } catch (err) {
    console.error("Visitor counter failed:", err);
  }
}

// ---------- Small helpers ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgIcon(id) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "icon");
  const use = document.createElementNS(ns, "use");
  use.setAttribute("href", "#" + id);
  svg.appendChild(use);
  return svg;
}

function showEmpty(container, message) {
  container.replaceChildren(el("li", "empty", message));
}

function formatDate(yyyyMm) {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
