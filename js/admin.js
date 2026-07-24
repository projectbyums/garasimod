// ============================================================
// admin.js — Logika dashboard admin: form tambah produk,
// daftar produk (edit & hapus), serta export/import data.
// ============================================================

const EMOJI_OPTIONS = ["🚌","🚍","🚎","🚚","🛻","🔊","📯","🗺️","🧭","🖼️","🎨","📐","🏮","⚙️","🛞","💡"];
let selectedEmoji = EMOJI_OPTIONS[0];
let photoUrls = [];

// ---- state edit ----
let editingId = null; // null = mode tambah, number = mode edit

// ============================================================
// FOTO URL INPUTS (dipakai form tambah & modal edit)
// ============================================================
function buildPhotoInputsHTML(urls){
  if(urls.length === 0) return `<div class="photo-empty-hint">Belum ada foto. Klik "+ Tambah Foto" untuk menambahkan URL gambar.</div>`;
  return urls.map((url, i) => `
    <div class="photo-url-row" data-index="${i}">
      <div class="photo-preview-wrap ${url ? '' : ''}">
        ${url
          ? `<img src="${url}" class="photo-thumb" alt="preview" onerror="this.src=''; this.parentElement.classList.add('broken')">`
          : `<div class="photo-thumb-empty">🖼️</div>`}
      </div>
      <input type="text" class="photo-url-input" placeholder="https://i.imgur.com/contoh.jpg" value="${url}" data-idx="${i}"/>
      <button type="button" class="photo-del-btn" data-del="${i}" aria-label="Hapus foto">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');
}

function bindPhotoInputs(container, urlsRef, onUpdate){
  container.querySelectorAll('.photo-url-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.idx);
      urlsRef[idx] = e.target.value.trim();
      const row = container.querySelector(`[data-index="${idx}"]`);
      const wrap = row.querySelector('.photo-preview-wrap');
      const url = urlsRef[idx];
      wrap.classList.remove('broken');
      wrap.innerHTML = url
        ? `<img src="${url}" class="photo-thumb" alt="preview" onerror="this.src=''; this.parentElement.classList.add('broken')">`
        : `<div class="photo-thumb-empty">🖼️</div>`;
      if(onUpdate) onUpdate();
    });
  });
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      urlsRef.splice(Number(btn.dataset.del), 1);
      container.innerHTML = buildPhotoInputsHTML(urlsRef);
      bindPhotoInputs(container, urlsRef, onUpdate);
      if(onUpdate) onUpdate();
    });
  });
}

// ============================================================
// FORM TAMBAH PRODUK
// ============================================================
function renderPhotoInputs(){
  const container = document.getElementById('photoUrlList');
  container.innerHTML = buildPhotoInputsHTML(photoUrls);
  bindPhotoInputs(container, photoUrls, null);
}

document.getElementById('addPhotoBtn').addEventListener('click', () => {
  if(photoUrls.length >= 8){ showToast("Maksimal 8 foto per produk"); return; }
  photoUrls.push('');
  renderPhotoInputs();
});

function renderEmojiPicker(){
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = EMOJI_OPTIONS.map(em=>
    `<button type="button" class="emoji-opt ${em===selectedEmoji?'selected':''}" data-emoji="${em}">${em}</button>`
  ).join('');
  picker.querySelectorAll('.emoji-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{ selectedEmoji = btn.dataset.emoji; renderEmojiPicker(); });
  });
}

function renderCategoryOptions(){
  const sel = document.getElementById('f-category');
  sel.innerHTML = CATEGORIES.filter(c=>c!=="Semua" && c!=="Pilihan")
    .map(c=>`<option value="${c}">${c}</option>`).join('');
}

document.getElementById('productForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const isFree = document.getElementById('f-free').checked;
  const name = document.getElementById('f-name').value.trim();
  const seller = document.getElementById('f-seller').value.trim();
  if(!name || !seller){ showToast("Nama produk & modder wajib diisi"); return; }

  const validPhotos = photoUrls.filter(url => url.trim() !== '');
  const bgColor = document.getElementById('f-color').value;
  const images = validPhotos.length > 0
    ? validPhotos.map(url => ({ url, bg: "#111" }))
    : [{ emoji: selectedEmoji, bg: bgColor }];

  const product = {
    id: Date.now(),
    name,
    seller,
    category: document.getElementById('f-category').value,
    price: isFree ? 0 : Math.max(0, Number(document.getElementById('f-price').value) || 0),
    rating: Math.min(5, Math.max(0, Number(document.getElementById('f-rating').value) || 0)),
    downloads: document.getElementById('f-downloads').value.trim() || "0",
    emoji: selectedEmoji,
    bg: bgColor,
    images,
    featured: document.getElementById('f-featured').checked,
    desc: document.getElementById('f-desc').value.trim() || "Belum ada deskripsi untuk produk ini.",
    builtIn: false,
  };

  PRODUCTS.push(product);
  saveCustomProducts();
  renderAdminProductList();
  renderGrid();
  showToast("Produk berhasil disimpan ✓");

  e.target.reset();
  document.getElementById('f-free').checked = false;
  selectedEmoji = EMOJI_OPTIONS[0];
  photoUrls = [];
  renderEmojiPicker();
  renderPhotoInputs();
});

document.getElementById('f-free').addEventListener('change', (e)=>{
  const priceInput = document.getElementById('f-price');
  priceInput.disabled = e.target.checked;
  if(e.target.checked) priceInput.value = 0;
});

// ============================================================
// DAFTAR PRODUK
// ============================================================
function renderAdminProductList(){
  const list = document.getElementById('adminProductList');
  document.getElementById('totalProdukCount').textContent = PRODUCTS.length;
  list.innerHTML = PRODUCTS.map(p=>{
    const fotoCount = (p.images||[]).filter(img=>img.url).length;
    return `
    <div class="admin-list-item">
      <div class="ph" style="background:${p.bg}">${p.emoji}</div>
      <div class="info">
        <h4>${p.name}</h4>
        <span>${p.seller} &middot; ${p.category} &middot; ${formatRp(p.price)}</span>
        ${fotoCount > 0 ? `<span class="foto-count-badge">📷 ${fotoCount} foto</span>` : '<span class="foto-count-badge" style="color:var(--ink-soft)">Belum ada foto</span>'}
      </div>
      <div class="admin-item-actions">
        <button class="edit-btn" data-edit="${p.id}" title="Edit produk">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          Edit
        </button>
        <button class="del-btn" data-del="${p.id}" title="Hapus produk">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Hapus
        </button>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> openEditModal(Number(btn.dataset.edit)));
  });
  list.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.del);
      const p = PRODUCTS.find(x=>x.id===id);
      if(confirm(`Hapus "${p.name}" dari toko?`)){
        PRODUCTS = PRODUCTS.filter(x=>x.id!==id);
        saveCustomProducts();
        renderAdminProductList();
        renderGrid();
        showToast("Produk dihapus");
      }
    });
  });
}

// ============================================================
// MODAL EDIT PRODUK
// ============================================================
let editPhotoUrls = [];
let editSelectedEmoji = EMOJI_OPTIONS[0];

function openEditModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  editingId = id;
  editPhotoUrls = (p.images||[]).filter(img=>img.url).map(img=>img.url);
  editSelectedEmoji = p.emoji || EMOJI_OPTIONS[0];

  const modal = document.getElementById('editModal');
  modal.querySelector('#e-name').value = p.name;
  modal.querySelector('#e-seller').value = p.seller;
  modal.querySelector('#e-desc').value = p.desc || '';
  modal.querySelector('#e-downloads').value = p.downloads || '0';
  modal.querySelector('#e-rating').value = p.rating || 0;
  modal.querySelector('#e-color').value = p.bg || '#233047';
  modal.querySelector('#e-featured').checked = p.featured || false;

  const isFree = p.price === 0;
  modal.querySelector('#e-free').checked = isFree;
  modal.querySelector('#e-price').value = isFree ? 0 : p.price;
  modal.querySelector('#e-price').disabled = isFree;

  // category
  const catSel = modal.querySelector('#e-category');
  catSel.innerHTML = CATEGORIES.filter(c=>c!=="Semua" && c!=="Pilihan")
    .map(c=>`<option value="${c}" ${c===p.category?'selected':''}>${c}</option>`).join('');

  renderEditEmojiPicker();
  renderEditPhotoInputs();

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeEditModal(){
  document.getElementById('editModal').classList.remove('show');
  document.body.style.overflow = '';
  editingId = null;
}

function renderEditEmojiPicker(){
  const picker = document.getElementById('e-emojiPicker');
  picker.innerHTML = EMOJI_OPTIONS.map(em=>
    `<button type="button" class="emoji-opt ${em===editSelectedEmoji?'selected':''}" data-emoji="${em}">${em}</button>`
  ).join('');
  picker.querySelectorAll('.emoji-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{ editSelectedEmoji = btn.dataset.emoji; renderEditEmojiPicker(); });
  });
}

function renderEditPhotoInputs(){
  const container = document.getElementById('e-photoUrlList');
  container.innerHTML = buildPhotoInputsHTML(editPhotoUrls);
  bindPhotoInputs(container, editPhotoUrls, null);
}

document.getElementById('e-addPhotoBtn').addEventListener('click', ()=>{
  if(editPhotoUrls.length >= 8){ showToast("Maksimal 8 foto per produk"); return; }
  editPhotoUrls.push('');
  renderEditPhotoInputs();
});

document.getElementById('e-free').addEventListener('change', (e)=>{
  const priceInput = document.getElementById('e-price');
  priceInput.disabled = e.target.checked;
  if(e.target.checked) priceInput.value = 0;
});

document.getElementById('editModal').addEventListener('click', (e)=>{
  if(e.target === document.getElementById('editModal')) closeEditModal();
});
document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);

document.getElementById('editForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  if(editingId === null) return;

  const idx = PRODUCTS.findIndex(x=>x.id===editingId);
  if(idx === -1) return;

  const isFree = document.getElementById('e-free').checked;
  const name = document.getElementById('e-name').value.trim();
  const seller = document.getElementById('e-seller').value.trim();
  if(!name || !seller){ showToast("Nama produk & modder wajib diisi"); return; }

  const validPhotos = editPhotoUrls.filter(url => url.trim() !== '');
  const bgColor = document.getElementById('e-color').value;
  const images = validPhotos.length > 0
    ? validPhotos.map(url => ({ url, bg: "#111" }))
    : [{ emoji: editSelectedEmoji, bg: bgColor }];

  PRODUCTS[idx] = {
    ...PRODUCTS[idx],
    name,
    seller,
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

  saveCustomProducts();
  renderAdminProductList();
  renderGrid();
  closeEditModal();
  showToast("Produk berhasil diperbarui ✓");
});

// ============================================================
// EXPORT / IMPORT
// ============================================================
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const custom = PRODUCTS.filter(p=>!p.builtIn);
  if(custom.length===0){ showToast("Belum ada produk untuk di-export"); return; }
  const blob = new Blob([JSON.stringify(custom, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = "garasimod-produk.json"; a.click();
  URL.revokeObjectURL(url);
  showToast("Data produk berhasil di-export");
});

document.getElementById('importInput').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const imported = JSON.parse(ev.target.result);
      if(!Array.isArray(imported)) throw new Error("Format tidak valid");
      const existingIds = new Set(PRODUCTS.map(p=>p.id));
      imported.forEach(p=>{
        if(existingIds.has(p.id)) p.id = Date.now() + Math.floor(Math.random()*1000);
        p.builtIn = false;
        PRODUCTS.push(p);
      });
      saveCustomProducts();
      renderAdminProductList();
      renderGrid();
      showToast(`${imported.length} produk berhasil di-import`);
    }catch(err){
      showToast("File tidak valid, gagal import");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

// ============================================================
// INIT
// ============================================================
renderPhotoInputs();
