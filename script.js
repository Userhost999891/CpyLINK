// Simple localStorage-backed gallery app
const STORAGE_KEY = "rag_posts_v1";
let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// DOM
const gallery = document.getElementById("gallery");
const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const savePost = document.getElementById("savePost");
const closeModal = document.getElementById("closeModal");
const postTitle = document.getElementById("postTitle");
const postDesc = document.getElementById("postDesc");
const postImage = document.getElementById("postImage");

const viewer = document.getElementById("viewer");
const viewerImage = document.getElementById("viewerImage");
const viewerTitle = document.getElementById("viewerTitle");
const viewerDesc = document.getElementById("viewerDesc");
const closeViewer = document.getElementById("closeViewer");
const copyLinkBtn = document.getElementById("copyLink");
const downloadImgBtn = document.getElementById("downloadImg");

const dynamicIsland = document.getElementById("dynamic-island");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const themeSelect = document.getElementById("themeSelect");
const toggleAnim = document.getElementById("toggleAnim");
const resetBtn = document.getElementById("resetBtn");

// Init
function init(){
  loadSettings();
  renderPosts();
  bindEvents();
}
function bindEvents(){
  addBtn.addEventListener("click", openModal);
  closeModal.addEventListener("click", closeModalFn);
  savePost.addEventListener("click", onSavePost);
  dynamicIsland.addEventListener("click", toggleSettings);
  dynamicIsland.addEventListener("keydown", e => { if(e.key === 'Enter') toggleSettings() });
  closeSettings.addEventListener("click", () => setSettingsOpen(false));
  resetBtn.addEventListener("click", resetStorage);
  closeViewer.addEventListener("click", closeViewerFn);
  copyLinkBtn.addEventListener("click", copyCurrentImageLink);
  downloadImgBtn.addEventListener("click", downloadCurrentImage);
  themeSelect.addEventListener("change", applyTheme);
  toggleAnim.addEventListener("change", applyAnimToggle);
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      if (viewer.getAttribute("aria-hidden") === "false") closeViewerFn();
      else if (modal.getAttribute("aria-hidden") === "false") closeModalFn();
      else if (settingsPanel.getAttribute("aria-hidden") === "false") setSettingsOpen(false);
    }
  });
}

// Modal controls
function openModal(){
  modal.setAttribute("aria-hidden","false");
  // focus field
  setTimeout(()=>postTitle.focus(),200);
}
function closeModalFn(){
  modal.setAttribute("aria-hidden","true");
  clearModal();
}
function clearModal(){
  postTitle.value = "";
  postDesc.value = "";
  postImage.value = "";
}

// Save post
function onSavePost(){
  const title = postTitle.value.trim() || "Bez tytułu";
  const desc = postDesc.value.trim() || "";
  const file = postImage.files[0];
  if(!file){
    alert("Dodaj zdjęcie!");
    return;
  }
  const allowed = ["image/png","image/jpeg","image/webp","image/gif"];
  if(!allowed.includes(file.type)){
    alert("Nieobsługiwany format. Użyj PNG/JPG/WebP/GIF.");
    return;
  }
  if(file.size > 12 * 1024 * 1024){
    alert("Plik za duży (max 12MB).");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result;
    const id = Date.now().toString(36);
    const post = { id, title, desc, img: dataUrl, createdAt: new Date().toISOString() };
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    renderPosts();
    closeModalFn();
    // small success animation
    pulseFab();
  };
  reader.readAsDataURL(file);
}

// Render gallery
function renderPosts(){
  gallery.innerHTML = "";
  if(posts.length === 0){
    gallery.innerHTML = `<div class="empty" style="text-align:center;padding:60px 10px;color:var(--muted)">Brak postów. Kliknij "Utwórz LPOST" aby dodać.</div>`;
    return;
  }
  posts.forEach(p => {
    const card = document.createElement("article");
    card.className = "post";
    card.innerHTML = `
      <img loading="lazy" src="${p.img}" alt="${escapeHtml(p.title)}" />
      <div class="meta">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.desc)}</p>
      </div>
    `;
    card.addEventListener("click", ()=> openViewer(p));
    gallery.appendChild(card);
  });
}

// Viewer
let currentViewing = null;
function openViewer(post){
  currentViewing = post;
  viewerImage.src = post.img;
  viewerImage.alt = post.title;
  viewerTitle.textContent = post.title;
  viewerDesc.textContent = post.desc;
  viewer.setAttribute("aria-hidden","false");
}
function closeViewerFn(){
  viewer.setAttribute("aria-hidden","true");
  currentViewing = null;
}

// Copy link (dataURL) - copies direct image dataURL
function copyCurrentImageLink(){
  if(!currentViewing) return;
  navigator.clipboard.writeText(currentViewing.img).then(()=> {
    showToast("Skopiowano link obrazu");
  }).catch(()=> alert("Kopiowanie nie powiodło się."));
}

// Download current image
function downloadCurrentImage(){
  if(!currentViewing) return;
  const a = document.createElement("a");
  a.href = currentViewing.img;
  a.download = (currentViewing.title || "image") + ".png";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Dynamic Island / Settings
function toggleSettings(){
  const isOpen = settingsPanel.getAttribute("aria-hidden") === "false";
  setSettingsOpen(!isOpen);
}
function setSettingsOpen(open){
  settingsPanel.setAttribute("aria-hidden", open ? "false" : "true");
  dynamicIsland.setAttribute("aria-expanded", open ? "true" : "false");
  if(open){
    // focus first control
    setTimeout(()=>themeSelect.focus(), 200);
  }
}

// Settings / theme
function loadSettings(){
  const s = JSON.parse(localStorage.getItem("rag_settings") || "{}");
  if(s.theme) document.documentElement.dataset.theme = s.theme;
  if(s.theme === "dark") document.body.classList.add("dark");
  themeSelect.value = s.theme || "system";
  toggleAnim.checked = s.anim !== false;
}
function applyTheme(){
  const v = themeSelect.value;
  const s = JSON.parse(localStorage.getItem("rag_settings") || "{}");
  s.theme = v;
  localStorage.setItem("rag_settings", JSON.stringify(s));
  if(v === "dark"){
    document.body.classList.add("dark");
  } else if(v === "light"){
    document.body.classList.remove("dark");
  } else {
    // system
    document.body.classList.remove("dark");
  }
}
function applyAnimToggle(){
  const s = JSON.parse(localStorage.getItem("rag_settings") || "{}");
  s.anim = toggleAnim.checked;
  localStorage.setItem("rag_settings", JSON.stringify(s));
}

// Utilities
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}
function pulseFab(){
  addBtn.animate([
    { transform: "scale(1)" },
    { transform: "scale(1.06)" },
    { transform: "scale(1)" }
  ], { duration: 420, easing: "cubic-bezier(.22,.9,.3,1)"});
}
function resetStorage(){
  if(!confirm("Na pewno usunąć wszystkie posty?")) return;
  posts = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("rag_settings");
  renderPosts();
  setSettingsOpen(false);
  showToast("Zresetowano lokalne dane");
}

// Simple toast
function showToast(msg){
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "22px";
  t.style.transform = "translateX(-50%)";
  t.style.padding = "10px 14px";
  t.style.borderRadius = "12px";
  t.style.background = "rgba(0,0,0,0.8)";
  t.style.color = "white";
  t.style.zIndex = 200;
  document.body.appendChild(t);
  setTimeout(()=> t.style.opacity = "0", 1600);
  setTimeout(()=> t.remove(), 2200);
}

// Init app
init();
