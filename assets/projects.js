// =============================================
// VISTAS ACM — PROJECT MANAGEMENT
// CONTROL CENTER V2
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase = null;
let currentUser = null;
let projects = [];
let existingImageUrl = null;

const $ = (id) => document.getElementById(id);


// =============================================
// DOM ELEMENTS
// =============================================

const elements = {

    adminName: $("admin-name"),
    adminRole: $("admin-role"),
    adminAvatar: $("admin-avatar"),

    topbarAvatar: $("topbar-avatar"),
    topbarName: $("topbar-name"),

    logout: $("logout-btn"),
    menuToggle: $("menu-toggle"),

    addButton: $("add-project-btn"),

    total: $("total-projects"),
    published: $("published-projects"),
    drafts: $("draft-projects"),
    categories: $("project-categories"),

    search: $("project-search"),
    statusFilter: $("project-status-filter"),
    categoryFilter: $("project-category-filter"),

    table: $("projects-table-body"),
    message: $("project-message"),

    modal: $("project-modal"),
    modalTitle: $("project-modal-title"),
    closeModal: $("close-project-modal"),

    form: $("project-form"),
    id: $("project-id"),
    title: $("project-title"),
    description: $("project-description"),
    category: $("project-category"),
    status: $("project-status"),

    image: $("project-image"),
    imagePreview: $("project-image-preview"),
    previewImage: $("project-preview-image"),
    removeImage: $("remove-project-image"),
    uploadStatus: $("project-upload-status"),

    url: $("project-url"),

    cancel: $("cancel-project"),
    save: $("save-project")

};


// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

    try {

        if (
            !elements.form ||
            !elements.addButton ||
            !elements.table ||
            !elements.modal
        ) {
            throw new Error(
                "Project page elements are missing. Check projects.html."
            );
        }

        // Fetch Supabase configuration
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Unable to load application configuration.");
        }

        const config = await response.json();

        // IMPORTANT: Correct configuration property names
        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        // Initialize Supabase
        supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        // Verify administrator
        const authorized = await verifyAdmin();

        if (!authorized) return;

        // Setup interactions
        setupEventListeners();

        // Load projects
        await loadProjects();

        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (error) {

        console.error("Project initialization error:", error);

        showMessage(
            error.message || "Unable to initialize project management.",
            "error"
        );

    }
}


// =============================================
// AUTHENTICATION
// =============================================

async function verifyAdmin() {

    try {

        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {

            window.location.href = "/admin/login.html";

            return false;
        }

        currentUser = user;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

        if (
            profileError ||
            !profile ||
            !["admin", "editor"].includes(profile.role)
        ) {

            await supabase.auth.signOut();

            window.location.href = "/admin/login.html";

            return false;
        }

        // Profile information
        const fullName = profile.full_name || "Administrator";

        const firstName = fullName
            .trim()
            .split(/\s+/)[0] || "Admin";

        const initials = fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase() || "VA";

        // Sidebar
        if (elements.adminName) {
            elements.adminName.textContent = fullName;
        }

        if (elements.adminRole) {
            elements.adminRole.textContent = profile.role.toUpperCase();
        }

        if (elements.adminAvatar) {
            elements.adminAvatar.textContent = initials;
        }

        // Topbar
        if (elements.topbarAvatar) {
            elements.topbarAvatar.textContent = initials;
        }

        if (elements.topbarName) {
            elements.topbarName.textContent = firstName;
        }

        sessionStorage.setItem("admin_name", fullName);

        return true;

    } catch (error) {

        console.error("Project authentication error:", error);

        window.location.href = "/admin/login.html";

        return false;
    }
}


// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {

    // Add project
    elements.addButton?.addEventListener(
        "click",
        openCreateModal
    );

    // Modal controls
    elements.closeModal?.addEventListener(
        "click",
        closeModal
    );

    elements.cancel?.addEventListener(
        "click",
        closeModal
    );

    // Form submission
    elements.form?.addEventListener(
        "submit",
        saveProject
    );

    // Search
    elements.search?.addEventListener(
        "input",
        renderProjects
    );

    // Filters
    elements.statusFilter?.addEventListener(
        "change",
        renderProjects
    );

    elements.categoryFilter?.addEventListener(
        "change",
        renderProjects
    );

    // Image controls
    elements.image?.addEventListener(
        "change",
        previewImage
    );

    elements.removeImage?.addEventListener(
        "click",
        removeSelectedImage
    );

    // Logout
    elements.logout?.addEventListener(
        "click",
        logout
    );

    // Close modal by clicking outside
    elements.modal?.addEventListener("click", (event) => {

        if (event.target === elements.modal) {
            closeModal();
        }

    });

    // Table actions
    elements.table?.addEventListener("click", (event) => {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const { action, id } = button.dataset;

        if (!id) return;

        if (action === "edit") {
            editProject(id);
        }

        if (action === "delete") {
            deleteProject(id);
        }

    });

    // Escape key
    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            elements.modal?.classList.contains("active")
        ) {
            closeModal();
        }

    });

}


// =============================================
// LOAD PROJECTS
// =============================================

async function loadProjects() {

    if (!supabase) return;

    showMessage("Loading projects...", "info");

    try {

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) throw error;

        projects = data || [];

        updateStatistics();

        populateCategoryFilter();

        renderProjects();

        showMessage("", "");

    } catch (error) {

        console.error("Load projects error:", error);

        showMessage(
            error.message || "Failed to load projects.",
            "error"
        );
    }
}


// =============================================
// STATISTICS
// =============================================

function updateStatistics() {

    const published = projects.filter(
        project => project.status === "published"
    ).length;

    const drafts = projects.filter(
        project => project.status === "draft"
    ).length;

    const categories = new Set(
        projects
            .map(project => project.category)
            .filter(Boolean)
    );

    if (elements.total) {
        elements.total.textContent = projects.length;
    }

    if (elements.published) {
        elements.published.textContent = published;
    }

    if (elements.drafts) {
        elements.drafts.textContent = drafts;
    }

    if (elements.categories) {
        elements.categories.textContent = categories.size;
    }
}


// =============================================
// CATEGORY FILTER
// =============================================

function populateCategoryFilter() {

    if (!elements.categoryFilter) return;

    const currentValue = elements.categoryFilter.value;

    const categories = [
        ...new Set(
            projects
                .map(project => project.category)
                .filter(Boolean)
        )
    ].sort();

    elements.categoryFilter.innerHTML = `
        <option value="all">All Categories</option>
    `;

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        elements.categoryFilter.appendChild(option);

    });

    if (categories.includes(currentValue)) {
        elements.categoryFilter.value = currentValue;
    }
}


// =============================================
// RENDER PROJECTS
// =============================================

function renderProjects() {

    if (!elements.table) return;

    const search =
        elements.search?.value.trim().toLowerCase() || "";

    const status =
        elements.statusFilter?.value || "all";

    const category =
        elements.categoryFilter?.value || "all";

    const filtered = projects.filter(project => {

        const title = (project.title || "").toLowerCase();

        const description =
            (project.description || "").toLowerCase();

        const projectCategory =
            (project.category || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            description.includes(search) ||
            projectCategory.includes(search);

        const matchesStatus =
            status === "all" ||
            project.status === status;

        const matchesCategory =
            category === "all" ||
            project.category === category;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
        );

    });


    if (!filtered.length) {

        elements.table.innerHTML = `
            <tr>
                <td colspan="5" class="table-message">
                    No projects found.
                </td>
            </tr>
        `;

        return;
    }


    elements.table.innerHTML = filtered.map(project => {

        const safeTitle = escapeHTML(
            project.title || "Untitled"
        );

        const safeCategory = escapeHTML(
            project.category || "Uncategorized"
        );

        const safeDescription = escapeHTML(
            project.description || ""
        );

        const safeStatus = [
            "published",
            "draft",
            "archived"
        ].includes(project.status)
            ? project.status
            : "draft";

        const image = project.image_url

            ? `
                <img
                    src="${escapeHTML(project.image_url)}"
                    alt="${safeTitle}"
                    class="project-table-image"
                    loading="lazy"
                >
            `

            : `
                <div class="project-table-placeholder">
                    <i data-lucide="image"></i>
                </div>
            `;

        const projectLink = getSafeExternalUrl(
            project.project_url
        );

        return `
            <tr>

                <td>

                    <div class="project-table-info">

                        ${image}

                        <div>

                            <strong>${safeTitle}</strong>

                            <small>
                                ${safeDescription.slice(0, 65)}
                            </small>

                        </div>

                    </div>

                </td>

                <td>${safeCategory}</td>

                <td>

                    <span class="status-badge status-${safeStatus}">
                        ${safeStatus}
                    </span>

                </td>

                <td>

                    ${
                        projectLink
                            ? `
                                <a
                                    href="${escapeHTML(projectLink)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="table-link"
                                >
                                    Visit project ↗
                                </a>
                            `
                            : "—"
                    }

                </td>

                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="icon-button"
                            data-action="edit"
                            data-id="${escapeHTML(project.id)}"
                            title="Edit project"
                        >

                            <i data-lucide="pencil"></i>

                        </button>

                        <button
                            type="button"
                            class="icon-button delete-action"
                            data-action="delete"
                            data-id="${escapeHTML(project.id)}"
                            title="Delete project"
                        >

                            <i data-lucide="trash-2"></i>

                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");


    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// =============================================
// CREATE PROJECT
// =============================================

function openCreateModal() {

    if (!elements.form || !elements.modal) return;

    elements.form.reset();

    elements.id.value = "";

    existingImageUrl = null;

    if (elements.status) {
        elements.status.value = "draft";
    }

    elements.modalTitle.textContent = "CREATE PROJECT";

    resetImagePreview();

    elements.modal.classList.add("active");
}


// =============================================
// EDIT PROJECT
// =============================================

function editProject(id) {

    const project = projects.find(
        item => String(item.id) === String(id)
    );

    if (!project) {

        showMessage("Project not found.", "error");

        return;
    }

    elements.form.reset();

    elements.id.value = project.id;

    elements.title.value = project.title || "";

    elements.description.value = project.description || "";

    elements.category.value = project.category || "";

    elements.status.value = project.status || "draft";

    elements.url.value = project.project_url || "";

    existingImageUrl = project.image_url || null;

    elements.modalTitle.textContent = "EDIT PROJECT";

    if (existingImageUrl) {

        elements.previewImage.src = existingImageUrl;

        elements.imagePreview.style.display = "block";

    } else {

        resetImagePreview();

    }

    elements.modal.classList.add("active");
}


// =============================================
// CLOSE MODAL
// =============================================

function closeModal() {

    elements.modal?.classList.remove("active");

    elements.form?.reset();

    if (elements.id) {
        elements.id.value = "";
    }

    existingImageUrl = null;

    resetImagePreview();
}


// =============================================
// IMAGE PREVIEW
// =============================================

function previewImage(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        showUploadStatus(
            "Only JPG, PNG and WEBP images are allowed.",
            "error"
        );

        elements.image.value = "";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        showUploadStatus(
            "Image must be smaller than 5 MB.",
            "error"
        );

        elements.image.value = "";

        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        elements.previewImage.src = reader.result;

        elements.imagePreview.style.display = "block";

        showUploadStatus(
            "Image ready to upload.",
            "success"
        );

    };

    reader.onerror = () => {

        showUploadStatus(
            "Unable to preview this image.",
            "error"
        );

        elements.image.value = "";

    };

    reader.readAsDataURL(file);
}


// =============================================
// REMOVE IMAGE
// =============================================

function removeSelectedImage() {

    if (elements.image) {
        elements.image.value = "";
    }

    existingImageUrl = null;

    resetImagePreview();

    showUploadStatus(
        "Image removed. Save to apply changes.",
        "info"
    );
}


// =============================================
// RESET IMAGE PREVIEW
// =============================================

function resetImagePreview() {

    if (elements.previewImage) {
        elements.previewImage.removeAttribute("src");
    }

    if (elements.imagePreview) {
        elements.imagePreview.style.display = "none";
    }

    if (elements.uploadStatus) {
        elements.uploadStatus.textContent = "";
    }

    if (elements.image) {
        elements.image.value = "";
    }
}


// =============================================
// UPLOAD IMAGE TO SUPABASE
// =============================================

async function uploadProjectImage(file) {

    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath =
        `projects/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
        .from("vistas-media")
        .upload(filePath, file, {

            cacheControl: "3600",

            upsert: false,

            contentType: file.type

        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from("vistas-media")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error("Unable to generate project image URL.");
    }

    return data.publicUrl;
}


// =============================================
// SAVE PROJECT
// =============================================

async function saveProject(event) {

    event.preventDefault();

    if (!supabase) return;

    const title = elements.title.value.trim();

    const description = elements.description.value.trim();

    const category = elements.category.value.trim();

    const status = elements.status.value;

    const projectUrl = elements.url.value.trim();

    if (!title) {

        showMessage(
            "Project title is required.",
            "error"
        );

        return;
    }

    if (!["published", "draft", "archived"].includes(status)) {

        showMessage(
            "Please select a valid project status.",
            "error"
        );

        return;
    }

    // Validate project URL if supplied
    if (projectUrl && !getSafeExternalUrl(projectUrl)) {

        showMessage(
            "Please enter a valid HTTP or HTTPS project URL.",
            "error"
        );

        return;
    }

    const originalButtonContent = elements.save.innerHTML;

    elements.save.disabled = true;

    elements.save.textContent = "SAVING...";

    try {

        const file = elements.image.files?.[0];

        let imageUrl = existingImageUrl;

        // Upload new image
        if (file) {

            showUploadStatus(
                "Uploading image...",
                "info"
            );

            imageUrl = await uploadProjectImage(file);

            showUploadStatus(
                "Image uploaded successfully.",
                "success"
            );

        }

        const projectData = {

            title,

            description,

            category,

            image_url: imageUrl,

            project_url: projectUrl || null,

            status

        };

        const projectId = elements.id.value;

        let result;

        if (projectId) {

            // Update project
            result = await supabase
                .from("projects")
                .update(projectData)
                .eq("id", projectId);

        } else {

            // Create project
            result = await supabase
                .from("projects")
                .insert([projectData]);

        }

        if (result.error) {
            throw result.error;
        }

        closeModal();

        showMessage(
            projectId
                ? "Project updated successfully."
                : "Project created successfully.",
            "success"
        );

        await loadProjects();

    } catch (error) {

        console.error("Save project error:", error);

        showMessage(
            error.message || "Unable to save project.",
            "error"
        );

    } finally {

        elements.save.disabled = false;

        elements.save.innerHTML = originalButtonContent;

        if (window.lucide) {
            window.lucide.createIcons();
        }

    }
}


// =============================================
// DELETE PROJECT
// =============================================

async function deleteProject(id) {

    if (!supabase) return;

    const project = projects.find(
        item => String(item.id) === String(id)
    );

    if (!project) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${project.title}"?`
    );

    if (!confirmed) return;

    try {

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        showMessage(
            "Project deleted successfully.",
            "success"
        );

        await loadProjects();

    } catch (error) {

        console.error("Delete project error:", error);

        showMessage(
            error.message || "Unable to delete project.",
            "error"
        );

    }
}


// =============================================
// LOGOUT
// =============================================

async function logout() {

    const confirmed = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    try {

        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        sessionStorage.removeItem("admin_name");

        window.location.href = "/admin/login.html";

    } catch (error) {

        console.error("Logout error:", error);

        alert("Unable to log out. Please try again.");

    }
}


// =============================================
// URL VALIDATION
// =============================================

function getSafeExternalUrl(value) {

    if (!value) return null;

    try {

        const url = new URL(value);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {
            return null;
        }

        return url.href;

    } catch {

        return null;

    }
}


// =============================================
// MESSAGE HELPERS
// =============================================

function showMessage(message, type = "info") {

    if (!elements.message) return;

    elements.message.textContent = message;

    elements.message.className =
        `project-message ${type}`;
}


function showUploadStatus(message, type = "info") {

    if (!elements.uploadStatus) return;

    elements.uploadStatus.textContent = message;

    elements.uploadStatus.className = type;

}


// =============================================
// HTML ESCAPING
// =============================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

    })[character]);

}