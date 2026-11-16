// =============================================
// VISTAS ACM — SETTINGS MANAGEMENT
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase;
let currentUser = null;
let currentProfile = null;

const $ = (id) => document.getElementById(id);

const el = {
    adminName: $("admin-name"),
    adminAvatar: $("admin-avatar"),

    logout: $("logout-btn"),
    settingsLogout: $("settings-logout"),
    menuToggle: $("menu-toggle"),

    profileForm: $("profile-form"),
    profileName: $("profile-name"),
    profileEmail: $("profile-email"),
    profileRole: $("profile-role"),
    profileMessage: $("profile-message"),

    passwordForm: $("password-form"),
    newPassword: $("new-password"),
    confirmPassword: $("confirm-password"),
    passwordMessage: $("password-message"),

    environment: $("system-environment"),
    browser: $("system-browser"),
    date: $("system-date")
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

        const isAuthorized = await verifyAdmin();

        if (!isAuthorized) return;

        setupEventListeners();
        loadSystemInformation();

    } catch (error) {
        console.error("Settings initialization error:", error);

        showMessage(
            el.profileMessage,
            error.message || "Unable to initialize settings.",
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

    currentUser = user;

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

    currentProfile = profile;

    populateProfile();

    return true;
}


// =============================================
// POPULATE PROFILE
// =============================================

function populateProfile() {
    const name = currentProfile.full_name || "";

    if (el.adminName) {
        el.adminName.textContent = name || currentUser.email;
    }

    if (el.profileName) {
        el.profileName.value = name;
    }

    if (el.profileEmail) {
        el.profileEmail.value = currentUser.email || "";
    }

    if (el.profileRole) {
        el.profileRole.value = currentProfile.role || "editor";
    }

    if (el.adminAvatar) {
        el.adminAvatar.textContent = getInitials(name);
    }
}


// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {
    el.profileForm?.addEventListener(
        "submit",
        updateProfile
    );

    el.passwordForm?.addEventListener(
        "submit",
        updatePassword
    );

    el.logout?.addEventListener("click", logout);

    el.settingsLogout?.addEventListener("click", logout);

    el.menuToggle?.addEventListener("click", () => {
        document.querySelector(".admin-sidebar")
            ?.classList.toggle("sidebar-open");
    });
}


// =============================================
// UPDATE PROFILE
// =============================================

async function updateProfile(event) {
    event.preventDefault();

    if (!currentUser || !currentProfile) {
        showMessage(
            el.profileMessage,
            "Your session has expired. Please login again.",
            "error"
        );

        return;
    }

    const fullName = el.profileName.value.trim();
    const newEmail = el.profileEmail.value.trim();

    if (!fullName) {
        showMessage(
            el.profileMessage,
            "Name cannot be empty.",
            "error"
        );

        return;
    }

    if (!newEmail) {
        showMessage(
            el.profileMessage,
            "Email cannot be empty.",
            "error"
        );

        return;
    }

    const emailChanged = newEmail !== currentUser.email;

    const button = el.profileForm.querySelector(
        'button[type="submit"]'
    );

    setButtonLoading(button, true, "SAVING...");

    try {
        // Update authentication email if changed.

        if (emailChanged) {
            const { error: emailError } = await supabase.auth
                .updateUser({
                    email: newEmail
                });

            if (emailError) {
                throw emailError;
            }
        }

        // Update profile name.

        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: fullName
            })
            .eq("id", currentUser.id);

        if (profileError) {
            throw profileError;
        }

        // Update local profile data.

        currentProfile.full_name = fullName;

        if (el.adminName) {
            el.adminName.textContent = fullName;
        }

        if (el.adminAvatar) {
            el.adminAvatar.textContent = getInitials(fullName);
        }

        showMessage(
            el.profileMessage,
            emailChanged
                ? "Name updated. Check your inbox to confirm your new email address."
                : "Profile updated successfully.",
            "success"
        );

        // Refresh authenticated user information.

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (!userError && user) {
            currentUser = user;
        }

        if (el.profileEmail) {
            el.profileEmail.value = emailChanged
                ? newEmail
                : currentUser.email || newEmail;
        }

    } catch (error) {
        console.error("Profile update error:", error);

        showMessage(
            el.profileMessage,
            error.message || "Unable to update profile.",
            "error"
        );

    } finally {
        setButtonLoading(button, false, "SAVE CHANGES");
    }
}


// =============================================
// UPDATE PASSWORD
// =============================================

async function updatePassword(event) {
    event.preventDefault();

    if (!currentUser) {
        showMessage(
            el.passwordMessage,
            "Your session has expired. Please login again.",
            "error"
        );

        return;
    }

    const password = el.newPassword.value;
    const confirmPassword = el.confirmPassword.value;

    if (!password || !confirmPassword) {
        showMessage(
            el.passwordMessage,
            "Please complete both password fields.",
            "error"
        );

        return;
    }

    if (password.length < 8) {
        showMessage(
            el.passwordMessage,
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }

    if (password !== confirmPassword) {
        showMessage(
            el.passwordMessage,
            "Passwords do not match.",
            "error"
        );

        return;
    }

    const button = el.passwordForm.querySelector(
        'button[type="submit"]'
    );

    setButtonLoading(button, true, "UPDATING...");

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            throw error;
        }

        el.passwordForm.reset();

        showMessage(
            el.passwordMessage,
            "Password updated successfully.",
            "success"
        );

    } catch (error) {
        console.error("Password update error:", error);

        showMessage(
            el.passwordMessage,
            error.message || "Unable to update password.",
            "error"
        );

    } finally {
        setButtonLoading(button, false, "UPDATE PASSWORD");
    }
}


// =============================================
// SYSTEM INFORMATION
// =============================================

function loadSystemInformation() {
    if (el.environment) {
        el.environment.textContent =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
                ? "LOCAL DEVELOPMENT"
                : "PRODUCTION";
    }

    if (el.browser) {
        el.browser.textContent = getBrowserName();
    }

    if (el.date) {
        el.date.textContent = new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }
}


// =============================================
// DETECT BROWSER
// =============================================

function getBrowserName() {
    const ua = navigator.userAgent;

    if (ua.includes("Edg/")) {
        return "Microsoft Edge";
    }

    if (ua.includes("Chrome/")) {
        return "Google Chrome";
    }

    if (ua.includes("Firefox/")) {
        return "Mozilla Firefox";
    }

    if (ua.includes("Safari/")) {
        return "Safari";
    }

    return "Unknown Browser";
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
// HELPERS
// =============================================

function getInitials(name) {
    return String(name || "VA")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}


// =============================================
// MESSAGE HANDLER
// =============================================

function showMessage(element, message, type = "info") {
    if (!element) return;

    element.textContent = message;

    element.className = `settings-message ${type}`;
}


// =============================================
// BUTTON LOADING STATE
// =============================================

function setButtonLoading(button, loading, text) {
    if (!button) return;

    button.disabled = loading;
    button.textContent = text;
}