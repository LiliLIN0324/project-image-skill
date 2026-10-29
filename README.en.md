<div align="center">

# Plates · project-image

**Turn one subject into a set of 16:9 numbered images you can ship as-is**

One real UI screenshot per page · one point per page · 4762×2678 px

[![version](https://img.shields.io/badge/version-0.2.0-111111?style=flat-square)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square)](LICENSE)
[![python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](scripts/export.py)
[![chrome](https://img.shields.io/badge/Chrome-system-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#dependencies)
[![stars](https://img.shields.io/github/stars/LiliLIN0324/project-image-skill?style=social)](https://github.com/LiliLIN0324/project-image-skill/stargazers)

[Quick start](#quick-start) · [How it works](#how-it-works) · [Measured results](#measured-results) · [中文](README.md)

<img src="assets/example-02.jpg" alt="Sample page: copy on the left, a real product screen framed in a system window on the right" width="840">

<sub>One finished page: a single sentence on the left, a real product screen on the right. Produced for a real open-source project deck (<a href="https://github.com/endtree-FDE/mimi-agent">mimi-agent</a>).</sub>

</div>

---

## The problem

Most project intro decks are either a pile of screenshots with a paragraph bolted on, or a template. Both come out wrong in the same three ways:

1. **Pictures and words never meet** — two screenshots side by side with no sentence telling the reader what to look at;
2. **Too much per page** — three images, five paragraphs, four color blocks, all mush at full size;
3. **Beige paper background** — paper grain, big rounded cards, hazy gray shadows: template smell.

This skill does one thing: **capture real screenshots first, then lay them out as a series where each page makes one point.**

Every page carries a genuine screenshot of the target project (not a mockup, not stock, not AI-generated); copy is capped at three points and only describes what is visible in the image; white background, two-layer faint shadows, serif display type, at most two accent marks per page. The canvas is fixed at 4762×2678, numbered `01.jpg…NN.jpg`, ready for social posts, a case-study page, or an email attachment.

## Measured results

A real run: a four-page external deck for a Feishu group assistant.

| | |
|---|---|
| Canvas | 4762×2678 (CSS 2381×1339 @ DPR 2) |
| Pages | 4 (`02`–`05`), cover reused existing art |
| File size | 0.55 / 0.61 / 0.75 / 0.97 MB (q91, subsampling=0) |
| Real assets per page | 1 — product chat UI, README architecture diagram, GitHub repo page |
| Copy per page | 1 title + 1 sentence + ≤3 short points |
| Time | ~25 min assets, ~3 min layout, ~10 s export |
| Glow smoothness | edge scan 244.7 → 254.9 from corner to center, max 0.17 levels per 10 px |
| Type scale | 96 / 64 / 32 / 30 / 22 px, no extra tiers |

## Features

| | |
|---|---|
| **Images are mandatory** | Every page needs a real screenshot taking ≥40% of the canvas; no two text-only pages in a row |
| **Exact output size** | Pages are laid out at 2381×1339 and captured at DPR 2, so files are exactly 4762×2678 — no scaling, no upscaling artifacts |
| **System window frame** | Screenshots sit inside a macOS title bar (three dots) or a Windows title bar, never pasted bare |
| **Glow with no edge** | Corner-anchored radial, six stops, final alpha 0 beyond 100%, plus export dithering — no concentric banding |
| **Two faint shadows only** | `1px 2px` + `18px 44px`; large gray shadows are banned because they read as dirty on white |
| **No invented numbers** | Every figure on a page must be traceable to the screenshot beside it |
| **Zero screenshot deps** | System Chrome + CDP: no Chromium download, no Playwright |
| **Clean by default** | `shots/` is disposable; the repo ships a cleanup convention so no hundreds of MB of PNGs pile up |

## Quick start

### 1. Install

```bash
git clone https://github.com/LiliLIN0324/project-image-skill.git ~/.qoder/skills/project-image
```

For Claude Code / Codex / Gemini CLI, drop the directory into the matching skills folder. Without a skills mechanism, hand `SKILL.md` to the agent as a prompt.

### 2. Capture assets

Open the target's site, repo or demo and screenshot each step, into `_work/imgs/`. Don't start writing until the assets exist — copy only describes what the images show.

### 3. Lay out pages

Write a `stage.html`: each `<section class="page">` is one page, 2381×1339, styled per the visual system in `SKILL.md`.

### 4. Capture and export

```bash
node scripts/render.mjs stage.html shots      # system Chrome capture → shots/01.png…
python scripts/export.py shots fig            # resize to 4762×2678, dither, save fig/01.jpg…
```

Override defaults with `PAGE_W` / `PAGE_H` / `DPR` / `CHROME_PATH` / `CDP_PORT`.

### 5. Self-check

Run the checklist at the end of `SKILL.md`: size, image share, numbering, page numbers, monotone glow falloff, every number traceable.

## How it works

```
target project ──screenshots──> _work/imgs/
                │
          stage.html (one .page per slide, 2381×1339)
                │
          render.mjs (CDP capture, DPR 2)
                │
          shots/01.png … NN.png
                │
          export.py (LANCZOS to 4762×2678 + near-white dither + JPEG q91)
                │
          fig/01.jpg … NN.jpg
```

Every step reruns on its own: copy edits → render + export; new screenshots → replace the file in `imgs/`.

## Layout

```
project-image-skill/
├── SKILL.md            # full spec: sizes, layouts, visual system, glow, checklist
├── AGENTS.md           # entry point for any coding agent
├── CLAUDE.md / GEMINI.md
├── scripts/
│   ├── render.mjs      # system Chrome + CDP per-page capture
│   └── export.py       # resize + dither + JPEG
└── assets/             # sample pages
```

## Dependencies

| Layer | What | Why |
|---|---|---|
| Layout | Hand-written HTML + CSS | Layout belongs in the browser: what you see is what you export |
| Capture | System Chrome + CDP (`Emulation.setDeviceMetricsOverride`, `Page.captureScreenshot`) | No Chromium download; one shot at DPR 2 lands on 4762×2678 |
| Driver | Node built-in `WebSocket` + `child_process` | No Playwright/Puppeteer; a single file, `node render.mjs` |
| Resize/encode | Python + Pillow + numpy | LANCZOS + near-white dither + `quality=91, subsampling=0`: small files, sharp type |
| Type | System Noto Serif SC 900 / Noto Sans SC 300·500 | Serif CJK display is what separates this from template decks; system fonts, no download |

## Known limits

- Static images only — no motion, no video.
- A human pass is required: third-party watermarks, personal QR codes and real backend data in screenshots must be removed before delivery.
- Not every point fits on one page. Split the page; don't shrink the type.

## License

MIT
