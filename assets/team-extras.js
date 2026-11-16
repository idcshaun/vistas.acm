import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================
   VISTAS ACM - TEAM EXTRAS
   Member Bio + Social Media Redirects
========================================= */

const $ = (id) => document.getElementById(id);

const CONFIG = {
    configEndpoint: "/api/config",
    table: "team_members"
};

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

/* =========================================
   SOCIAL MEDIA SVG ICONS
========================================= */

const ICONS = {

    linkedin: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.34 18H5.67V9.5h2.67ZM7 8.34a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1ZM18.34 18h-2.67v-4.14c0-.99-.02-2.27-1.38-2.27-1.39 0-1.6 1.08-1.6 2.2V18h-2.67V9.5h2.56v1.16h.04a2.8 2.8 0 0 1 2.52-1.38c2.7 0 3.2 1.78 3.2 4.1Z"/>
        </svg>
    `,

    github: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.08c-3.1.67-3.75-1.32-3.75-1.32-.5-1.29-1.23-1.63-1.23-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.23-5.11 5.51.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/>
        </svg>
    `,

    instagram: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect
                x="3" y="3"
                width="18" height="18"
                rx="5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            />
            <circle
                cx="12" cy="12" r="4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            />
            <circle cx="17.5" cy="6.8" r="1.2"/>
        </svg>
    `
};


/* =========================================
   URL VALIDATION
========================================= */

function safeURL(value) {

    if (!value || typeof value !== "string") {
        return null;
    }

    try {

        const url = new URL(value.trim());

        if (!["https:", "http:"].includes(url.protocol)) {
            return null;
        }

        return url.href;

    } catch {
        return null;
    }
}


/* =========================================
   CREATE SOCIAL BUTTON
========================================= */

function createSocialButton(platform, url) {

    const anchor = document.createElement("a");

    anchor.className =
        `member-social-button ${platform.className}`;

    anchor.href = url;

    anchor.target = "_blank";

    anchor.rel = "noopener noreferrer";

    anchor.title = platform.name;

    anchor.setAttribute(
        "aria-label",
        `Visit member's ${platform.name} profile`
    );

    anchor.innerHTML = ICONS[platform.className];

    return anchor;
}


/* =========================================
   MAIN INITIALIZATION
========================================= */

async function initTeamExtras() {

    const bioEl = $("member-bio");
    const socialsEl = $("member-socials");

    const nameEl = $("nm");
    const roleEl = $("rl");
    const domainEl = $("tm");
    const numberEl = $("in");

    if (!bioEl || !socialsEl || !nameEl || !roleEl) {

        console.error(
            "[Team Extras] Required HTML elements are missing."
        );

        return;
    }

    try {

        /* FETCH SUPABASE CONFIG */

        const configResponse = await fetch(
            CONFIG.configEndpoint,
            { cache: "no-store" }
        );

        if (!configResponse.ok) {
            throw new Error("Unable to load Supabase configuration.");
        }

        const config = await configResponse.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is incomplete.");
        }

        /* INITIALIZE SUPABASE */

        const supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

        /* FETCH TEAM MEMBERS */

        const { data, error } = await supabase
            .from(CONFIG.table)
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

        if (!data || data.length === 0) {
            console.warn("[Team Extras] No published members found.");
            return;
        }

        const members = data;

        console.log(
            `[Team Extras] Loaded ${members.length} members.`
        );


        /* =================================
           FIND CURRENT MEMBER
        ================================= */

        function normalizeName(name) {

            return String(name || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
        }

        function getCurrentMember() {

            const currentName = normalizeName(
                nameEl.textContent
            );

            const matchedMember = members.find(
                member =>
                    normalizeName(member.name) === currentName
            );

            if (matchedMember) {
                return matchedMember;
            }

            const currentIndex = Number(
                numberEl?.textContent.trim()
            ) - 1;

            if (
                Number.isInteger(currentIndex) &&
                currentIndex >= 0 &&
                currentIndex < members.length
            ) {
                return members[currentIndex];
            }

            return null;
        }


        /* =================================
           RENDER MEMBER BIO
        ================================= */

        function renderBio(member) {

            const bio = member?.bio?.trim();

            bioEl.textContent = bio || "";

            bioEl.hidden = !bio;
        }


        /* =================================
           RENDER SOCIAL BUTTONS
        ================================= */

        function renderSocials(member) {

            socialsEl.replaceChildren();

            let buttonCount = 0;

            for (const platform of PLATFORMS) {

                const url = safeURL(
                    member?.[platform.key]
                );

                if (!url) {
                    continue;
                }

                const button = createSocialButton(
                    platform,
                    url
                );

                socialsEl.appendChild(button);

                buttonCount++;
            }

            socialsEl.hidden = buttonCount === 0;
        }


        /* =================================
           RENDER CURRENT MEMBER
        ================================= */

        let previousMemberId = null;

        function render() {

            const member = getCurrentMember();

            if (!member) {

                bioEl.hidden = true;
                socialsEl.hidden = true;

                return;
            }

            if (previousMemberId === member.id) {
                return;
            }

            previousMemberId = member.id;

            renderBio(member);

            renderSocials(member);

            console.log(
                `[Team Extras] Displaying ${member.name}`,
                {
                    bio: Boolean(member.bio),
                    socialLinks: PLATFORMS.filter(
                        platform =>
                            safeURL(member[platform.key])
                    ).map(platform => platform.name)
                }
            );
        }


        /* =================================
           WATCH CAROUSEL CHANGES
        ================================= */

        const observer = new MutationObserver(() => {

            render();

        });

        observer.observe(nameEl, {
            childList: true,
            characterData: true,
            subtree: true
        });

        if (numberEl) {

            observer.observe(numberEl, {
                childList: true,
                characterData: true,
                subtree: true
            });

        }


        /* INITIAL RENDER */

        render();

        /* FALLBACK: CHECK AFTER CAROUSEL LOAD */

        setTimeout(render, 500);
        setTimeout(render, 1500);

        console.log("[Team Extras] Initialization complete.");

    } catch (error) {

        console.error(
            "[Team Extras] Initialization failed:",
            error
        );

        bioEl.hidden = true;
        socialsEl.hidden = true;
    }
}


/* =========================================
   START
========================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initTeamExtras,
        { once: true }
    );

} else {

    initTeamExtras();

}