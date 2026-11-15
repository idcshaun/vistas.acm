// ======================================================
// VISTAS ACM — MAIN WEBSITE JAVASCRIPT
// Dynamic Team Carousel + Website Interactions
// ======================================================


// ======================================================
// GLOBAL CONFIGURATION
// ======================================================

var LOGO = "assets/vistas-acm-blue-logo.jpg";

var WORDS = [
    "Build",
    "Lead",
    "Create",
    "Connect",
    "Explore",
    "Design",
    "Code",
    "Share",
    "Learn",
    "Ship",
    "Test",
    "Inspire",
    "Solve",
    "Grow",
    "Imagine"
];

var HUES = [
    210, 202, 216, 206, 220,
    198, 212, 205, 218, 200,
    214, 208, 222, 204, 216
];


// ======================================================
// PLACEHOLDER DATA
// EVENTS / PROJECTS / GALLERY
// These will be connected to Supabase later.
// ======================================================

var EV = [
    ["Workshop", 210],
    ["Talk", 202],
    ["Community", 218],
    ["Workshop", 206],
    ["Talk", 220],
    ["Community", 198]
];

var PR = [
    ["Software", 208],
    ["Research", 218],
    ["Creative", 198]
];

var GL = [
    ["Workshop", 210],
    ["Talk", 200],
    ["Community", 218],
    ["Workshop", 205],
    ["Community", 220],
    ["Talk", 198],
    ["Workshop", 212]
];


// ======================================================
// MAIN APPLICATION
// ======================================================

(function () {

    // --------------------------------------------------
    // DOM HELPERS
    // --------------------------------------------------

    var $ = function (selector, root) {
        return (root || document).querySelector(selector);
    };

    var $$ = function (selector, root) {
        return [].slice.call(
            (root || document).querySelectorAll(selector)
        );
    };


    // --------------------------------------------------
    // GLOBAL ELEMENTS
    // --------------------------------------------------

    var still = matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    var SPA = !!$("#v-home");

    var nv = $("#nv");

    var wipe = $("#wipe");


    // --------------------------------------------------
    // CURRENT YEAR
    // --------------------------------------------------

    $$("[data-year]").forEach(function (element) {

        element.textContent = new Date().getFullYear();

    });


    // ==================================================
    // EVENTS / PROJECTS / GALLERY PLACEHOLDERS
    // ==================================================

    var CARD = {

        events: [
            "Date to be announced",
            "Event title to be confirmed",
            "Event details and approved photography will appear here.",
            EV
        ],

        projects: [
            "Case study",
            "Project title to be confirmed",
            "Summary and contributors will appear after the team submission is approved.",
            PR
        ],

        gallery: [
            "Archive",
            "",
            "",
            GL
        ]

    };


    $$("[data-grid]").forEach(function (grid) {

        var key = CARD[grid.dataset.grid];

        if (!key) return;

        var limit = +grid.dataset.limit || 99;

        var list = key[3].slice(0, limit);


        grid.innerHTML = list.map(function (card) {

            if (grid.dataset.grid === "gallery") {

                return `
                    <article class="ev rv" data-c="${card[0]}">

                        <div
                            class="art"
                            style="--c:${card[1]}"
                            data-w="${card[0]}"
                        >
                            <img src="${LOGO}" alt="">
                        </div>

                        <span class="mono lb">
                            ${card[0]}
                        </span>

                    </article>
                `;

            }


            return `
                <article class="ev rv" data-c="${card[0]}">

                    <div
                        class="art"
                        style="--c:${card[1]}"
                        data-w="${card[0]}"
                    >
                        <img src="${LOGO}" alt="">
                    </div>

                    <div class="t">

                        <span class="mono">
                            ${card[0]} · ${key[0]}
                        </span>

                        <h3>${key[1]}</h3>

                        <p>${key[2]}</p>

                    </div>

                </article>
            `;

        }).join("");

    });


    // ==================================================
    // FILTER CHIPS
    // ==================================================

    $$("[data-chips]").forEach(function (box) {

        var grid = box.nextElementSibling;

        $$(".chip", box).forEach(function (button) {

            button.addEventListener("click", function () {

                $$(".chip", box).forEach(function (item) {

                    item.setAttribute(
                        "aria-pressed",
                        item === button
                    );

                });


                $$(".ev", grid).forEach(function (element) {

                    element.hidden =
                        button.dataset.f !== "All" &&
                        element.dataset.c !== button.dataset.f;

                });

            });

        });

    });


    // ==================================================
    // DYNAMIC TEAM CAROUSEL
    // SUPABASE INTEGRATION
    // ==================================================

    var M = [];

    var tk = $("#tk");

    var N = 0;

    var W = [];

    var S = [];

    var act = -1;

    var tt = $("#team.tt");

    var hn = $("#hn");

    var wd = $("#wds");

    var sl = $("#sls");

    var totalMembers = $("#total-members");


    // --------------------------------------------------
    // NUMBER FORMATTER
    // --------------------------------------------------

    function pad(number) {

        return (number < 10 ? "0" : "") + number;

    }


    // --------------------------------------------------
    // ANIMATED TEXT TRANSITION
    // --------------------------------------------------

    function swap(element, text) {

        if (!element || element.textContent === text) {
            return;
        }

        element.textContent = text;

        if (element.animate && !still) {

            element.animate(

                [
                    {
                        opacity: 0,
                        transform: "translateY(18px)"
                    },

                    {
                        opacity: 1,
                        transform: "none"
                    }
                ],

                {
                    duration: 520,
                    easing: "cubic-bezier(.2,.8,.2,1)"
                }

            );

        }

    }


    // --------------------------------------------------
    // GENERATE CAROUSEL SLIDES
    // --------------------------------------------------

    function generateTeamSlides() {

        if (!tk || !wd || !sl) return;


        // CLEAR OLD SLIDES

        wd.innerHTML = "";

        sl.innerHTML = "";

        W = [];

        S = [];


        // EMPTY TEAM STATE

        if (!M.length) {

            var empty = document.createElement("div");

            empty.className = "team-empty";

            empty.textContent =
                "TEAM PROFILES WILL BE ANNOUNCED SOON.";

            wd.appendChild(empty);


            if (totalMembers) {

                totalMembers.textContent = "/ 00";

            }


            swap($("#nm"), "Coming Soon");

            swap($("#rl"), "Meet our team");

            swap($("#tm"), "VISTAS ACM");

            swap($("#ct"), "00");


            if ($("#in")) {

                $("#in").textContent = "00";

            }

            if (hn) {

                hn.style.opacity = 0;

            }

            sizeTrack();

            return;

        }


        // GENERATE WORDS AND MEMBER IMAGES

        M.forEach(function (member, index) {


            // ------------------------------------------
            // ANIMATED WORD
            // ------------------------------------------

            var word = document.createElement("div");

            word.className = "wd";

            word.setAttribute("aria-hidden", "true");

            word.style.fontSize =
                "min(24vw," +
                (
                    110 /
                    Math.max(member.word.length, 1)
                ).toFixed(1) +
                "vw)";

            word.textContent = member.word;

            wd.appendChild(word);


            // ------------------------------------------
            // MEMBER PORTRAIT
            // ------------------------------------------

            var slide = document.createElement("div");

            slide.className =
                "sl" + (member.img ? "" : " ph");


            var image = document.createElement("img");

            image.src = member.img || LOGO;

            image.alt = member.img
                ? "Portrait of " + member.name
                : "VISTAS ACM member";


            image.loading = "lazy";


            // IMAGE FALLBACK

            image.onerror = function () {

                this.onerror = null;

                this.src = LOGO;

            };


            slide.appendChild(image);

            sl.appendChild(slide);

        });


        // ------------------------------------------
        // CACHE GENERATED ELEMENTS
        // ------------------------------------------

        W = $$(".wd", wd);

        S = $$(".sl", sl);


        // ------------------------------------------
        // UPDATE TOTAL MEMBER COUNT
        // ------------------------------------------

        N = M.length;

        if (totalMembers) {

            totalMembers.textContent = "/ " + pad(N);

        }


        // ------------------------------------------
        // INITIALIZE
        // ------------------------------------------

        act = -1;

        sizeTrack();

        set(0);

        onS();

    }


    // --------------------------------------------------
    // SET ACTIVE MEMBER
    // --------------------------------------------------

    function set(index) {

        if (!tk || !M.length) return;

        if (index === act) return;

        if (index < 0 || index >= M.length) return;


        act = index;

        var member = M[index];


        // ------------------------------------------
        // WORD ANIMATION
        // ------------------------------------------

        W.forEach(function (element, i) {

            element.className =
                "wd" +
                (
                    i === index
                        ? " on"
                        : i < index
                            ? " up"
                            : ""
                );

        });


        // ------------------------------------------
        // PORTRAIT ANIMATION
        // ------------------------------------------

        S.forEach(function (element, i) {

            element.className =
                "sl" +
                (M[i].img ? "" : " ph") +
                (
                    i === index
                        ? " on"
                        : i < index
                            ? " up"
                            : ""
                );

        });


        // ------------------------------------------
        // MEMBER INFORMATION
        // ------------------------------------------

        if (tt) {

            tt.style.setProperty("--h", member.hue);

        }


        swap($("#nm"), member.name);

        swap($("#rl"), member.role);

        swap($("#tm"), member.team);


        // ------------------------------------------
        // COUNTER
        // ------------------------------------------

        swap($("#ct"), pad(index + 1));


        if ($("#in")) {

            $("#in").textContent = pad(index + 1);

        }


        // ------------------------------------------
        // SCROLL INSTRUCTION
        // ------------------------------------------

        if (hn) {

            hn.style.opacity = index > 0 ? 0 : 1;

        }

    }


    // --------------------------------------------------
    // TRACK HEIGHT
    // --------------------------------------------------

    function sizeTrack() {

        if (!tk) return;


        if (!N) {

            tk.style.height = innerHeight + "px";

            return;

        }


        tk.style.height =
            (
                N * 0.72 * innerHeight +
                innerHeight
            ) + "px";

    }


    // --------------------------------------------------
    // FETCH TEAM MEMBERS FROM SUPABASE
    // --------------------------------------------------

    async function loadTeamFromSupabase() {

        if (!tk) return;


        try {

            console.log(
                "VISTAS ACM: Loading team members..."
            );


            // ------------------------------------------
            // FETCH PUBLIC CONFIGURATION
            // ------------------------------------------

            var response = await fetch("/api/config");


            if (!response.ok) {

                throw new Error(
                    "Unable to load Supabase configuration."
                );

            }


            var config = await response.json();


            if (
                !config.supabaseUrl ||
                !config.supabaseKey
            ) {

                throw new Error(
                    "Supabase configuration is incomplete."
                );

            }


            // ------------------------------------------
            // LOAD SUPABASE CLIENT
            // ------------------------------------------

            var module = await import(
                "https://esm.sh/@supabase/supabase-js@2"
            );


            var supabase = module.createClient(

                config.supabaseUrl,

                config.supabaseKey,

            );


            // ------------------------------------------
            // FETCH PUBLISHED TEAM MEMBERS
            // ------------------------------------------

            var result = await supabase

                .from("team_members")

                .select(
                    "id, name, designation, domain, bio, image_url, display_order"
                )

                .eq("status", "published")

                .order(
                    "display_order",
                    {
                        ascending: true
                    }
                );


            if (result.error) {

                throw result.error;

            }


            var members = result.data || [];


            // ------------------------------------------
            // MAP DATABASE DATA TO CAROUSEL
            // ------------------------------------------

            M = members.map(function (member, index) {

                return {

                    id: member.id,

                    word: WORDS[
                        index % WORDS.length
                    ],

                    hue: HUES[
                        index % HUES.length
                    ],

                    name:
                        member.name ||
                        "VISTAS ACM Member",

                    role:
                        member.designation ||
                        "Team Member",

                    team:
                        member.domain ||
                        "VISTAS ACM",

                    img:
                        member.image_url || ""

                };

            });


            // ------------------------------------------
            // GENERATE CAROUSEL
            // ------------------------------------------

            generateTeamSlides();


            console.log(
                "VISTAS ACM: Loaded " +
                M.length +
                " published members."
            );


        } catch (error) {

            console.error(
                "VISTAS ACM Team Error:",
                error
            );


            // ------------------------------------------
            // FALLBACK
            // ------------------------------------------

            M = [];

            generateTeamSlides();

            swap(
                $("#nm"),
                "Unable to load team"
            );

            swap(
                $("#rl"),
                "Please try again later."
            );

            swap(
                $("#tm"),
                "VISTAS ACM"
            );

        }

    }


    // --------------------------------------------------
    // INITIALIZE TEAM
    // --------------------------------------------------

    if (tk) {

        sizeTrack();

        loadTeamFromSupabase();

        addEventListener(
            "resize",
            sizeTrack
        );

    }


    // ==================================================
    // SCROLL PROGRESS
    // ==================================================

    var pg = document.createElement("div");

    pg.id = "pg";

    document.body.appendChild(pg);


    var tick = 0;


    function onS() {

        var maxScroll =
            document.documentElement.scrollHeight -
            innerHeight;


        pg.style.transform =
            "scaleX(" +
            (
                maxScroll > 0
                    ? scrollY / maxScroll
                    : 0
            ) +
            ")";


        // NAVBAR SCROLL STATE

        nv.classList.toggle(
            "s",
            scrollY > 40
        );


        // TEAM CAROUSEL PROGRESS

        if (tk && tk.offsetParent && N > 0) {

            var rect = tk.getBoundingClientRect();

            var span = rect.height - innerHeight;


            var progress = Math.min(
                1,
                Math.max(
                    0,
                    -rect.top / span
                )
            );


            var bar = $(".bar");


            if (bar) {

                bar.style.setProperty(
                    "--p",
                    progress.toFixed(3)
                );

            }


            var memberIndex = Math.min(

                N - 1,

                Math.floor(
                    progress * N * 0.999
                )

            );


            set(memberIndex);

        }

    }


    // --------------------------------------------------
    // SCROLL LISTENER
    // --------------------------------------------------

    addEventListener(

        "scroll",

        function () {

            if (!tick) {

                tick = 1;

                requestAnimationFrame(function () {

                    tick = 0;

                    onS();

                });

            }

        },

        {
            passive: true
        }

    );


    onS();


    // ==================================================
    // SCROLL REVEAL / COUNTERS
    // ==================================================

    var io = new IntersectionObserver(

        function (entries) {

            entries.forEach(function (entry) {

                if (!entry.isIntersecting) return;


                entry.target.classList.add("in");

                io.unobserve(entry.target);


                var number = $(
                    "[data-n]",
                    entry.target
                );


                if (number) {

                    count(number);

                }

            });

        },

        {
            threshold: 0.15
        }

    );


    $$(".rv").forEach(function (element) {

        element.style.transitionDelay =

            (
                [].indexOf.call(
                    element.parentNode.children,
                    element
                ) % 4
            ) * 90 + "ms";


        io.observe(element);

    });


    // --------------------------------------------------
    // NUMBER COUNTER ANIMATION
    // --------------------------------------------------

    function count(element) {

        var target = +element.dataset.n;

        var start = performance.now();


        (function animate(time) {

            var progress = Math.min(

                1,

                (time - start) / 1400

            );


            element.textContent = Math.round(

                target *
                (
                    1 -
                    Math.pow(1 - progress, 3)
                )

            );


            if (progress < 1) {

                requestAnimationFrame(animate);

            }

        })(start);

    }


    // ==================================================
    // CARD POINTER EFFECT
    // ==================================================

    $$(".card").forEach(function (card) {

        card.addEventListener(
            "pointermove",
            function (event) {

                var rect = card.getBoundingClientRect();


                card.style.setProperty(
                    "--mx",
                    event.clientX - rect.left + "px"
                );


                card.style.setProperty(
                    "--my",
                    event.clientY - rect.top + "px"
                );

            }
        );

    });


    // ==================================================
    // CUSTOM CURSOR
    // ==================================================

    var cur = $("#cur");


    addEventListener(
        "pointermove",
        function (event) {

            if (event.pointerType !== "mouse") return;

            if (!cur) return;


            cur.style.opacity = 1;


            cur.style.transform =
                "translate(" +
                event.clientX +
                "px," +
                event.clientY +
                "px)";

        }
    );


    // ==================================================
    // HERO PARTICLE ANIMATION
    // ==================================================

    var hero = $(".hero");


    if (hero) {


        // POINTER PARALLAX

        hero.addEventListener(
            "pointermove",
            function (event) {

                var rect = hero.getBoundingClientRect();


                hero.style.setProperty(

                    "--px",

                    (
                        (event.clientX - rect.left) /
                        rect.width -
                        0.5
                    ).toFixed(3)

                );


                hero.style.setProperty(

                    "--py",

                    (
                        (event.clientY - rect.top) /
                        rect.height -
                        0.5
                    ).toFixed(3)

                );

            }
        );


        // PARTICLE CANVAS

        var canvas = $("#fx");


        if (canvas) {

            var context = canvas.getContext("2d");

            var particles = [];

            var width, height;

            var time = 0;


            function resizeCanvas() {

                width = canvas.width = hero.clientWidth;

                height = canvas.height = hero.clientHeight;

            }


            resizeCanvas();

            addEventListener(
                "resize",
                resizeCanvas
            );


            for (var i = 0; i < 90; i++) {

                particles.push({

                    x: Math.random(),

                    y: Math.random(),

                    s: Math.random() * 2 + 0.6,

                    v: Math.random() * 0.0006 + 0.0002,

                    t: Math.random() * 6

                });

            }


            // ANIMATION LOOP

            (function animateParticles() {

                if (hero.offsetParent) {

                    context.clearRect(
                        0,
                        0,
                        width,
                        height
                    );


                    time += 0.02;


                    particles.forEach(function (particle) {

                        particle.y -= particle.v;


                        if (particle.y < 0) {

                            particle.y = 1;

                            particle.x = Math.random();

                        }


                        context.fillStyle =

                            "rgba(30,160,255," +

                            (
                                0.15 +
                                0.6 *
                                Math.abs(
                                    Math.sin(
                                        time + particle.t
                                    )
                                )
                            ) +

                            ")";


                        context.shadowColor = "#19a8ff";

                        context.shadowBlur = 10;


                        context.beginPath();


                        context.arc(

                            particle.x * width +
                            Math.sin(
                                time + particle.t
                            ) * 14,

                            particle.y * height,

                            particle.s,

                            0,

                            7

                        );


                        context.fill();

                    });

                }


                if (!still) {

                    requestAnimationFrame(
                        animateParticles
                    );

                }

            })();

        }

    }


    // ==================================================
    // MOBILE NAVIGATION
    // ==================================================

    var menuToggle = $("#mt");


    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            function () {

                var opened = nv.classList.toggle("o");


                this.setAttribute(
                    "aria-expanded",
                    opened
                );

            }
        );

    }


    // ==================================================
    // CONTACT FORM
    // ==================================================

    var form = $("#f");


    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                var data = new FormData(event.target);


                var body =

                    "Name: " + data.get("name") +

                    "\nEmail: " + data.get("email") +

                    "\nBranch/Year: " + data.get("by") +

                    "\nInterest: " + data.get("int") +

                    "\n\n" + data.get("msg");


                location.href =

                    "mailto:?subject=" +

                    encodeURIComponent(
                        "VISTAS ACM membership request"
                    ) +

                    "&body=" +

                    encodeURIComponent(body);


                if ($("#ok")) {

                    $("#ok").textContent =

                        "Opening your email app. Add the chapter email once confirmed.";

                }

            }
        );

    }


    // ==================================================
    // PAGE WIPE TRANSITIONS
    // ==================================================

    function wipeIn(callback) {

        if (still) {

            callback();

            return;

        }


        wipe.style.animation = "none";

        wipe.style.transition = "none";

        wipe.style.transform = "translateY(100%)";


        void wipe.offsetWidth;


        wipe.style.transition =

            "transform .55s cubic-bezier(.7,0,.2,1)";


        wipe.style.transform = "none";


        setTimeout(
            callback,
            560
        );

    }


    function wipeOut() {

        if (still) return;


        wipe.style.transition =

            "transform .7s cubic-bezier(.7,0,.2,1)";


        wipe.style.transform = "translateY(-100%)";

    }


    // ==================================================
    // SPA ROUTING
    // ==================================================

    var TITLES = window.TITLES || {};


    function route(first) {

        var page = location.hash.slice(1);


        if (!TITLES[page]) {

            page = "home";

        }


        // SHOW CURRENT VIEW

        $$(".view").forEach(function (view) {

            view.hidden =
                view.id !== "v-" + page;

        });


        // UPDATE DOCUMENT TITLE

        document.title = TITLES[page];


        document.body.classList.toggle(
            "home",
            page === "home"
        );


        // NAVIGATION ACTIVE STATE

        $$(".nav a.l").forEach(function (link) {

            link.toggleAttribute(

                "aria-current",

                link.dataset.p === page

            );

        });


        // RESET SCROLL

        scrollTo({

            top: 0,

            behavior: "instant"

        });


        sizeTrack();

        act = -1;

        set(0);

        onS();


        nv.classList.remove("o");


        if (!first) {

            wipeOut();

        }

    }


    // --------------------------------------------------
    // ROUTING INITIALIZATION
    // --------------------------------------------------

    if (SPA) {

        addEventListener(
            "hashchange",
            function () {

                route(false);

            }
        );


        route(true);

    } else {

        var currentPage = document.body.dataset.page;


        $$(".nav a.l").forEach(function (link) {

            link.toggleAttribute(

                "aria-current",

                link.dataset.p === currentPage

            );

        });

    }


    // ==================================================
    // NAVIGATION CLICK HANDLING
    // ==================================================

    document.addEventListener(
        "click",
        function (event) {

            var link = event.target.closest("a[data-p]");


            if (
                !link ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {

                return;

            }


            var page = link.dataset.p;


            if (
                SPA &&
                location.hash.slice(1) === page
            ) {

                return;

            }


            event.preventDefault();


            wipeIn(function () {

                if (SPA) {

                    location.hash = page;

                } else {

                    location.href =
                        link.getAttribute("href");

                }

            });

        }
    );
    
    /* ACTIVE PAGE NAVIGATION */

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = (
    document.body.dataset.page ||
    window.location.pathname.split("/").pop().replace(".html", "") ||
    "home"
  ).toLowerCase();

  document.querySelectorAll(".nav .menu .l").forEach(link => {
    const page = link.dataset.p;

    if (page === currentPage) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    }
  });
});

})();