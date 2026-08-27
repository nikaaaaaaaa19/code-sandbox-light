// KidSpark Activities — main.js
// Handles fetching, rendering, filtering, sorting, posting, and liking activities.

const TABLE = 'activities';

const CATEGORY_META = {
  'Arts & Crafts':      { icon: 'fa-palette',       color: '#FF6B6B' },
  'Outdoor':             { icon: 'fa-tree',          color: '#7BC950' },
  'Indoor':              { icon: 'fa-house',         color: '#8675A9' },
  'Educational':         { icon: 'fa-book',          color: '#4ECDC4' },
  'Science':             { icon: 'fa-flask',         color: '#3B82F6' },
  'Sports & Physical':   { icon: 'fa-futbol',        color: '#F97316' },
  'Sensory Play':        { icon: 'fa-hand-sparkles', color: '#EC4899' },
  'Party Games':         { icon: 'fa-gift',          color: '#FFC93C' },
  'Music & Dance':       { icon: 'fa-music',         color: '#06B6D4' },
};
const DEFAULT_META = { icon: 'fa-star', color: '#94A3B8' };

const AGE_ORDER = ['Toddler (1-3)', 'Preschool (3-5)', 'Kids (6-9)', 'Tween (10-12)', 'All Ages'];

let allActivities = [];
let likedIds = new Set(JSON.parse(localStorage.getItem('kidspark_liked') || '[]'));

// ---------- Utility ----------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function categoryMeta(cat) {
  return CATEGORY_META[cat] || DEFAULT_META;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function saveLiked() {
  localStorage.setItem('kidspark_liked', JSON.stringify(Array.from(likedIds)));
}

// ---------- Data Fetching ----------
async function fetchActivities() {
  try {
    const res = await fetch(`tables/${TABLE}?limit=200`);
    const json = await res.json();
    allActivities = (json.data || []).filter(a => !a.deleted);
  } catch (err) {
    console.error('Failed to load activities', err);
    allActivities = [];
  }
}

// ---------- Rendering ----------
function populateFilterOptions() {
  const catSelect = document.getElementById('filter-category');
  const ageSelect = document.getElementById('filter-age');
  const chipsWrap = document.getElementById('category-chips');
  const footerCats = document.getElementById('footer-categories');

  const categories = [...new Set(allActivities.map(a => a.category).filter(Boolean))];
  categories.sort();

  catSelect.innerHTML = '<option value="">All Categories</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  const ages = AGE_ORDER.filter(a => allActivities.some(x => x.age_group === a));
  ageSelect.innerHTML = '<option value="">All Ages</option>' +
    ages.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');

  chipsWrap.innerHTML = `<button class="chip active" data-cat="">✨ All</button>` +
    categories.map(c => {
      const meta = categoryMeta(c);
      return `<button class="chip" data-cat="${escapeHtml(c)}"><i class="fa-solid ${meta.icon}"></i> ${escapeHtml(c)}</button>`;
    }).join('');

  chipsWrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      catSelect.value = chip.dataset.cat;
      applyFilters();
    });
  });

  footerCats.innerHTML = categories.map(c => `<li class="footer-chip">${escapeHtml(c)}</li>`).join('');
}

function updateStats(list) {
  document.getElementById('stat-total').textContent = allActivities.length;
  document.getElementById('stat-categories').textContent = new Set(allActivities.map(a => a.category)).size;
  document.getElementById('stat-likes').textContent = allActivities.reduce((s, a) => s + (Number(a.likes) || 0), 0);
  document.getElementById('stat-authors').textContent = new Set(allActivities.map(a => (a.author_name || '').trim().toLowerCase()).filter(Boolean)).size;
}

function cardTemplate(activity) {
  const meta = categoryMeta(activity.category);
  const liked = likedIds.has(activity.id);
  const img = activity.image_url && activity.image_url.trim()
    ? `<img src="${escapeHtml(activity.image_url)}" alt="${escapeHtml(activity.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-5xl\\'>🧸</div>'">`
    : `<div class="w-full h-full flex items-center justify-center text-5xl">🧸</div>`;

  return `
  <article class="activity-card fade-in" data-id="${escapeHtml(activity.id)}">
    <div class="activity-card__image-wrap">
      ${img}
      <span class="activity-card__badge"><i class="fa-solid ${meta.icon}"></i> ${escapeHtml(activity.category || 'General')}</span>
    </div>
    <div class="activity-card__body">
      <h3 class="activity-card__title">${escapeHtml(activity.title)}</h3>
      <p class="activity-card__desc">${escapeHtml(activity.description)}</p>
      <div class="activity-card__meta">
        <span class="meta-pill" style="background:#EFF6FF;color:#3B82F6;"><i class="fa-solid fa-child-reaching"></i> ${escapeHtml(activity.age_group || 'All Ages')}</span>
        ${activity.duration_minutes ? `<span class="meta-pill" style="background:#FEF3C7;color:#B45309;"><i class="fa-regular fa-clock"></i> ${escapeHtml(activity.duration_minutes)} min</span>` : ''}
      </div>
      <div class="activity-card__footer">
        <span class="text-xs text-slate-400 font-semibold truncate max-w-[45%]"><i class="fa-solid fa-user-pen"></i> ${escapeHtml(activity.author_name || 'Anonymous')}</span>
        <button class="like-btn ${liked ? 'liked' : ''}" data-id="${escapeHtml(activity.id)}">
          <i class="fa-solid fa-heart" style="color:${liked ? '#ff6b6b' : '#cbd5e1'}"></i>
          <span class="like-count">${Number(activity.likes) || 0}</span>
        </button>
      </div>
    </div>
  </article>`;
}

function renderGrid(list) {
  const grid = document.getElementById('activities-grid');
  const empty = document.getElementById('empty-state');
  if (!list.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = list.map(cardTemplate).join('');

  grid.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.like-btn')) return;
      openDetailModal(card.dataset.id);
    });
  });

  grid.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLike(btn.dataset.id, btn);
    });
  });
}

// ---------- Filtering & Sorting ----------
function applyFilters() {
  const search = (document.getElementById('header-search').value || document.getElementById('mobile-search').value || '').toLowerCase().trim();
  const cat = document.getElementById('filter-category').value;
  const age = document.getElementById('filter-age').value;
  const sort = document.getElementById('sort-select').value;

  let list = allActivities.filter(a => {
    const matchesSearch = !search ||
      (a.title || '').toLowerCase().includes(search) ||
      (a.description || '').toLowerCase().includes(search) ||
      (a.materials_needed || '').toLowerCase().includes(search);
    const matchesCat = !cat || a.category === cat;
    const matchesAge = !age || a.age_group === age;
    return matchesSearch && matchesCat && matchesAge;
  });

  switch (sort) {
    case 'popular':
      list.sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0));
      break;
    case 'quick':
      list.sort((a, b) => (Number(a.duration_minutes) || 9999) - (Number(b.duration_minutes) || 9999));
      break;
    case 'az':
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    default: // newest
      list.sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));
  }

  renderGrid(list);
}

// ---------- Like Handling ----------
async function toggleLike(id, btn) {
  const activity = allActivities.find(a => a.id === id);
  if (!activity) return;
  const currentlyLiked = likedIds.has(id);
  const newLikes = Math.max(0, (Number(activity.likes) || 0) + (currentlyLiked ? -1 : 1));

  // optimistic UI
  activity.likes = newLikes;
  if (currentlyLiked) { likedIds.delete(id); } else { likedIds.add(id); }
  saveLiked();
  btn.classList.toggle('liked', !currentlyLiked);
  btn.querySelector('.like-count').textContent = newLikes;
  btn.querySelector('i').style.color = !currentlyLiked ? '#ff6b6b' : '#cbd5e1';
  document.getElementById('stat-likes').textContent = allActivities.reduce((s, a) => s + (Number(a.likes) || 0), 0);

  try {
    await fetch(`tables/${TABLE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likes: newLikes })
    });
  } catch (err) {
    console.error('Failed to update likes', err);
  }
}

// ---------- Detail Modal ----------
function openDetailModal(id) {
  const activity = allActivities.find(a => a.id === id);
  if (!activity) return;
  const meta = categoryMeta(activity.category);
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  const img = activity.image_url && activity.image_url.trim()
    ? `<img src="${escapeHtml(activity.image_url)}" alt="${escapeHtml(activity.title)}" class="w-full h-64 object-cover rounded-t-3xl" onerror="this.style.display='none'">`
    : `<div class="w-full h-40 rounded-t-3xl flex items-center justify-center text-6xl bg-gradient-to-br from-amber-100 to-sky-100">🧸</div>`;

  content.innerHTML = `
    ${img}
    <div class="p-6 sm:p-8">
      <span class="meta-pill inline-block mb-3" style="background:${meta.color}22;color:${meta.color};"><i class="fa-solid ${meta.icon}"></i> ${escapeHtml(activity.category || 'General')}</span>
      <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-800 mb-3">${escapeHtml(activity.title)}</h2>
      <div class="flex flex-wrap gap-2 mb-4">
        <span class="meta-pill" style="background:#EFF6FF;color:#3B82F6;"><i class="fa-solid fa-child-reaching"></i> ${escapeHtml(activity.age_group || 'All Ages')}</span>
        ${activity.duration_minutes ? `<span class="meta-pill" style="background:#FEF3C7;color:#B45309;"><i class="fa-regular fa-clock"></i> ${escapeHtml(activity.duration_minutes)} min</span>` : ''}
        <span class="meta-pill" style="background:#F1F5F9;color:#475569;"><i class="fa-solid fa-user-pen"></i> ${escapeHtml(activity.author_name || 'Anonymous')}</span>
      </div>
      <p class="text-slate-600 leading-relaxed whitespace-pre-line mb-5">${escapeHtml(activity.description)}</p>
      ${activity.materials_needed ? `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <h4 class="font-heading font-bold text-amber-700 mb-1"><i class="fa-solid fa-list-check"></i> Materials Needed</h4>
          <p class="text-amber-800 text-sm">${escapeHtml(activity.materials_needed)}</p>
        </div>` : ''}
      <button class="like-btn text-lg" data-id="${escapeHtml(activity.id)}" id="modal-like-btn">
        <i class="fa-solid fa-heart" style="color:${likedIds.has(activity.id) ? '#ff6b6b' : '#cbd5e1'}"></i>
        <span class="like-count">${Number(activity.likes) || 0}</span> Loved by parents
      </button>
    </div>
  `;

  content.querySelector('#modal-like-btn').addEventListener('click', (e) => {
    toggleLike(activity.id, e.currentTarget);
  });

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ---------- Form Submission ----------
async function handleFormSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  const msg = document.getElementById('form-message');

  const title = document.getElementById('input-title').value.trim();
  const category = document.getElementById('input-category').value;
  const age_group = document.getElementById('input-age').value;
  const duration_minutes = document.getElementById('input-duration').value;
  const author_name = document.getElementById('input-author').value.trim() || 'Anonymous';
  const materials_needed = document.getElementById('input-materials').value.trim();
  const image_url = document.getElementById('input-image').value.trim();
  const description = document.getElementById('input-description').value.trim();

  if (!title || !category || !age_group || !description) {
    msg.textContent = 'Please fill in all required fields (*)';
    msg.className = 'text-sm font-semibold text-red-500';
    msg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

  const payload = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    title,
    category,
    age_group,
    duration_minutes: duration_minutes ? Number(duration_minutes) : 0,
    author_name,
    materials_needed,
    image_url,
    description,
    likes: 0
  };

  try {
    const res = await fetch(`tables/${TABLE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Request failed');
    const created = await res.json();
    allActivities.unshift(created);
    populateFilterOptions();
    applyFilters();
    updateStats();

    msg.textContent = '🎉 Activity posted successfully! Scroll up to see it.';
    msg.className = 'text-sm font-semibold text-leaf';
    msg.classList.remove('hidden');
    showToast('Activity posted! Thanks for sharing 🎈');
    document.getElementById('activity-form').reset();
    setTimeout(() => {
      document.getElementById('browse-section').scrollIntoView({ behavior: 'smooth' });
    }, 600);
  } catch (err) {
    console.error(err);
    msg.textContent = 'Something went wrong. Please try again.';
    msg.className = 'text-sm font-semibold text-red-500';
    msg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Activity';
    setTimeout(() => msg.classList.add('hidden'), 5000);
  }
}

// ---------- Init ----------
function bindEvents() {
  document.getElementById('filter-category').addEventListener('change', () => {
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    const val = document.getElementById('filter-category').value;
    const match = document.querySelector(`#category-chips .chip[data-cat="${val}"]`) || document.querySelector('#category-chips .chip[data-cat=""]');
    if (match) match.classList.add('active');
    applyFilters();
  });
  document.getElementById('filter-age').addEventListener('change', applyFilters);
  document.getElementById('sort-select').addEventListener('change', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-age').value = '';
    document.getElementById('header-search').value = '';
    document.getElementById('mobile-search').value = '';
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#category-chips .chip[data-cat=""]').classList.add('active');
    applyFilters();
  });

  let searchTimer;
  const debounceSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 200);
  };
  document.getElementById('header-search').addEventListener('input', debounceSearch);
  document.getElementById('mobile-search').addEventListener('input', debounceSearch);

  document.getElementById('activity-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('close-modal').addEventListener('click', closeDetailModal);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeDetailModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });

  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const nav = document.getElementById('mobile-nav');
    nav.classList.toggle('hidden');
    nav.classList.toggle('flex');
  });
  document.querySelectorAll('#mobile-nav a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('mobile-nav').classList.add('hidden');
      document.getElementById('mobile-nav').classList.remove('flex');
    });
  });
}

async function init() {
  bindEvents();
  await fetchActivities();
  document.getElementById('loading-state').classList.add('hidden');
  populateFilterOptions();
  updateStats();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', init);
