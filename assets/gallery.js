// =============================================
// VISTAS ACM — GALLERY MANAGEMENT
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase = null;
let galleryItems = [];
let existingMediaUrl = null;

const $ = (id) => document.getElementById(id);


// =============================================
// DOM ELEMENTS
// =============================================

const el = {
    adminName: $("admin-name"),
    logout: $("logout-btn"),
    menuToggle: $("menu-toggle"),

    addButton: $("add-gallery-btn"),

    total: $("total-media"),
    published: $("published-media"),
    drafts: $("draft-media"),
    events: $("gallery-events"),

    search: $("gallery-search"),
    statusFilter: $("gallery-status-filter"),
    eventFilter: $("gallery-event-filter"),

    grid: $("gallery-grid"),
    message: $("gallery-message"),

    modal: $("gallery-modal"),
    modalTitle: $("gallery-modal-title"),
    closeModal: $("close-gallery-modal"),

    form: $("gallery-form"),
    id: $("gallery-id"),

    title: $("gallery-title"),
    description: $("gallery-description"),
    mediaType: $("gallery-media-type"),
    status: $("gallery-status"),
    eventName: $("gallery-event-name"),

    file: $("gallery-file"),
    filePreview: $("gallery-file-preview"),
    previewImage: $("gallery-preview-image"),
    removeFile: $("remove-gallery-file"),
    uploadStatus: $("gallery-upload-status"),

    order: $("gallery-order"),

    cancel: $("cancel-gallery"),
    save: $("save-gallery")
};


// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

    try {

        // Verify required HTML elements
        if (
            !el.form ||
            !el.addButton ||
            !el.grid ||
            !el.modal
        ) {
            throw new Error(
                "Gallery page elements are missing. Check gallery.html."
            );
        }

        // Load Supabase configuration
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Unable to load Supabase configuration.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        // Initialize Supabase
        supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        // Verify admin access
        const authorized = await verifyAdmin();

        if (!authorized) return;

        // Register event listeners
        setupEventListeners();

        // Load gallery
        await loadGallery();

    } catch (error) {

        console.error("Gallery initialization error:", error);

        showMessage(
            error.message || "Unable to initialize gallery management.",
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

        if (el.adminName) {
            el.adminName.textContent =
                profile.full_name || user.email || "Admin";
        }

        return true;

    } catch (error) {

        console.error("Gallery authentication error:", error);

        window.location.href = "/admin/login.html";

        return false;
    }
}


// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {

    // Add gallery item
    el.addButton?.addEventListener(
        "click",
        openCreateModal
    );

    // Close modal
    el.closeModal?.addEventListener(
        "click",
        closeModal
    );

    el.cancel?.addEventListener(
        "click",
        closeModal
    );

    // Form submission
    el.form?.addEventListener(
        "submit",
        saveGalleryItem
    );

    // Search
    el.search?.addEventListener(
        "input",
        renderGallery
    );

    // Filters
    el.statusFilter?.addEventListener(
        "change",
        renderGallery
    );

    el.eventFilter?.addEventListener(
        "change",
        renderGallery
    );

    // File selection
    el.file?.addEventListener(
        "change",
        previewFile
    );

    // Remove selected image
    el.removeFile?.addEventListener(
        "click",
        removeSelectedFile
    );

    // Logout
    el.logout?.addEventListener(
        "click",
        logout
    );

    // Close modal by clicking outside
    el.modal?.addEventListener("click", (event) => {

        if (event.target === el.modal) {
            closeModal();
        }

    });

    // Gallery card actions
    el.grid?.addEventListener("click", (event) => {

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const { action, id } = button.dataset;

        if (!id) return;

        if (action === "edit") {
            editGalleryItem(id);
        }

        if (action === "delete") {
            deleteGalleryItem(id);
        }

    });

    // Escape key
    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            el.modal?.classList.contains("active")
        ) {
            closeModal();
        }

    });

}


// =============================================
// LOAD GALLERY
// =============================================

async function loadGallery() {

    if (!supabase) return;

    showMessage("Loading gallery...", "info");

    try {

        const { data, error } = await supabase
            .from("gallery")
            .select("*")
            .order("display_order", {
                ascending: true
            });

        if (error) throw error;

        galleryItems = data || [];

        updateStatistics();

        populateEventFilter();

        renderGallery();

        showMessage("", "");

    } catch (error) {

        console.error("Load gallery error:", error);

        showMessage(
            error.message || "Unable to load gallery.",
            "error"
        );
    }
}


// =============================================
// STATISTICS
// =============================================

function updateStatistics() {

    const published = galleryItems.filter(
        item => item.status === "published"
    ).length;

    const drafts = galleryItems.filter(
        item => item.status === "draft"
    ).length;

    const events = new Set(
        galleryItems
            .map(item => item.event_name)
            .filter(Boolean)
    );

    if (el.total) {
        el.total.textContent = galleryItems.length;
    }

    if (el.published) {
        el.published.textContent = published;
    }

    if (el.drafts) {
        el.drafts.textContent = drafts;
    }

    if (el.events) {
        el.events.textContent = events.size;
    }
}


// =============================================
// EVENT FILTER
// =============================================

function populateEventFilter() {

    if (!el.eventFilter) return;

    const selected = el.eventFilter.value;

    const events = [
        ...new Set(
            galleryItems
                .map(item => item.event_name)
                .filter(Boolean)
        )
    ].sort();

    el.eventFilter.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "all";
    defaultOption.textContent = "All Events";

    el.eventFilter.appendChild(defaultOption);

    events.forEach(eventName => {

        const option = document.createElement("option");

        option.value = eventName;
        option.textContent = eventName;

        el.eventFilter.appendChild(option);

    });

    if (events.includes(selected)) {
        el.eventFilter.value = selected;
    }
}


// =============================================
// RENDER GALLERY
// =============================================

function renderGallery() {

    if (!el.grid) return;

    const search =
        el.search?.value.trim().toLowerCase() || "";

    const status =
        el.statusFilter?.value || "all";

    const eventName =
        el.eventFilter?.value || "all";

    const filtered = galleryItems.filter(item => {

        const title = (item.title || "").toLowerCase();

        const description =
            (item.description || "").toLowerCase();

        const event = (item.event_name || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            description.includes(search) ||
            event.includes(search);

        const matchesStatus =
            status === "all" ||
            item.status === status;

        const matchesEvent =
            eventName === "all" ||
            item.event_name === eventName;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesEvent
        );
    });


    if (!filtered.length) {

        el.grid.innerHTML = `
            <div class="table-message">
                No gallery items found.
            </div>
        `;

        return;
    }


    el.grid.innerHTML = filtered.map(item => {

        const title = escapeHTML(item.title || "Untitled");

        const safeStatus = [
            "published",
            "draft",
            "archived"
        ].includes(item.status)
            ? item.status
            : "draft";

        const image = item.media_url
            ? `
                <img
                    src="${escapeHTML(item.media_url)}"
                    alt="${title}"
                    loading="lazy"
                >
            `
            : `
                <div class="gallery-placeholder">
                    <i data-lucide="image"></i>
                </div>
            `;

        return `
            <article class="gallery-card">

                <div class="gallery-card-media">

                    ${image}

                    <span class="status-badge status-${safeStatus}">
                        ${safeStatus}
                    </span>

                </div>

                <div class="gallery-card-content">

                    <div>

                        <h3>${title}</h3>

                        <p>
                            ${escapeHTML(
                                item.event_name || "General Gallery"
                            )}
                        </p>

                    </div>

                    <div class="gallery-card-actions">

                        <button
                            type="button"
                            class="icon-button"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                            title="Edit">

                            <i data-lucide="pencil"></i>

                        </button>

                        <button
                            type="button"
                            class="icon-button delete-action"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                            title="Delete">

                            <i data-lucide="trash-2"></i>

                        </button>

                    </div>

                </div>

            </article>
        `;

    }).join("");


    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// =============================================
// CREATE GALLERY ITEM
// =============================================

function openCreateModal() {

    if (!el.form || !el.modal) return;

    el.form.reset();

    el.id.value = "";

    existingMediaUrl = null;

    if (el.mediaType) {
        el.mediaType.value = "image";
    }

    if (el.status) {
        el.status.value = "draft";
    }

    if (el.order) {
        el.order.value = 0;
    }

    el.modalTitle.textContent = "ADD GALLERY ITEM";

    resetFilePreview();

    el.modal.classList.add("active");
}


// =============================================
// EDIT GALLERY ITEM
// =============================================

function editGalleryItem(id) {

    const item = galleryItems.find(
        galleryItem => String(galleryItem.id) === String(id)
    );

    if (!item) {

        showMessage("Gallery item not found.", "error");

        return;
    }

    el.form.reset();

    el.id.value = item.id;

    el.title.value = item.title || "";

    el.description.value = item.description || "";

    el.mediaType.value = item.media_type || "image";

    el.status.value = item.status || "draft";

    el.eventName.value = item.event_name || "";

    el.order.value = item.display_order ?? 0;

    existingMediaUrl = item.media_url || null;

    el.modalTitle.textContent = "EDIT GALLERY ITEM";

    if (existingMediaUrl) {

        el.previewImage.src = existingMediaUrl;

        el.filePreview.style.display = "block";

    } else {

        resetFilePreview();
    }

    el.modal.classList.add("active");
}


// =============================================
// CLOSE MODAL
// =============================================

function closeModal() {

    el.modal?.classList.remove("active");

    el.form?.reset();

    if (el.id) {
        el.id.value = "";
    }

    existingMediaUrl = null;

    resetFilePreview();
}


// =============================================
// FILE PREVIEW
// =============================================

function previewFile(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    // Validate file type
    if (!allowedTypes.includes(file.type)) {

        showUploadStatus(
            "Only JPG, PNG and WEBP files are supported.",
            "error"
        );

        el.file.value = "";

        return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {

        showUploadStatus(
            "File must be smaller than 5 MB.",
            "error"
        );

        el.file.value = "";

        return;
    }

    // Force image type
    el.mediaType.value = "image";

    const reader = new FileReader();

    reader.onload = () => {

        el.previewImage.src = reader.result;

        el.filePreview.style.display = "block";

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

        el.file.value = "";

    };

    reader.readAsDataURL(file);
}


// =============================================
// REMOVE SELECTED FILE
// =============================================

function removeSelectedFile() {

    if (el.file) {
        el.file.value = "";
    }

    // Clear existing image URL as well
    existingMediaUrl = null;

    resetFilePreview();

    showUploadStatus(
        "Media removed. Save to apply changes.",
        "info"
    );
}


// =============================================
// RESET FILE PREVIEW
// =============================================

function resetFilePreview() {

    if (el.previewImage) {
        el.previewImage.removeAttribute("src");
    }

    if (el.filePreview) {
        el.filePreview.style.display = "none";
    }

    if (el.uploadStatus) {
        el.uploadStatus.textContent = "";
    }

    if (el.file) {
        el.file.value = "";
    }
}


// =============================================
// SUPABASE STORAGE UPLOAD
// =============================================

async function uploadGalleryFile(file) {

    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName = crypto.randomUUID();

    const filePath = `gallery/${fileName}.${extension}`;

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
        throw new Error("Unable to generate image URL.");
    }

    return data.publicUrl;
}


// =============================================
// SAVE GALLERY ITEM
// =============================================

async function saveGalleryItem(event) {

    event.preventDefault();

    if (!supabase) return;

    const title = el.title.value.trim();

    const description = el.description.value.trim();

    const status = el.status.value;

    const order = Number(el.order.value);

    // Validate title
    if (!title) {

        showMessage(
            "Gallery title is required.",
            "error"
        );

        return;
    }

    // Validate status
    if (!["published", "draft", "archived"].includes(status)) {

        showMessage(
            "Please select a valid status.",
            "error"
        );

        return;
    }

    // Validate display order
    if (!Number.isFinite(order) || order < 0) {

        showMessage(
            "Display order must be a valid non-negative number.",
            "error"
        );

        return;
    }

    const file = el.file.files?.[0];

    const originalButtonContent = el.save.innerHTML;

    el.save.disabled = true;

    el.save.textContent = "SAVING...";

    try {

        let mediaUrl = existingMediaUrl;

        // Upload new image if selected
        if (file) {

            showUploadStatus(
                "Uploading image...",
                "info"
            );

            mediaUrl = await uploadGalleryFile(file);

            showUploadStatus(
                "Image uploaded successfully.",
                "success"
            );
        }

        const galleryData = {

            title,

            description,

            media_type: "image",

            media_url: mediaUrl,

            event_name: el.eventName.value.trim() || null,

            display_order: order,

            status

        };

        const id = el.id.value;

        let result;

        // Update existing gallery item
        if (id) {

            result = await supabase
                .from("gallery")
                .update(galleryData)
                .eq("id", id);

        } else {

            // Insert new gallery item
            result = await supabase
                .from("gallery")
                .insert([galleryData]);

        }

        if (result.error) {
            throw result.error;
        }

        closeModal();

        showMessage(
            id
                ? "Gallery item updated successfully."
                : "Gallery item added successfully.",
            "success"
        );

        await loadGallery();

    } catch (error) {

        console.error("Save gallery error:", error);

        showMessage(
            error.message || "Unable to save gallery item.",
            "error"
        );

    } finally {

        el.save.disabled = false;

        el.save.innerHTML = originalButtonContent;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}


// =============================================
// DELETE GALLERY ITEM
// =============================================

async function deleteGalleryItem(id) {

    if (!supabase) return;

    const item = galleryItems.find(
        galleryItem => String(galleryItem.id) === String(id)
    );

    if (!item) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${item.title}" from the gallery?`
    );

    if (!confirmed) return;

    try {

        const { error } = await supabase
            .from("gallery")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        showMessage(
            "Gallery item deleted successfully.",
            "success"
        );

        await loadGallery();

    } catch (error) {

        console.error("Delete gallery error:", error);

        showMessage(
            error.message || "Unable to delete gallery item.",
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

        await supabase.auth.signOut();

        sessionStorage.removeItem("admin_name");

        window.location.href = "/admin/login.html";

    } catch (error) {

        console.error("Logout error:", error);

        showMessage(
            "Unable to logout. Please try again.",
            "error"
        );
    }
}


// =============================================
// MESSAGE HELPERS
// =============================================

function showMessage(message, type = "info") {

    if (!el.message) return;

    el.message.textContent = message;

    el.message.className = `gallery-message ${type}`;
}


function showUploadStatus(message, type = "info") {

    if (!el.uploadStatus) return;

    el.uploadStatus.textContent = message;

    el.uploadStatus.className = type;
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