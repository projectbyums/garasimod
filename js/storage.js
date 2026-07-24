// ============================================================
// storage.js — Koneksi Supabase & data produk
// ============================================================

const SUPABASE_URL = "https://quslbvcyslrzrdtfsptt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c2xidmN5c2xyenJkdGZzcHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTMxMDYsImV4cCI6MjEwMDQ4OTEwNn0.qRd_BwvADP0WgG0BOASoS0wtugHwOukH85VRiHCkxOg";
const API = `${SUPABASE_URL}/rest/v1/products`;

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

let PRODUCTS = [];

const CATEGORIES = ["Semua", "Pilihan", "Livery", "Mod Kendaraan", "Mod Suara", "Map & Traffic", "Mod Truk", "Template"];

// ---- Ambil semua produk dari Supabase ----
async function loadProducts(){
  try {
    const res = await fetch(`${API}?order=created_at.desc`, { headers: HEADERS });
    if(!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // Sesuaikan field 'description' → 'desc' agar kompatibel dengan kode frontend
    PRODUCTS = data.map(p => ({ ...p, desc: p.description }));
  } catch(e) {
    console.error("Gagal memuat produk:", e);
    PRODUCTS = [];
  }
}

// ---- Tambah produk baru ----
async function saveProduct(product){
  try {
    const payload = {
      name: product.name,
      seller: product.seller,
      category: product.category,
      price: product.price,
      rating: product.rating,
      downloads: product.downloads,
      emoji: product.emoji,
      bg: product.bg,
      images: product.images,
      featured: product.featured,
      description: product.desc,
    };
    const res = await fetch(API, {
      method: "POST",
      headers: { ...HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify(payload),
    });
    if(!res.ok) throw new Error(await res.text());
    const [created] = await res.json();
    return { ...created, desc: created.description };
  } catch(e) {
    console.error("Gagal menyimpan produk:", e);
    return null;
  }
}

// ---- Update produk ----
async function updateProduct(id, product){
  try {
    const payload = {
      name: product.name,
      seller: product.seller,
      category: product.category,
      price: product.price,
      rating: product.rating,
      downloads: product.downloads,
      emoji: product.emoji,
      bg: product.bg,
      images: product.images,
      featured: product.featured,
      description: product.desc,
    };
    const res = await fetch(`${API}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify(payload),
    });
    if(!res.ok) throw new Error(await res.text());
    const [updated] = await res.json();
    return { ...updated, desc: updated.description };
  } catch(e) {
    console.error("Gagal mengupdate produk:", e);
    return null;
  }
}

// ---- Hapus produk ----
async function deleteProduct(id){
  try {
    const res = await fetch(`${API}?id=eq.${id}`, {
      method: "DELETE",
      headers: HEADERS,
    });
    if(!res.ok) throw new Error(await res.text());
    return true;
  } catch(e) {
    console.error("Gagal menghapus produk:", e);
    return false;
  }
}
