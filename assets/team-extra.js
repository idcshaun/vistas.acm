```css
/* =============================================
   VISTAS ACM — MEMBER BIO AND SOCIAL LINKS
============================================= */

.member-bio {
    max-width: 420px;
    margin-top: 18px;
    color: rgba(255,255,255,.72);
    font-size: 14px;
    line-height: 1.8;
}

.member-bio[hidden],
.member-socials[hidden] {
    display: none !important;
}

.member-socials {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 22px;
}

.member-social-link {
    width: 44px;
    height: 44px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    border: 1px solid rgba(255,255,255,.25);
    border-radius: 50%;

    color: #fff;
    background: rgba(255,255,255,.05);

    text-decoration: none;

    transition:
        background .3s ease,
        border-color .3s ease,
        transform .3s ease;
}

.member-social-link svg {
    width: 19px;
    height: 19px;
    fill: currentColor;
}

.member-social-link.instagram svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.member-social-link:hover {
    background: #20a8ff;
    border-color: #20a8ff;
    transform: translateY(-4px);
}

.member-social-link:focus-visible {
    outline: 2px solid #20a8ff;
    outline-offset: 4px;
}

@media (max-width: 700px) {

    .member-bio {
        max-width: 100%;
        font-size: 13px;
        line-height: 1.65;
        margin-top: 12px;
    }

    .member-socials {
        justify-content: center;
        margin-top: 16px;
    }

    .member-social-link {
        width: 40px;
        height: 40px;
    }

}
```