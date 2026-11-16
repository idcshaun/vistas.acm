// =============================================
// VISTAS ACM — ANNOUNCEMENTS MANAGEMENT
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase = null;
let announcements = [];

const $ = (id) => document.getElementById(id);

// =============================================
// DOM ELEMENTS
// =============================================

const el = {
    adminName: $("admin-name"),
    logout: $("logout-btn"),
    menuToggle: $("menu-toggle"),

    addButton: $("add-announcement-btn"),

    total: $("total-announcements"),
    published: $("published-announcements"),
    drafts: $("draft-announcements"),
    archived: $("archived-announcements"),

    search: $("announcement-search"),
    statusFilter: $("announcement-status-filter"),

    table: $("announcements-table-body"),
    message: $("announcement-message"),

    modal: $("announcement-modal"),
    modalTitle: $("announcement-modal-title"),
    closeModal: $("close-announcement-modal"),

    form: $("announcement-form"),
    id: $("announcement-id"),
    title: $("announcement-title"),
    content: $("announcement-content"),
    date: $("announcement-date"),
    status: $("announcement-status"),

    cancel: $("cancel-announcement"),
    save: $("save-announcement")
};


// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    try {
        // Check required HTML elements
        if (!el.form || !el.addButton || !el.table || !el.modal) {
            throw new Error(
                "Announcements page elements are missing. Check announcements.html."
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
        const isAuthorized = await verifyAdmin();

        if (!isAuthorized) return;

        // Register event listeners
        setupEventListeners();

        // Load announcements
        await loadAnnouncements();

    } catch (error) {
        console.error("Announcements initialization error:", error);

        showMessage(
            error.message || "Unable to initialize announcements.",
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
        console.error("Authentication error:", error);

        window.location.href = "/admin/login.html";

        return false;
    }
}


// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {

    // Open create modal
    el.addButton?.addEventListener("click", openCreateModal);

    // Close modal
    el.closeModal?.addEventListener("click", closeModal);
    el.cancel?.addEventListener("click", closeModal);

    // Form submission
    el.form?.addEventListener("submit", saveAnnouncement);

    // Search
    el.search?.addEventListener("input", renderAnnouncements);

    // Status filter
    el.statusFilter?.addEventListener("change", renderAnnouncements);

    // Logout
    el.logout?.addEventListener("click", logout);

    // Close modal when clicking outside
    el.modal?.addEventListener("click", (event) => {
        if (event.target === el.modal) {
            closeModal();
        }
    });

    // Table actions using event delegation
    el.table?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (!id) return;

        if (action === "edit") {
            editAnnouncement(id);
        }

        if (action === "delete") {
            deleteAnnouncement(id);
        }
    });

    // Escape key closes modal
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
// LOAD ANNOUNCEMENTS
// =============================================

async function loadAnnouncements() {

    if (!supabase) return;

    showMessage("Loading announcements...", "info");

    try {
        const { data, error } = await supabase
            .from("announcements")
            .select("*")
            .order("announcement_date", {
                ascending: false
            });

        if (error) throw error;

        announcements = data || [];

        updateStatistics();
        renderAnnouncements();

        showMessage("", "");

    } catch (error) {
        console.error("Load announcements error:", error);

        showMessage(
            error.message || "Unable to load announcements.",
            "error"
        );
    }
}


// =============================================
// STATISTICS
// =============================================

function updateStatistics() {

    const published = announcements.filter(
        item => item.status === "published"
    ).length;

    const drafts = announcements.filter(
        item => item.status === "draft"
    ).length;

    const archived = announcements.filter(
        item => item.status === "archived"
    ).length;

    if (el.total) {
        el.total.textContent = announcements.length;
    }

    if (el.published) {
        el.published.textContent = published;
    }

    if (el.drafts) {
        el.drafts.textContent = drafts;
    }

    if (el.archived) {
        el.archived.textContent = archived;
    }
}


// =============================================
// RENDER ANNOUNCEMENTS
// =============================================

function renderAnnouncements() {

    if (!el.table) return;

    const search = el.search?.value.trim().toLowerCase() || "";
    const status = el.statusFilter?.value || "all";

    const filtered = announcements.filter(item => {

        const title = (item.title || "").toLowerCase();
        const content = (item.content || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            content.includes(search);

        const matchesStatus =
            status === "all" || item.status === status;

        return matchesSearch && matchesStatus;
    });


    if (!filtered.length) {

        el.table.innerHTML = `
            <tr>
                <td colspan="4" class="table-message">
                    No announcements found.
                </td>
            </tr>
        `;

        return;
    }


    el.table.innerHTML = filtered.map(item => {

        const title = escapeHTML(item.title || "Untitled");

        const content = escapeHTML(item.content || "");

        const date = item.announcement_date
            ? formatDate(item.announcement_date)
            : "—";

        const itemStatus = ["published", "draft", "archived"].includes(
            item.status
        ) ? item.status : "draft";

        return `
            <tr>

                <td>
                    <div class="announcement-table-info">
                        <strong>${title}</strong>
                        <small>${content.slice(0, 75)}</small>
                    </div>
                </td>

                <td>${date}</td>

                <td>
                    <span class="status-badge status-${itemStatus}">
                        ${itemStatus}
                    </span>
                </td>

                <td>
                    <div class="event-actions">

                        <button
                            type="button"
                            class="icon-button"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                            title="Edit announcement">

                            <i data-lucide="pencil"></i>

                        </button>

                        <button
                            type="button"
                            class="icon-button delete-action"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                            title="Delete announcement">

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
// CREATE ANNOUNCEMENT
// =============================================

function openCreateModal() {

    if (!el.form || !el.modal) return;

    el.form.reset();

    el.id.value = "";

    // Set today's date for new announcements
    el.date.value = getTodayDate();

    el.status.value = "draft";

    el.modalTitle.textContent = "CREATE ANNOUNCEMENT";

    el.modal.classList.add("active");

}


// =============================================
// EDIT ANNOUNCEMENT
// =============================================

function editAnnouncement(id) {

    const item = announcements.find(
        announcement => String(announcement.id) === String(id)
    );

    if (!item) {
        showMessage("Announcement not found.", "error");
        return;
    }

    el.form.reset();

    el.id.value = item.id;
    el.title.value = item.title || "";
    el.content.value = item.content || "";

    // HTML input is type="date"
    el.date.value = toDateInput(item.announcement_date);

    el.status.value = item.status || "draft";

    el.modalTitle.textContent = "EDIT ANNOUNCEMENT";

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
}


// =============================================
// SAVE ANNOUNCEMENT
// =============================================

async function saveAnnouncement(event) {

    event.preventDefault();

    if (!supabase) return;

    const title = el.title.value.trim();
    const content = el.content.value.trim();

    if (!title || !content) {
        showMessage("Title and content are required.", "error");
        return;
    }

    if (!el.status.value) {
        showMessage("Please select an announcement status.", "error");
        return;
    }

    const originalButtonContent = el.save.innerHTML;

    el.save.disabled = true;
    el.save.textContent = "SAVING...";

    try {

        // Convert date input to ISO timestamp
        const selectedDate = el.date.value
            ? new Date(`${el.date.value}T00:00:00`).toISOString()
            : new Date().toISOString();

        const announcementData = {
            title,
            content,
            announcement_date: selectedDate,
            status: el.status.value
        };

        const id = el.id.value;

        let result;

        if (id) {

            // Update existing announcement
            result = await supabase
                .from("announcements")
                .update(announcementData)
                .eq("id", id);

        } else {

            // Create new announcement
            result = await supabase
                .from("announcements")
                .insert([announcementData]);

        }

        if (result.error) {
            throw result.error;
        }

        closeModal();

        showMessage(
            id
                ? "Announcement updated successfully."
                : "Announcement created successfully.",
            "success"
        );

        await loadAnnouncements();

    } catch (error) {

        console.error("Save announcement error:", error);

        showMessage(
            error.message || "Unable to save announcement.",
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
// DELETE ANNOUNCEMENT
// =============================================

async function deleteAnnouncement(id) {

    if (!supabase) return;

    const item = announcements.find(
        announcement => String(announcement.id) === String(id)
    );

    if (!item) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    try {

        const { error } = await supabase
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) throw error;

        showMessage(
            "Announcement deleted successfully.",
            "success"
        );

        await loadAnnouncements();

    } catch (error) {

        console.error("Delete announcement error:", error);

        showMessage(
            error.message || "Unable to delete announcement.",
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

        showMessage("Unable to logout. Please try again.", "error");
    }
}


// =============================================
// DATE HELPERS
// =============================================

function getTodayDate() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function toDateInput(value) {

    if (!value) return getTodayDate();

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return getTodayDate();
    }

    // Return YYYY-MM-DD for HTML date input
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(value) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}


// =============================================
// MESSAGE HELPERS
// =============================================

function showMessage(message, type = "info") {

    if (!el.message) return;

    el.message.textContent = message;

    // Keep event-message because admin.css styles this class
    el.message.className = `event-message announcement-message ${type}`;

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