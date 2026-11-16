// =============================================
// VISTAS ACM — TEAM MANAGEMENT
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase;
let members = [];
let existingImageUrl = null;

const $ = (id) => document.getElementById(id);

const el = {
    adminName: $("admin-name"),
    logout: $("logout-btn"),
    menuToggle: $("menu-toggle"),

    addButton: $("add-member-btn"),

    total: $("total-members"),
    published: $("published-members"),
    drafts: $("draft-members"),
    domains: $("team-domains"),

    search: $("member-search"),
    statusFilter: $("member-status-filter"),
    domainFilter: $("member-domain-filter"),

    table: $("team-table-body"),
    message: $("team-message"),

    modal: $("member-modal"),
    modalTitle: $("member-modal-title"),
    closeModal: $("close-member-modal"),

    form: $("member-form"),
    id: $("member-id"),

    name: $("member-name"),
    designation: $("member-designation"),
    domain: $("member-domain"),
    status: $("member-status"),
    bio: $("member-bio"),

    image: $("member-image"),
    imagePreview: $("member-image-preview"),
    previewImage: $("member-preview-image"),
    removeImage: $("remove-member-image"),
    uploadStatus: $("member-upload-status"),

    linkedin: $("member-linkedin"),
    instagram: $("member-instagram"),
    github: $("member-github"),
    order: $("member-order"),

    cancel: $("cancel-member"),
    save: $("save-member")
};


// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
    try {
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Unable to load Supabase configuration.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        const authorized = await verifyAdmin();

        if (!authorized) return;

        setupEventListeners();

        await loadMembers();

    } catch (error) {
        console.error("Team initialization error:", error);

        showMessage(
            error.message || "Unable to initialize team management.",
            "error"
        );
    }
}


// =============================================
// AUTHENTICATION
// =============================================

async function verifyAdmin() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = "/admin/login.html";
        return false;
    }

    const {
        data: profile,
        error: profileError
    } = await supabase
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
            profile.full_name || user.email;
    }

    return true;
}


// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {
    el.addButton?.addEventListener("click", openCreateModal);

    el.closeModal?.addEventListener("click", closeModal);

    el.cancel?.addEventListener("click", closeModal);

    el.form?.addEventListener("submit", saveMember);

    el.search?.addEventListener("input", renderMembers);

    el.statusFilter?.addEventListener("change", renderMembers);

    el.domainFilter?.addEventListener("change", renderMembers);

    el.image?.addEventListener("change", previewImage);

    el.removeImage?.addEventListener("click", removeImage);

    el.logout?.addEventListener("click", logout);

    el.menuToggle?.addEventListener("click", () => {
        document.querySelector(".admin-sidebar")
            ?.classList.toggle("sidebar-open");
    });

    el.modal?.addEventListener("click", (event) => {
        if (event.target === el.modal) {
            closeModal();
        }
    });

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
// LOAD TEAM MEMBERS
// =============================================

async function loadMembers() {
    showMessage("Loading team members...", "info");

    const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Load members error:", error);

        showMessage(
            error.message || "Unable to load team members.",
            "error"
        );

        return;
    }

    members = data || [];

    updateStatistics();
    populateDomainFilter();
    renderMembers();

    showMessage("", "");
}


// =============================================
// STATISTICS
// =============================================

function updateStatistics() {
    const published = members.filter(
        member => member.status === "published"
    ).length;

    const drafts = members.filter(
        member => member.status === "draft"
    ).length;

    const domains = new Set(
        members
            .map(member => member.domain)
            .filter(Boolean)
    );

    if (el.total) {
        el.total.textContent = members.length;
    }

    if (el.published) {
        el.published.textContent = published;
    }

    if (el.drafts) {
        el.drafts.textContent = drafts;
    }

    if (el.domains) {
        el.domains.textContent = domains.size;
    }
}


// =============================================
// DOMAIN FILTER
// =============================================

function populateDomainFilter() {
    if (!el.domainFilter) return;

    const selected = el.domainFilter.value;

    const domains = [
        ...new Set(
            members
                .map(member => member.domain)
                .filter(Boolean)
        )
    ].sort();

    el.domainFilter.innerHTML =
        `<option value="all">All Domains</option>`;

    domains.forEach(domain => {
        const option = document.createElement("option");

        option.value = domain;
        option.textContent = domain;

        el.domainFilter.appendChild(option);
    });

    if (domains.includes(selected)) {
        el.domainFilter.value = selected;
    }
}


// =============================================
// RENDER TEAM MEMBERS
// =============================================

function renderMembers() {
    if (!el.table) return;

    const search =
        el.search?.value.trim().toLowerCase() || "";

    const status =
        el.statusFilter?.value || "all";

    const domain =
        el.domainFilter?.value || "all";

    const filtered = members.filter(member => {
        const matchesSearch =
            (member.name || "").toLowerCase().includes(search) ||
            (member.designation || "").toLowerCase().includes(search) ||
            (member.domain || "").toLowerCase().includes(search);

        const matchesStatus =
            status === "all" || member.status === status;

        const matchesDomain =
            domain === "all" || member.domain === domain;

        return matchesSearch && matchesStatus && matchesDomain;
    });

    if (!filtered.length) {
        el.table.innerHTML = `
            <tr>
                <td colspan="5" class="table-message">
                    No team members found.
                </td>
            </tr>
        `;

        return;
    }

    el.table.innerHTML = filtered.map(member => {
        const name = escapeHTML(
            member.name || "Unnamed Member"
        );

        const image = member.image_url
            ? `
                <img
                    src="${escapeHTML(member.image_url)}"
                    alt="${name}"
                    class="member-table-image"
                    loading="lazy"
                >
            `
            : `
                <div class="member-table-placeholder">
                    <i data-lucide="user"></i>
                </div>
            `;

        return `
            <tr>
                <td>
                    <div class="member-table-info">
                        ${image}

                        <div>
                            <strong>${name}</strong>
                            <small>
                                ${escapeHTML(
                                    (member.bio || "").slice(0, 55)
                                )}
                            </small>
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHTML(member.designation || "—")}
                </td>

                <td>
                    ${escapeHTML(member.domain || "—")}
                </td>

                <td>
                    <span class="status-badge status-${escapeHTML(
                        member.status || "draft"
                    )}">
                        ${escapeHTML(member.status || "draft")}
                    </span>
                </td>

                <td>
                    <div class="event-actions">
                        <button
                            type="button"
                            class="icon-button"
                            data-action="edit"
                            data-id="${escapeHTML(member.id)}"
                            title="Edit member"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
     width="15" height="15"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>
</svg>
                        </button>

                        <button
                            type="button"
                            class="icon-button delete-action"
                            data-action="delete"
                            data-id="${escapeHTML(member.id)}"
                            title="Delete member"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
     width="15" height="15"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M3 6h18"/>
    <path d="M8 6V4h8v2"/>
    <path d="m19 6-1 14H6L5 6"/>
    <path d="M10 11v5"/>
    <path d="M14 11v5"/>
</svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    el.table.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            const { action, id } = button.dataset;

            if (action === "edit") {
                editMember(id);
            }

            if (action === "delete") {
                deleteMember(id);
            }
        });
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// =============================================
// CREATE MEMBER
// =============================================

function openCreateModal() {
    if (!el.form || !el.modal) return;

    el.form.reset();

    el.id.value = "";

    existingImageUrl = null;

    el.modalTitle.textContent = "ADD TEAM MEMBER";

    resetImagePreview();

    el.modal.classList.add("active");
}


// =============================================
// EDIT MEMBER
// =============================================

function editMember(id) {
    const member = members.find(
        item => String(item.id) === String(id)
    );

    if (!member || !el.form || !el.modal) return;

    el.form.reset();

    el.id.value = member.id;

    el.name.value = member.name || "";

    el.designation.value = member.designation || "";

    el.domain.value = member.domain || "";

    el.status.value = member.status || "draft";

    el.bio.value = member.bio || "";

    el.linkedin.value = member.linkedin_url || "";

    el.instagram.value = member.instagram_url || "";

    el.github.value = member.github_url || "";

    el.order.value = member.display_order ?? 0;

    existingImageUrl = member.image_url || null;

    el.modalTitle.textContent = "EDIT TEAM MEMBER";

    if (existingImageUrl) {
        el.previewImage.src = existingImageUrl;

        el.imagePreview.style.display = "block";
    } else {
        resetImagePreview();
    }

    el.modal.classList.add("active");
}


// =============================================
// CLOSE MODAL
// =============================================

function closeModal() {
    el.modal?.classList.remove("active");

    el.form?.reset();

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

        el.image.value = "";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showUploadStatus(
            "Image must be smaller than 5 MB.",
            "error"
        );

        el.image.value = "";

        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        el.previewImage.src = reader.result;

        el.imagePreview.style.display = "block";

        showUploadStatus(
            "Image ready to upload.",
            "success"
        );
    };

    reader.onerror = () => {
        showUploadStatus(
            "Unable to preview image.",
            "error"
        );
    };

    reader.readAsDataURL(file);
}


// =============================================
// REMOVE IMAGE
// =============================================

function removeImage() {
    if (el.image) {
        el.image.value = "";
    }

    existingImageUrl = null;

    resetImagePreview();

    showUploadStatus(
        "Image removed. Save changes to apply.",
        "info"
    );
}


// =============================================
// RESET IMAGE PREVIEW
// =============================================

function resetImagePreview() {
    if (el.previewImage) {
        el.previewImage.src = "";
    }

    if (el.imagePreview) {
        el.imagePreview.style.display = "none";
    }

    if (el.uploadStatus) {
        el.uploadStatus.textContent = "";
    }
}


// =============================================
// IMAGE UPLOAD
// =============================================

async function uploadMemberImage(file) {
    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath =
        `team/${crypto.randomUUID()}.${extension}`;

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
// URL VALIDATION
// =============================================

function getSafeUrl(value) {
    const url = String(value || "").trim();

    if (!url) return null;

    try {
        const parsed = new URL(url);

        if (
            parsed.protocol !== "https:" &&
            parsed.protocol !== "http:"
        ) {
            return null;
        }

        return parsed.href;

    } catch {
        return null;
    }
}


// =============================================
// SAVE MEMBER
// =============================================

async function saveMember(event) {
    event.preventDefault();

    if (!el.form || !el.save) return;

    const name = el.name.value.trim();

    if (!name) {
        showMessage("Member name is required.", "error");
        return;
    }

    const linkedin = getSafeUrl(el.linkedin.value);
    const instagram = getSafeUrl(el.instagram.value);
    const github = getSafeUrl(el.github.value);

    if (el.linkedin.value.trim() && !linkedin) {
        showMessage("Enter a valid LinkedIn URL.", "error");
        return;
    }

    if (el.instagram.value.trim() && !instagram) {
        showMessage("Enter a valid Instagram URL.", "error");
        return;
    }

    if (el.github.value.trim() && !github) {
        showMessage("Enter a valid GitHub URL.", "error");
        return;
    }

    const file = el.image.files?.[0];

    if (file) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showMessage("Unsupported image format.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showMessage("Image must be smaller than 5 MB.", "error");
            return;
        }
    }

    const originalButtonHTML = el.save.innerHTML;

    el.save.disabled = true;
    el.save.textContent = "SAVING...";

    try {
        let imageUrl = existingImageUrl;

        // Upload new image if selected.

        if (file) {
            showUploadStatus(
                "Uploading profile image...",
                "info"
            );

            imageUrl = await uploadMemberImage(file);

            showUploadStatus(
                "Image uploaded successfully.",
                "success"
            );
        }

        const memberData = {
            name,

            designation: el.designation.value.trim(),

            domain: el.domain.value.trim(),

            bio: el.bio.value.trim(),

            image_url: imageUrl,

            linkedin_url: linkedin,

            instagram_url: instagram,

            github_url: github,

            display_order: Number(el.order.value) || 0,

            status: el.status.value
        };

        const memberId = el.id.value;

        let result;

        if (memberId) {
            result = await supabase
                .from("team_members")
                .update(memberData)
                .eq("id", memberId);
        } else {
            result = await supabase
                .from("team_members")
                .insert([memberData]);
        }

        if (result.error) {
            throw result.error;
        }

        closeModal();

        showMessage(
            memberId
                ? "Team member updated successfully."
                : "Team member added successfully.",
            "success"
        );

        await loadMembers();

    } catch (error) {
        console.error("Save member error:", error);

        showMessage(
            error.message || "Unable to save team member.",
            "error"
        );

    } finally {
        el.save.disabled = false;

        el.save.innerHTML = originalButtonHTML;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}


// =============================================
// DELETE MEMBER
// =============================================

async function deleteMember(id) {
    const member = members.find(
        item => String(item.id) === String(id)
    );

    if (!member) return;

    const confirmed = confirm(
        `Delete ${member.name} from the team?`
    );

    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from("team_members")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        showMessage(
            "Team member deleted successfully.",
            "success"
        );

        await loadMembers();

    } catch (error) {
        console.error("Delete member error:", error);

        showMessage(
            error.message || "Unable to delete team member.",
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

        alert("Unable to logout. Please try again.");
    }
}


// =============================================
// MESSAGE HELPERS
// =============================================

function showMessage(message, type = "info") {
    if (!el.message) return;

    el.message.textContent = message;

    el.message.className = `team-message ${type}`;
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