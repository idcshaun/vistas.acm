import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================
   SUPABASE INITIALIZATION
========================================= */

const configResponse = await fetch("/api/config");

if (!configResponse.ok) {
    throw new Error("Unable to load Supabase configuration.");
}

const config = await configResponse.json();

if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("Supabase configuration is missing.");
}

const supabase = createClient(
    config.supabaseUrl,
    config.supabaseKey
);


/* =========================================
   DOM ELEMENTS
========================================= */

const $ = id => document.getElementById(id);

const modal = $("event-modal");
const form = $("event-form");

const saveButton = $("save-event");
const message = $("event-message");

const imageInput = $("event-image");
const preview = $("image-preview");
const previewImage = $("preview-image");
const uploadStatus = $("upload-status");


/* =========================================
   APPLICATION STATE
========================================= */

let events = [];
let currentRole = null;

let selectedImage = null;
let existingImageUrl = null;
let imageRemoved = false;


/* =========================================
   NOTIFICATIONS
========================================= */

function notify(text, type = "info") {
    message.textContent = text;

    message.style.color =
        type === "error" ? "#ff7777" :
        type === "success" ? "#35d69b" :
        "#8291aa";
}


/* =========================================
   AUTHENTICATION
========================================= */

async function verifyAdmin() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        location.replace("/admin/login.html");
        return false;
    }

    const { data: profile, error: profileError } =
        await supabase
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

        location.replace("/admin/login.html");

        return false;
    }

    currentRole = profile.role;

    $("admin-name").textContent = profile.full_name;
    $("admin-role").textContent = profile.role.toUpperCase();

    return true;
}


/* =========================================
   LOAD EVENTS
========================================= */

async function loadEvents() {

    notify("Loading events...");

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        notify(
            "Unable to load events: " + error.message,
            "error"
        );

        return;
    }

    events = data || [];

    updateStatistics();
    renderEvents();

    notify("");
}


/* =========================================
   EVENT STATISTICS
========================================= */

function updateStatistics() {

    $("total-events").textContent = events.length;

    $("published-events").textContent =
        events.filter(event =>
            event.status === "published"
        ).length;

    $("draft-events").textContent =
        events.filter(event =>
            event.status === "draft"
        ).length;

    $("archived-events").textContent =
        events.filter(event =>
            event.status === "archived"
        ).length;
}


/* =========================================
   RENDER EVENTS
========================================= */

function renderEvents() {

    const search = $("event-search").value
        .trim()
        .toLowerCase();

    const filter = $("event-filter").value;

    const filtered = events.filter(event => {

        const matchesSearch =
            event.title.toLowerCase().includes(search);

        const matchesStatus =
            filter === "all" ||
            event.status === filter;

        return matchesSearch && matchesStatus;
    });


    if (!filtered.length) {

        $("events-list").innerHTML = `
            <tr>
                <td colspan="5" class="table-message">
                    No events found. Create your first event!
                </td>
            </tr>
        `;

        return;
    }


    $("events-list").innerHTML = filtered.map(event => {

        const date = event.event_date
            ? new Date(event.event_date).toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            )
            : "Not scheduled";

        return `
            <tr>

                <td class="event-title-cell">
                    ${escapeHTML(event.title)}
                </td>

                <td>
                    ${escapeHTML(date)}
                </td>

                <td>
                    ${escapeHTML(event.venue || "—")}
                </td>

                <td>
                    <span class="event-status status-${event.status}">
                        ${escapeHTML(event.status)}
                    </span>
                </td>

                <td>

                    <div class="event-actions">

                        <button
                            data-action="edit"
                            data-id="${event.id}"
                            title="Edit Event"
                        >
                            <i data-lucide="pencil"></i>
                        </button>

                        <button
                            data-action="delete"
                            data-id="${event.id}"
                            title="Delete Event"
                        >
                            <i data-lucide="trash-2"></i>
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");

    if (window.lucide) {
        lucide.createIcons();
    }
}


/* =========================================
   HTML ESCAPING
========================================= */

function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}


/* =========================================
   DATE CONVERSION
========================================= */

function toLocalDateTime(value) {

    const date = new Date(value);

    const offset = date.getTimezoneOffset();

    return new Date(
        date.getTime() - offset * 60000
    )
        .toISOString()
        .slice(0, 16);
}


/* =========================================
   IMAGE PREVIEW
========================================= */

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        notify(
            "Please select a JPG, PNG or WEBP image.",
            "error"
        );

        imageInput.value = "";

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        notify(
            "Image must be smaller than 5 MB.",
            "error"
        );

        imageInput.value = "";

        return;
    }

    selectedImage = file;
    imageRemoved = false;

    const previewURL = URL.createObjectURL(file);

    previewImage.src = previewURL;

    preview.classList.add("visible");

    uploadStatus.textContent =
        "Image ready to upload.";

    notify("");

});


/* =========================================
   REMOVE IMAGE
========================================= */

$("remove-image").addEventListener("click", () => {

    selectedImage = null;
    existingImageUrl = null;
    imageRemoved = true;

    imageInput.value = "";

    previewImage.removeAttribute("src");

    preview.classList.remove("visible");

    uploadStatus.textContent =
        "Poster removed.";

});


/* =========================================
   SUPABASE IMAGE UPLOAD
========================================= */

async function uploadEventImage(file) {

    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath =
        `events/${crypto.randomUUID()}.${extension}`;

    uploadStatus.textContent =
        "Uploading poster...";

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

    uploadStatus.textContent =
        "Poster uploaded successfully.";

    return data.publicUrl;
}


/* =========================================
   OPEN EVENT MODAL
========================================= */

function openModal(event = null) {

    form.reset();

    selectedImage = null;
    imageRemoved = false;

    imageInput.value = "";

    $("event-id").value = event?.id || "";

    $("modal-title").textContent =
        event ? "Edit Event" : "Create Event";

    $("event-title").value =
        event?.title || "";

    $("event-description").value =
        event?.description || "";

    $("event-date").value =
        event?.event_date
            ? toLocalDateTime(event.event_date)
            : "";

    $("event-venue").value =
        event?.venue || "";

    $("event-registration").value =
        event?.registration_url || "";

    $("event-status").value =
        event?.status || "draft";


    // Preserve existing poster

    existingImageUrl = event?.image_url || null;

    if (existingImageUrl) {

        previewImage.src = existingImageUrl;

        preview.classList.add("visible");

    } else {

        previewImage.removeAttribute("src");

        preview.classList.remove("visible");

    }

    uploadStatus.textContent = "";

    modal.classList.add("open");

    if (window.lucide) {
        lucide.createIcons();
    }
}


/* =========================================
   CLOSE MODAL
========================================= */

function closeModal() {

    modal.classList.remove("open");

    form.reset();

    selectedImage = null;

    existingImageUrl = null;

    imageRemoved = false;

    imageInput.value = "";

    previewImage.removeAttribute("src");

    preview.classList.remove("visible");

    uploadStatus.textContent = "";
}


/* =========================================
   SAVE EVENT
========================================= */

async function saveEvent(event) {

    event.preventDefault();

    const id = $("event-id").value;

    const title = $("event-title")
        .value
        .trim();

    if (!title) {

        notify(
            "Event title is required.",
            "error"
        );

        return;
    }


    saveButton.disabled = true;

    saveButton.textContent = "SAVING...";


    try {

        let imageUrl = imageRemoved
            ? null
            : existingImageUrl;


        // Upload a newly selected image

        if (selectedImage) {

            imageUrl = await uploadEventImage(
                selectedImage
            );

        }


        // Generate event slug

        const slug = title
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");


        // Event data

        const payload = {

            title,

            slug,

            description: $("event-description")
                .value
                .trim(),

            event_date: $("event-date").value
                ? new Date(
                    $("event-date").value
                ).toISOString()
                : null,

            venue: $("event-venue")
                .value
                .trim(),

            image_url: imageUrl,

            registration_url: $("event-registration")
                .value
                .trim() || null,

            status: $("event-status").value

        };


        // Insert or update

        const query = id

            ? supabase
                .from("events")
                .update(payload)
                .eq("id", id)

            : supabase
                .from("events")
                .insert(payload);


        const { error } = await query;

        if (error) {
            throw error;
        }


        closeModal();

        await loadEvents();

        notify(
            id
                ? "Event updated successfully."
                : "Event created successfully.",
            "success"
        );


    } catch (error) {

        console.error("Event save error:", error);

        notify(
            "Error: " + error.message,
            "error"
        );

    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "SAVE EVENT →";

    }

}


/* =========================================
   DELETE EVENT
========================================= */

async function deleteEvent(id) {

    const event = events.find(
        item => item.id === id
    );

    if (!event) return;


    const confirmed = confirm(
        `Delete "${event.title}" permanently?`
    );

    if (!confirmed) return;


    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);


    if (error) {

        notify(
            "Unable to delete event: " + error.message,
            "error"
        );

        return;
    }


    await loadEvents();

    notify(
        "Event deleted successfully.",
        "success"
    );

}


/* =========================================
   EVENT TABLE ACTIONS
========================================= */

$("events-list").addEventListener(
    "click",
    event => {

        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const id = button.dataset.id;


        if (button.dataset.action === "edit") {

            const selected = events.find(
                item => item.id === id
            );

            if (selected) {
                openModal(selected);
            }

        }


        if (button.dataset.action === "delete") {

            deleteEvent(id);

        }

    }
);


/* =========================================
   EVENT LISTENERS
========================================= */

$("add-event-button").addEventListener(
    "click",
    () => openModal()
);


$("close-modal").addEventListener(
    "click",
    closeModal
);


$("cancel-event").addEventListener(
    "click",
    closeModal
);


$("event-search").addEventListener(
    "input",
    renderEvents
);


$("event-filter").addEventListener(
    "change",
    renderEvents
);


form.addEventListener(
    "submit",
    saveEvent
);


/* =========================================
   LOGOUT
========================================= */

$("logout-button").addEventListener(
    "click",
    async () => {

        await supabase.auth.signOut();

        location.replace("/admin/login.html");

    }
);


/* =========================================
   MOBILE SIDEBAR
========================================= */

$("menu-toggle").addEventListener(
    "click",
    () => {

        $("sidebar").classList.toggle(
            "sidebar-open"
        );

    }
);


/* =========================================
   INITIALIZE APPLICATION
========================================= */

async function initialize() {

    const authorized = await verifyAdmin();

    if (!authorized) return;

    await loadEvents();

    if (window.lucide) {
        lucide.createIcons();
    }

    console.log(
        "VISTAS ACM Events Management initialized."
    );

}


initialize();