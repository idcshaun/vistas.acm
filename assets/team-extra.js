// =============================================
// VISTAS ACM — TEAM EXTRAS
// Dynamic member bio + redirecting social buttons
// Works with the existing site.js carousel.
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// DOM ELEMENTS
// =============================================

const $ = (id) => document.getElementById(id);

const nameEl = $("nm");
const roleEl = $("rl");
const tagEl = $("tm");
const numEl = $("in");

const bioEl = $("member-bio");
const socialsEl = $("member-socials");

// =============================================
// SOCIAL PLATFORMS
// =============================================

const PLATFORMS = [
    {
        key: "linkedin_url",
        name: "LinkedIn",
        className: "linkedin"
    },
    {
        key: "github_url",
        name: "GitHub",
        className: "github"
    },
    {
        key: "instagram_url",
        name: "Instagram",
        className: "instagram"
    }
];

// =============================================
// STATE
// =============================================

let members = [];
let membersByName = new Map();

let renderFrame = null;

// =============================================
// HELPERS
// =============================================

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function safeURL(value) {
    try {
        const url = new URL(String(value || "").trim());

        if (!["https:", "http:"].includes(url.protocol)) {
            return null;
        }

        return url.href;

    } catch {
        return null;
    }
}

// =============================================
// LOAD MEMBERS FROM SUPABASE
// =============================================

async function loadMembers() {

    try {

        const response = await fetch("/api/config", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Unable to load Supabase configuration.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        const supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        const { data, error } = await supabase
            .from("team_members")
            .select(`
                id,
                name,
                designation,
                domain,
                bio,
                linkedin_url,
                github_url,
                instagram_url,
                display_order
            `)
            .eq("status", "published")
            .order("display_order", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        members = data || [];

        membersByName = new Map(
            members.map(member => [
                normalize(member.name),
                member
            ])
        );

        console.log(
            `VISTAS ACM: ${members.length} team profiles loaded.`
        );

        renderMember();

    } catch (error) {

        console.error("Team extras error:", error);

        if (bioEl) {
            bioEl.hidden = true;
        }

        if (socialsEl) {
            socialsEl.replaceChildren();
            socialsEl.hidden = true;
        }

    }
}

// =============================================
// IDENTIFY CURRENT MEMBER
// =============================================

function getCurrentMember() {

    if (!members.length) {
        return null;
    }

    // First: match the visible member name.

    const visibleName = normalize(
        nameEl?.textContent
    );

    if (visibleName && membersByName.has(visibleName)) {
        return membersByName.get(visibleName);
    }

    // Second: use the member number.

    const number = Number.parseInt(
        numEl?.textContent,
        10
    );

    if (
        Number.isInteger(number) &&
        number >= 1
    ) {
        return members[number - 1] || null;
    }

    return null;
}

// =============================================
// RENDER MEMBER BIO
// =============================================

function renderBio(member) {

    if (!bioEl) return;

    const bio = String(member?.bio || "").trim();

    bioEl.textContent = bio;

    bioEl.hidden = !bio;

}

// =============================================
// CREATE REDIRECTING BUTTON
// =============================================

function createSocialButton(member, platform) {

    const url = safeURL(
        member?.[platform.key]
    );

    if (!url) {
        return null;
    }

    const button = document.createElement("a");

    button.href = url;

    button.target = "_blank";

    button.rel = "noopener noreferrer";

    button.className =
        `member-social-button ${platform.className}`;

    button.setAttribute(
        "aria-label",
        `Visit ${member.name}'s ${platform.name} profile`
    );

    button.title = platform.name;

    // Button text and redirect arrow.

    const label = document.createElement("span");

    label.className = "social-label";

    label.textContent = platform.name;

    const arrow = document.createElement("span");

    arrow.className = "social-arrow";

    arrow.textContent = "↗";

    button.appendChild(label);

    button.appendChild(arrow);

    return button;
}

// =============================================
// RENDER MEMBER SOCIAL BUTTONS
// =============================================

function renderSocialLinks(member) {

    if (!socialsEl) return;

    // Clear previous member's buttons.

    socialsEl.replaceChildren();

    let buttonCount = 0;

    PLATFORMS.forEach(platform => {

        const button = createSocialButton(
            member,
            platform
        );

        if (!button) return;

        socialsEl.appendChild(button);

        buttonCount++;

    });

    // Hide container if member has no social links.

    socialsEl.hidden = buttonCount === 0;

}

// =============================================
// UPDATE CURRENT MEMBER
// =============================================

function renderMember() {

    const member = getCurrentMember();

    if (!member) {

        if (bioEl) {
            bioEl.hidden = true;
        }

        if (socialsEl) {
            socialsEl.replaceChildren();
            socialsEl.hidden = true;
        }

        return;
    }

    renderBio(member);

    renderSocialLinks(member);

    console.log(
        "Displayed social profiles for:",
        member.name
    );

}

// =============================================
// WATCH CAROUSEL CHANGES
// =============================================

function observeCarousel() {

    const observer = new MutationObserver(() => {

        if (renderFrame) {
            cancelAnimationFrame(renderFrame);
        }

        renderFrame = requestAnimationFrame(() => {

            renderMember();

        });

    });

    [nameEl, numEl].forEach(element => {

        if (!element) return;

        observer.observe(element, {
            childList: true,
            characterData: true,
            subtree: true
        });

    });

}

// =============================================
// INITIALIZATION
// =============================================

async function init() {

    if (!nameEl || !roleEl || !socialsEl) {

        console.warn(
            "Team extras: Required HTML elements not found."
        );

        return;
    }

    observeCarousel();

    await loadMembers();

}

init();