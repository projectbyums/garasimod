// ============================================================
// storage.js — Data produk & penyimpanan lokal (localStorage)
// File ini WAJIB dimuat paling pertama, karena file JS lain
// (app.js, admin.js, auth.js) bergantung pada PRODUCTS & CATEGORIES.
// Produk ditambahkan sepenuhnya lewat dashboard admin.
// ============================================================

let PRODUCTS = [];

const CATEGORIES = ["Semua", "Pilihan", "Livery", "Mod Kendaraan", "Mod Suara", "Map & Traffic", "Mod Truk", "Template"];

const STORAGE_KEY = "garasimod_custom_products";

// Memuat produk yang pernah ditambahkan admin lewat dashboard (tersimpan di browser ini saja)
function loadCustomProducts(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if(Array.isArray(saved) && saved.length){
      PRODUCTS = saved;
    }
  }catch(e){ console.error("Gagal memuat produk custom:", e); }
}

// Menyimpan seluruh produk ke localStorage
function saveCustomProducts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
}

loadCustomProducts();
