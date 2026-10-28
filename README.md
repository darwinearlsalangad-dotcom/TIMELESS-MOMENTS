# 📸 TIMELESS MOMENTS — Photography Portfolio & Studio CMS

A responsive photography portfolio website for **Timeless Moments**, featuring high-definition category galleries, dynamic photo uploading, a live studio details editor, interactive client reviews, and full internet hosting support.

---

## 🌟 Key Features

1. **Photo Upload & Gallery Management**
   - Drag-and-drop single & batch photo uploading.
   - Categorize by **Wedding, Birthday, Portraits, Pre-Wedding, Festival, Baptism, Graduation, Family Frame, Babeography**, or custom categories.
   - Assign to sub-galleries / albums.
   - Add photo titles, captions, and capture dates.
   - Live photo management: browse, search, preview, and delete uploaded photos.

2. **Studio & Website Details Editor**
   - Edit Brand Name (`TIMELESS MOMENTS`), Tagline (`We crafted life's best stories`), and Hero story.
   - Edit About Us biography and Founder profile (`Jason Tenedero`).
   - Edit Contact details: Email, Mobile Phone, Facebook, and Instagram links.
   - Instant live updates across all pages without touching code.

3. **Interactive Client Feedback & Reviews**
   - Real-time 5-star rating system with star highlights.
   - Visitor comment submission form with instant toast confirmation.
   - Dynamic testimonials slideshow rotating on gallery pages.
   - Admin moderation: review, delete, or add featured testimonials.

4. **Fullscreen High-Definition Lightbox**
   - Click any photo across all galleries to view in high resolution with captions and keyboard navigation (Left/Right arrows, Escape to close).

5. **Ready for Internet Hosting**
   - Production-ready Node.js Express server (`server.js`).
   - 1-Click free deployment configs: `render.yaml` (Render), `Procfile` (Railway), `vercel.json` (Vercel).
   - Dual-Mode: Full backend API with local disk storage + client-side storage fallback (works even on static GitHub Pages!).

---

## 🛠️ Quick Start (Running Locally)

1. Make sure Node.js is installed.
2. Open terminal in this folder and start the server:
   ```bash
   npm start
   ```
3. Open your browser:
   - **Website**: [http://localhost:3000](http://localhost:3000)
   - **Admin Portal**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
   - **Default Admin Password**: `admin`

---

## 🌐 Internet Hosting Instructions

See [DEPLOYMENT.md](DEPLOYMENT.md) for full step-by-step guides on deploying for free to:
- **Render.com** (Recommended for full backend & photo storage)
- **Railway.app**
- **Vercel**
- **GitHub Pages**

---

## 📁 Project Structure

```
IT ELECTIVE 1 FINALS/
├── server.js               # Node.js Express server with upload & details API
├── package.json            # Project dependencies & scripts
├── render.yaml             # 1-Click Render.com deployment configuration
├── Procfile                # Railway / Heroku process file
├── vercel.json             # Vercel deployment configuration
├── DEPLOYMENT.md           # Step-by-step hosting guide
├── index.html              # Root redirect entry point
├── data/
│   └── site-data.json      # Persistent database for details, photos & reviews
└── index/
    ├── admin.html          # Admin & Photo Upload Control Dashboard
    ├── admin.css           # Admin styling
    ├── index.html          # Main homepage
    ├── index.css           # Homepage styling
    ├── wedding.html        # Wedding gallery & category pages...
    ├── js/
    │   ├── timeless.js     # Core client engine (lightbox, dynamic sync, reviews)
    │   └── admin.js        # Admin portal engine (upload, manager, details edit)
    ├── uploads/            # Directory where newly uploaded photos are stored
    ├── image/              # Original photography & logos
    └── video/              # Header videos for categories
```
