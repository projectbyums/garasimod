// ============================================================
// admin.js — Logika dashboard admin
// ============================================================

const EMOJI_OPTIONS = ["🚌","🚍","🚎","🚚","🛻","🔊","📯","🗺️","🧭","🖼️","🎨","📐","🏮","⚙️","🛞","💡"];
let selectedEmoji = EMOJI_OPTIONS[0];
let editSelectedEmoji = EMOJI_OPTIONS[0];
let photoUrls = [];
let editPhotoUrls = [];
let editingProductId = null;

// ---- FOTO INPUT (form tambah) ----
function renderPhotoInputs(){
  const container = document.getElementById('photoUrlList');
  container.innerHTML = photoUrls.map((url, i) => `
    <div class="photo-url-row" data-index="${i}">
      <div class="photo-preview-wrap ${url ? '' : ''}">
        ${url ? `<img src="${url}" class="photo-thumb" alt="preview" onerror="this.parentElement.classList.add('broken')">` : `<div class="photo-thumb-empty">🖼️</div>`}
      </div>
      <input type="text" class="photo-url-input" placeholder="https://i.imgur.com/contoh.jpg" value="${url}" data-idx="${i}"/>
      <button type="button" class="photo-del-btn" data-del="${i}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
  container.querySelectorAll('.photo-url-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      photoUrls[idx] = e.target.value.trim();
      const wrap = container.querySelector(`[data-index="${idx}"] .photo-preview-wrap`);
      wrap.classList.remove('broken');
      wrap.innerHTML = photoUrls[idx]
        ? `<img src="${photoUrls[idx]}" class="photo-thumb" onerror="this.parentElement.classList.add('broken')">`
        : `<div class="photo-thumb-empty">🖼️</div>`;
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => { photoUrls.splice(Number(btn.dataset.del), 1); renderPhotoInputs(); });
  });
}

document.getElementById('addPhotoBtn').addEventListener('click', () => {
  if(photoUrls.length >= 8){ showToast("Maksimal 8 foto per produk"); return; }
  photoUrls.push('');
  renderPhotoInputs();
});

// ---- FOTO INPUT (form edit) ----
function renderEditPhotoInputs(){
  const container = document.getElementById('e-photoUrlList');
  container.innerHTML = editPhotoUrls.map((url, i) => `
    <div class="photo-url-row" data-index="${i}">
      <div class="photo-preview-wrap">
        ${url ? `<img src="${url}" class="photo-thumb" alt="preview" onerror="this.parentElement.classList.add('broken')">` : `<div class="photo-thumb-empty">🖼️</div>`}
      </div>
      <input type="text" class="photo-url-input" placeholder="https://i.imgur.com/contoh.jpg" value="${url}" data-idx="${i}"/>
      <button type="button" class="photo-del-btn" data-del="${i}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
  container.querySelectorAll('.photo-url-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      editPhotoUrls[idx] = e.target.value.trim();
      const wrap = container.querySelector(`[data-index="${idx}"] .photo-preview-wrap`);
      wrap.classList.remove('broken');
      wrap.innerHTML = editPhotoUrls[idx]
        ? `<img src="${editPhotoUrls[idx]}" class="photo-thumb" onerror="this.parentElement.classList.add('broken')">`
        : `<div class="photo-thumb-empty">🖼️</div>`;
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => { editPhotoUrls.splice(Number(btn.dataset.del), 1); renderEditPhotoInputs(); });
  });
}

document.getElementById('e-addPhotoBtn').addEventListener('click', () => {
  if(editPhotoUrls.length >= 8){ showToast("Maksimal 8 foto per produk"); return; }
  editPhotoUrls.push('');
  renderEditPhotoInputs();
});

// ---- EMOJI PICKER ----
function renderEmojiPicker(){
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = EMOJI_OPTIONS.map(em =>
    `<button type="button" class="emoji-opt ${em===selectedEmoji?'selected':''}" data-emoji="${em}">${em}</button>`
  ).join('');
  picker.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => { selectedEmoji = btn.dataset.emoji; renderEmojiPicker(); });
  });
}

function renderEditEmojiPicker(){
  const picker = document.getElementById('e-emojiPicker');
  picker.innerHTML = EMOJI_OPTIONS.map(em =>
    `<button type="button" class="emoji-opt ${em===editSelectedEmoji?'selected':''}" data-emoji="${em}">${em}</button>`
  ).join('');
  picker.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => { editSelectedEmoji = btn.dataset.emoji; renderEditEmojiPicker(); });
  });
}

function renderCategoryOptions(){
  const cats = CATEGORIES.filter(c => c !== "Semua" && c !== "Pilihan");
  document.getElementById('f-category').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('e-category').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ---- DAFTAR PRODUK ADMIN ----
function renderAdminProductList(){
  const list = document.getElementById('adminProductList');
  document.getElementById('totalProdukCount').textContent = PRODUCTS.length;
  if(PRODUCTS.length === 0){
    list.innerHTML = `<div class="empty-state"><div class="glyph">📦</div>Belum ada produk. Tambahkan produk pertamamu!</div>`;
    return;
  }
  list.innerHTML = PRODUCTS.map(p => {
    const fotoCount = (p.images||[]).filter(img => img.url).length;
    return `
    <div class="admin-list-item">
      <div class="ph" style="background:${p.bg}">${p.emoji}</div>
      <div class="info">
        <h4>${p.name}</h4>
        <span>${p.seller} · ${p.category} · ${formatRp(p.price)}</span>
        ${fotoCount > 0 ? `<span class="foto-count-badge">📷 ${fotoCount} foto</span>` : ''}
      </div>
      <div class="admin-item-actions">
        <button class="edit-btn" data-edit="${p.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="del-btn" data-del="${p.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Hapus
        </button>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.edit)));
  });
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(Number(btn.dataset.del)));
  });
}

async function confirmDelete(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!confirm(`Hapus "${p.name}" dari toko?`)) return;
  showToast("Menghapus...");
  const ok = await deleteProduct(id);
  if(ok){
    PRODUCTS = PRODUCTS.filter(x => x.id !== id);
    renderAdminProductList();
    renderGrid();
    showToast("Produk dihapus ✓");
  } else {
    showToast("Gagal menghapus, coba lagi");
  }
}

// ---- FORM TAMBAH PRODUK ----
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('f-name').value.trim();
  const seller = document.getElementById('f-seller').value.trim();
  if(!name || !seller){ showToast("Nama produk & modder wajib diisi"); return; }

  const isFree = document.getElementById('f-free').checked;
  const validPhotos = photoUrls.filter(url => url.trim() !== '');
  const bgColor = document.getElementById('f-color').value;
  const images = validPhotos.length > 0
    ? validPhotos.map(url => ({ url, bg: "#111" }))
    : [{ emoji: selectedEmoji, bg: bgColor }];

  const product = {
    name, seller,
    category: document.getElementById('f-category').value,
    price: isFree ? 0 : Math.max(0, Number(document.getElementById('f-price').value) || 0),
    rating: Math.min(5, Math.max(0, Number(document.getElementById('f-rating').value) || 0)),
    downloads: document.getElementById('f-downloads').value.trim() || "0",
    emoji: selectedEmoji,
    bg: bgColor,
    images,
    featured: document.getElementById('f-featured').checked,
    desc: document.getElementById('f-desc').value.trim() || "Belum ada deskripsi.",
  };

  showToast("Menyimpan produk...");
  const created = await saveProduct(product);
  if(created){
    PRODUCTS.unshift(created);
    renderAdminProductList();
    renderGrid();
    showToast("Produk berhasil disimpan ✓");
    e.target.reset();
    selectedEmoji = EMOJI_OPTIONS[0];
    photoUrls = [];
    renderEmojiPicker();
    renderPhotoInputs();
  } else {
    showToast("Gagal menyimpan, coba lagi");
  }
});

document.getElementById('f-free').addEventListener('change', (e) => {
  const priceInput = document.getElementById('f-price');
  priceInput.disabled = e.target.checked;
  if(e.target.checked) priceInput.value = 0;
});

// ---- MODAL EDIT ----
function openEditModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  editingProductId = id;
  editSelectedEmoji = p.emoji;
  editPhotoUrls = (p.images||[]).filter(img => img.url).map(img => img.url);

  document.getElementById('e-name').value = p.name;
  document.getElementById('e-seller').value = p.seller;
  document.getElementById('e-category').value = p.category;
  document.getElementById('e-price').value = p.price;
  document.getElementById('e-free').checked = p.price === 0;
  document.getElementById('e-price').disabled = p.price === 0;
  document.getElementById('e-rating').value = p.rating;
  document.getElementById('e-downloads').value = p.downloads;
  document.getElementById('e-color').value = p.bg;
  document.getElementById('e-featured').checked = p.featured;
  document.getElementById('e-desc').value = p.desc || '';

  renderEditEmojiPicker();
  renderEditPhotoInputs();

  document.getElementById('editModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeEditModal(){
  document.getElementById('editModal').classList.remove('show');
  document.body.style.overflow = '';
  editingProductId = null;
}

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);

document.getElementById('e-free').addEventListener('change', (e) => {
  const priceInput = document.getElementById('e-price');
  priceInput.disabled = e.target.checked;
  if(e.target.checked) priceInput.value = 0;
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('e-name').value.trim();
  const seller = document.getElementById('e-seller').value.trim();
  if(!name || !seller){ showToast("Nama & seller wajib diisi"); return; }

  const isFree = document.getElementById('e-free').checked;
  const validPhotos = editPhotoUrls.filter(url => url.trim() !== '');
  const bgColor = document.getElementById('e-color').value;
  const images = validPhotos.length > 0
    ? validPhotos.map(url => ({ url, bg: "#111" }))
    : [{ emoji: editSelectedEmoji, bg: bgColor }];

  const updated = {
    name, seller,
    category: document.getElementById('e-category').value,
    price: isFree ? 0 : Math.max(0, Number(document.getElementById('e-price').value) || 0),
    rating: Math.min(5, Math.max(0, Number(document.getElementById('e-rating').value) || 0)),
    downloads: document.getElementById('e-downloads').value.trim() || "0",
    emoji: editSelectedEmoji,
    bg: bgColor,
    images,
    featured: document.getElementById('e-featured').checked,
    desc: document.getElementById('e-desc').value.trim() || "Belum ada deskripsi.",
  };

  showToast("Menyimpan perubahan...");
  const result = await updateProduct(editingProductId, updated);
  if(result){
    const idx = PRODUCTS.findIndex(x => x.id === editingProductId);
    if(idx !== -1) PRODUCTS[idx] = result;
    renderAdminProductList();
    renderGrid();
    closeEditModal();
    showToast("Perubahan disimpan ✓");
  } else {
    showToast("Gagal menyimpan, coba lagi");
  }
});

// ---- INIT ----
renderPhotoInputs();
