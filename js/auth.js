// ============================================================
// auth.js — Gerbang ringan untuk halaman admin & routing via URL hash (#admin)
// CATATAN: ini BUKAN keamanan sungguhan. Kode ini bisa dilihat siapa saja
// lewat "view source" browser. Untuk keamanan sesungguhnya, admin perlu
// login lewat backend/server, bukan lewat file JS statis seperti ini.
// ============================================================

// GANTI dengan kata sandi admin sendiri.
const ADMIN_PASSCODE = "garasi123";

let adminUnlocked = false;
const adminPanel = document.getElementById('adminPanel');

function openAdmin(){
  if(!adminUnlocked){
    const input = prompt("Masukkan kata sandi admin:");
    if(input !== ADMIN_PASSCODE){
      if(input !== null) showToast("Kata sandi salah");
      location.hash = "";
      return;
    }
    adminUnlocked = true;
  }
  renderCategoryOptions();
  renderEmojiPicker();
  renderAdminProductList();
  adminPanel.classList.add('show');
  document.body.style.overflow = "hidden";
}

function closeAdmin(){
  adminUnlocked = false;
  adminPanel.classList.remove('show');
  document.body.style.overflow = "";
  if(location.hash === "#admin") location.hash = "";
}

document.getElementById('adminBack').addEventListener('click', (e)=>{
  e.preventDefault();
  closeAdmin();
});

window.addEventListener('hashchange', ()=>{
  if(location.hash === "#admin") openAdmin(); else closeAdmin();
});

// Jika halaman dibuka langsung dengan alamat ...index.html#admin
if(location.hash === "#admin") openAdmin();
