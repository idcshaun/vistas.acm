# VISTAS ACM — Combined Intro Loader + Reference Background

This package combines the intro-loader version of the VISTAS ACM website with the supplied reference background assets and topographic motion video.

## Included
- Existing VISTAS ACM website (based on the intro-loader project ZIP)
- `assets/vistas-intro-loader.mp4` — intro animation
- `assets/vistas-bg-gradient.jpg` — atmospheric blue background
- `assets/vistas-bg-grid.jpg` — technical grid texture
- `assets/vistas-topography.mp4` — looping topographic background video
- Updated `assets/site.css` — global background and loader styling
- Updated `assets/site.js` — injects the background video on public pages

## Installation
1. Extract this ZIP.
2. Replace your project files with the contents of `vistas.acm-main` (or merge them into your existing project).
3. Keep all four media files inside `assets/`.
4. Run the project using your existing setup.

The intro animation remains the first-visit loader. The topographic video is a separate, low-opacity background layer on public pages. Admin pages are not targeted by the background-video script.

To replay the intro loader in the same browser tab, run:
```js
sessionStorage.removeItem("vistas-acm-intro-seen");
location.reload();
```

No Supabase credentials or environment secrets are included or changed.
