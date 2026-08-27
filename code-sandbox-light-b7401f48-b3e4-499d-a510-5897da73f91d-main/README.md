# KidSpark — Fun Activities for Kids

A friendly, community-driven website where parents, teachers and caregivers can **browse** and **post** fun activities for kids — crafts, outdoor games, science experiments, sensory play, and more.

## 🎯 Project Goal
Give families and educators a simple, no-signup place to discover new ideas to keep kids engaged, and to share their own favorite activities with the community.

## ✅ Currently Completed Features
- **Browse activities** in a responsive card grid, each showing an image, category badge, age group, duration, author, and like count.
- **Post a new activity** via a validated form (title, category, age group, duration, author name, materials needed, image URL, description). New posts appear instantly at the top of the browse grid.
- **Filtering**
  - Category filter (dropdown + quick-select chips)
  - Age-group filter (Toddler, Preschool, Kids, Tween, All Ages)
  - Live text search (title, description, materials) via header/mobile search box
  - "Clear filters" button
- **Sorting**: Newest, Most Loved, Quickest First, A–Z
- **Like / heart button** on every card (and in the detail view) with an optimistic UI update, persisted to the table and remembered per-browser via `localStorage` so a user's own likes stay marked.
- **Activity detail modal** — click any card to see the full description, materials list, and larger image.
- **Live stats bar**: total activities, number of categories, total hearts given, number of contributors.
- **Fully responsive design** with a mobile hamburger menu, built with Tailwind CSS, Google Fonts (Baloo 2 + Nunito) and Font Awesome icons.
- **Seed content**: 8 example activities across all categories are pre-loaded so the site isn't empty on first visit.

## 🌐 Site Structure / Entry Points
Single-page app — `index.html` is the only page, organized into in-page sections:
| Section (anchor) | Purpose |
|---|---|
| `#top` | Header / hero |
| `#browse-section` | Browse, filter, sort and like activities |
| `#post-section` | Form to submit a new activity |
| `#about-section` | Short "why KidSpark" blurb |

No query parameters are used; all state (filters, search, sort) lives in client-side JS and updates the DOM directly.

## 🗄️ Data Model — `activities` table
| Field | Type | Description |
|---|---|---|
| `id` | text | Unique identifier |
| `title` | text | Activity title |
| `description` | rich_text | Full description / instructions |
| `category` | text (enum) | Arts & Crafts, Outdoor, Indoor, Educational, Science, Sports & Physical, Sensory Play, Party Games, Music & Dance |
| `age_group` | text (enum) | Toddler (1-3), Preschool (3-5), Kids (6-9), Tween (10-12), All Ages |
| `duration_minutes` | number | Estimated duration in minutes |
| `materials_needed` | text | Supplies needed |
| `image_url` | text | Image representing the activity |
| `author_name` | text | Name of the person who posted it |
| `likes` | number | Number of hearts received |

Data is read/written through the built-in RESTful Table API (`tables/activities`) — no custom backend required. Likes are updated via `PATCH`, new posts via `POST`.

## 🚧 Features Not Yet Implemented
- User accounts / authentication (posting is anonymous by design, per static-site constraints)
- Comments or replies on activities
- Editing or deleting a posted activity from the UI (currently only creation + liking)
- Image upload (users must paste an image URL; no file upload/storage backend)
- Reporting/moderation tools for inappropriate posts
- Pagination for very large numbers of activities (currently loads up to 200 at once)

## 🔭 Recommended Next Steps
1. Add an "edit/delete my post" flow, gated by a simple locally-stored author token.
2. Add pagination or infinite scroll once the activity count grows large.
3. Add a "featured/staff pick" flag and a curated homepage carousel.
4. Add category-specific icons/illustrations for a more playful visual identity.
5. Consider a lightweight moderation queue (e.g. a `status` field: pending/approved) if opened to the public.

## 🛠️ Tech Stack
- HTML5 + Tailwind CSS (CDN) + custom CSS (`css/style.css`)
- Vanilla JavaScript (`js/main.js`) — no framework
- Font Awesome icons, Google Fonts (Baloo 2, Nunito)
- RESTful Table API for persistence (`tables/activities`)

## 📁 File Structure
```
index.html       Main single-page site (hero, browse, post form, about, modal, footer)
css/style.css    Custom styles supplementing Tailwind (cards, chips, toast, animations)
js/main.js       Data fetching, rendering, filtering/sorting, posting, liking, modal logic
README.md        This file
```

## 🚀 Deployment
This project is not yet deployed. To publish it live, use the **Publish tab** to deploy with one click, or ask the assistant to perform a Hosted Deploy.
