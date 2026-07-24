// ============================================================
// app.js — Seluruh logika katalog toko: filter, keranjang, wishlist,
// modal detail produk, pencarian, checkout via WhatsApp, dan toast.
// ============================================================

// GANTI dengan nomor WhatsApp admin asli.
// Format: kode negara + nomor tanpa angka 0 di depan, tanpa spasi/tanda baca.
// Contoh nomor 0812-3456-7890 menjadi "6281234567890"
const ADMIN_WHATSAPP_NUMBER = "6281234567890";

let state = { category: "Semua", search: "" };
let cart = {};      // id -> qty
let wishlist = new Set();

// ---- carousel (dipakai di modal & halaman pratinjau, satu instance aktif dalam satu waktu) ----
let carouselImages = [];
let carouselIndex = 0;
let carouselTargetId = null;

function renderCarouselInto(targetId, images){
  carouselTargetId = targetId;
  carouselImages = images && images.length ? images : [{emoji:"📦", bg:"#333333"}];
  carouselIndex = 0;
  drawCarousel();
}

function drawCarousel(){
  const el = document.getElementById(carouselTargetId);
  if(!el) return;
  const total = carouselImages.length;
  const img = carouselImages[carouselIndex];

  // Slide bisa berupa URL foto atau emoji fallback
  const slideContent = img.url
    ? `<img src="${img.url}" alt="Foto produk" class="carousel-img" onerror="this.parentElement.innerHTML='<div class=carousel-broken>⚠️ Foto tidak dapat dimuat</div>'">`
    : `<div class="carousel-slide">${img.emoji}</div>`;

  el.style.background = img.url ? "#111" : img.bg;
  el.innerHTML = `
    ${slideContent}
    ${total>1 ? `<span class="carousel-count">${carouselIndex+1}/${total}</span>` : ''}
    ${total>1 ? `<button class="carousel-arrow prev" id="carPrev" aria-label="Foto sebelumnya">&#8249;</button>` : ''}
    ${total>1 ? `<button class="carousel-arrow next" id="carNext" aria-label="Foto berikutnya">&#8250;</button>` : ''}
    ${total>1 ? `<div class="carousel-dots">${carouselImages.map((_,i)=>`<span class="dot ${i===carouselIndex?'active':''}" data-dot="${i}"></span>`).join('')}</div>` : ''}
  `;
  if(total>1){
    document.getElementById('carPrev').addEventListener('click', ()=>{ carouselIndex = (carouselIndex-1+total)%total; drawCarousel(); });
    document.getElementById('carNext').addEventListener('click', ()=>{ carouselIndex = (carouselIndex+1)%total; drawCarousel(); });
    el.querySelectorAll('[data-dot]').forEach(dot=> dot.addEventListener('click', ()=>{ carouselIndex = Number(dot.dataset.dot); drawCarousel(); }));
  }
}

// ---- render category chips ----
const categoryBar = document.getElementById('categoryBar');
function renderChips(){
  categoryBar.innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c===state.category?'active':''}" data-cat="${c}">${c}</button>`
  ).join('');
  categoryBar.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=> setCategory(btn.dataset.cat));
  });
}
function setCategory(cat){
  state.category = cat;
  renderChips();
  renderGrid();
}

// ---- filtering ----
function getFiltered(){
  return PRODUCTS.filter(p=>{
    const matchCat = state.category==="Semua" ? true :
                      state.category==="Pilihan" ? p.featured :
                      p.category===state.category;
    const matchSearch = (p.name+" "+p.seller).toLowerCase().includes(state.search.toLowerCase());
    return matchCat && matchSearch;
  });
}

function formatRp(n){
  return n===0 ? "Gratis" : "Rp" + n.toLocaleString('id-ID');
}

// ---- render grid ----
const grid = document.getElementById('grid');
const resultCount = document.getElementById('resultCount');
const sectionTitle = document.getElementById('sectionTitle');

function cardHTML(p){
  const firstPhoto = p.images && p.images.find(img => img.url);
  const thumbContent = firstPhoto
    ? `<img src="${firstPhoto.url}" class="card-thumb" alt="${p.name}" onerror="this.parentElement.classList.add('no-photo')">`
    : `<div class="card-no-photo"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Belum ada foto</span></div>`;

  return `
    <div class="card">
      <div class="card-media ${firstPhoto?'':'no-photo'}" data-id="${p.id}">
        ${p.featured?'<span class="featured-tag">Trending</span>':''}
        ${p.price===0?'<span class="free-tag">Gratis</span>':''}
        <button class="fav-btn ${wishlist.has(p.id)?'active':''}" data-fav="${p.id}" aria-label="Simpan ke favorit">
          <svg viewBox="0 0 24 24" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
        </button>
        ${thumbContent}
      </div>
      <div class="card-body">
        <span class="seller">${p.seller}</span>
        <h3>${p.name}</h3>
        <div class="meta-row"><span class="stars">★</span> ${p.rating} &middot; ${p.downloads} unduhan</div>
        <div class="price-row">
          <span class="price ${p.price===0?'free':''}">${formatRp(p.price)}</span>
          <button class="add-btn" data-add="${p.id}" aria-label="Tambah ke keranjang">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function bindCardEvents(scope){
  scope.querySelectorAll('[data-id]').forEach(el=> el.addEventListener('click', ()=> openModal(Number(el.dataset.id))));
  scope.querySelectorAll('[data-fav]').forEach(el=> el.addEventListener('click', (e)=>{ e.stopPropagation(); toggleWish(Number(el.dataset.fav)); }));
  scope.querySelectorAll('[data-add]').forEach(el=> el.addEventListener('click', (e)=>{ e.stopPropagation(); addToCart(Number(el.dataset.add)); }));
}

function renderGrid(){
  const items = getFiltered();
  sectionTitle.textContent = state.category==="Semua" ? "Semua Mod" : state.category==="Pilihan" ? "Mod Trending" : state.category;
  resultCount.textContent = items.length + " mod";
  if(items.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="glyph">🔍</div>Tidak ada mod yang cocok. Coba kata kunci lain.</div>`;
    return;
  }
  grid.innerHTML = items.map(cardHTML).join('');
  bindCardEvents(grid);
}

// ---- wishlist ----
const wishBadge = document.getElementById('wishBadge');
function toggleWish(id){
  if(wishlist.has(id)) wishlist.delete(id); else wishlist.add(id);
  wishBadge.style.display = wishlist.size>0 ? 'flex':'none';
  wishBadge.textContent = wishlist.size;
  if(sectionTitle.textContent === "Favorit Kamu"){
    renderWishlistView();
  } else {
    renderGrid();
  }
}
function renderWishlistView(){
  const items = PRODUCTS.filter(p=>wishlist.has(p.id));
  sectionTitle.textContent = "Favorit Kamu";
  resultCount.textContent = items.length + " mod";
  if(items.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="glyph">💛</div>Belum ada mod favorit. Tap ikon hati pada mod untuk menyimpannya.</div>`;
  } else {
    grid.innerHTML = items.map(cardHTML).join('');
  }
  bindCardEvents(grid);
}
document.getElementById('wishToggleBtn').addEventListener('click', ()=>{
  state.category = "Semua";
  state.search = "";
  searchInput.value = "";
  renderChips();
  renderWishlistView();
  document.getElementById('produk').scrollIntoView({behavior:'smooth'});
});

// ---- cart ----
const cartBadge = document.getElementById('cartBadge');
const cartBody = document.getElementById('cartBody');
const cartTotal = document.getElementById('cartTotal');

function addToCart(id){
  cart[id] = (cart[id]||0) + 1;
  updateCartUI();
  showToast("Ditambahkan ke keranjang ✓");
}
function changeQty(id, delta){
  cart[id] = (cart[id]||0) + delta;
  if(cart[id]<=0) delete cart[id];
  updateCartUI();
}
function removeFromCart(id){
  delete cart[id];
  updateCartUI();
}
function updateCartUI(){
  const ids = Object.keys(cart);
  const count = ids.reduce((s,id)=>s+cart[id],0);
  cartBadge.style.display = count>0 ? 'flex':'none';
  cartBadge.textContent = count;

  if(ids.length===0){
    cartBody.innerHTML = `<div class="empty-state"><div class="glyph">🧰</div>Keranjang masih kosong.<br>Yuk cari mod favoritmu!</div>`;
    cartTotal.textContent = formatRp(0);
    return;
  }
  let total = 0;
  cartBody.innerHTML = ids.map(id=>{
    const p = PRODUCTS.find(x=>x.id===Number(id));
    const qty = cart[id];
    total += p.price*qty;
    return `
    <div class="cart-item">
      <div class="ph" style="background:${p.bg}">${p.emoji}</div>
      <div class="cart-item-info">
        <h4>${p.name}</h4>
        <div class="cprice">${formatRp(p.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-dec="${id}">−</button>
          <span>${qty}</span>
          <button class="qty-btn" data-inc="${id}">+</button>
          <button class="remove-btn" data-rm="${id}">Hapus</button>
        </div>
      </div>
    </div>`;
  }).join('');
  cartTotal.textContent = formatRp(total);

  cartBody.querySelectorAll('[data-inc]').forEach(el=> el.addEventListener('click', ()=>changeQty(Number(el.dataset.inc),1)));
  cartBody.querySelectorAll('[data-dec]').forEach(el=> el.addEventListener('click', ()=>changeQty(Number(el.dataset.dec),-1)));
  cartBody.querySelectorAll('[data-rm]').forEach(el=> el.addEventListener('click', ()=>removeFromCart(Number(el.dataset.rm))));
}

// ---- drawer open/close ----
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
function openDrawer(){ drawer.classList.add('show'); overlay.classList.add('show'); }
function closeDrawer(){ drawer.classList.remove('show'); overlay.classList.remove('show'); }
document.getElementById('cartBtn').addEventListener('click', openDrawer);
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
overlay.addEventListener('click', ()=>{ closeDrawer(); closeModal(); });

// ---- checkout via WhatsApp ----
document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  if(Object.keys(cart).length===0){ showToast("Keranjang masih kosong"); return; }

  const ids = Object.keys(cart);
  let total = 0;
  const lines = ids.map((id, i)=>{
    const p = PRODUCTS.find(x=>x.id===Number(id));
    const qty = cart[id];
    const subtotal = p.price*qty;
    total += subtotal;
    return `${i+1}. ${p.name} x${qty} - ${formatRp(subtotal)}`;
  });

  const message =
`Halo Admin Garasi Mod, saya ingin memesan mod berikut:\n\n${lines.join('\n')}\n\nTotal: ${formatRp(total)}\n\nMohon info langkah pembayaran dan pengiriman selanjutnya. Terima kasih!`;

  const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');

  showToast("Membuka WhatsApp...");
  cart = {};
  updateCartUI();
  setTimeout(closeDrawer, 900);
});

// ---- modal detail produk (popup besar dengan carousel) ----
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modalCard');
function openModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  modalCard.innerHTML = `
    <div class="modal-carousel-wrap carousel-wrap" id="modalCarousel"></div>
    <div class="modal-info">
      <button class="modal-close" id="modalClose" aria-label="Tutup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <span class="seller">${p.seller}</span>
      <h2>${p.name}</h2>
      <p class="desc">${p.desc}</p>
      <div class="specs">
        <span>${p.category}</span>
        <span>★ ${p.rating}</span>
        <span>${p.downloads} unduhan</span>
      </div>
      <span class="price ${p.price===0?'free':''}">${formatRp(p.price)}</span>
      <button class="btn-primary modal-cta" id="modalAdd">${p.price===0?'Unduh Sekarang':'Tambah ke Keranjang'}</button>
    </div>
  `;
  modal.classList.add('show');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderCarouselInto('modalCarousel', p.images);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalAdd').addEventListener('click', ()=>{ addToCart(id); closeModal(); });
}
function closeModal(){
  modal.classList.remove('show');
  document.body.style.overflow = '';
  if(!drawer.classList.contains('show')) overlay.classList.remove('show');
}

// ---- search ----
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e)=>{
  state.search = e.target.value;
  renderGrid();
});
document.getElementById('searchToggle').addEventListener('click', ()=>{
  document.getElementById('searchWrap').classList.toggle('show-mobile');
  if(document.getElementById('searchWrap').classList.contains('show-mobile')) searchInput.focus();
});

// ---- toast ----
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 2200);
}

// ---- keyboard escape ----
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){ closeDrawer(); closeModal(); }
});

// ---- init tampilan toko ----
renderChips();
renderGrid();
updateCartUI();
