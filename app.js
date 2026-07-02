/**
 * app.js - Full Code Update
 */

const bestSellerMenu = { id: "bs1", name: "Wedang Jahe Merah", price: 8000, desc: "Jahe merah asli, hangatkan badan, tenangkan hati.", img: "wedang.jpg" };
const menuData = [
    { id: "g1", groupName: "Aneka Sate Bakar", desc: "Jagoan angkringan yang selalu jadi rebutan.", img: "sate.jpeg", variants: [{ id: "v1", name: "Sate Usus", price: 3000 }, { id: "v2", name: "Sate Telur Puyuh", price: 3000 }, { id: "v3", name: "Sate Kikil", price: 3000 }, { id: "v4", name: "Sate Ati Ampela", price: 3000 },] },
    { id: "g4", groupName: "Nasi Bakar", desc: "Kejutan gurih nan pulen di balik balutan daun pisang.", img: "nasbak.jpeg", variants: [{ id: "v13", name: "Nasi Bakar Cumi", price: 8000 }, { id: "v14", name: "Nasi Bakar Tongkol", price: 8000 }, { id: "v15", name: "Nasi Bakar Ayam Suir", price: 8000 }] },
    { id: "g5", groupName: "Aneka Gorengan", desc: "Gak bakal lengkap nongkrongmu tanpa renyahnya gorengan ini.", img: "g.jpeg", variants: [{ id: "v16", name: "Mendoan", price: 2000 }, { id: "v17", name: "Bakwan", price: 2000 }] },
    { id: "g6", groupName: "Aneka Baceman", desc: "Resep klasik, legitnya bikin rindu suasana kampung halaman.", img: "tahu.jpeg", variants: [{ id: "v18", name: "Tahu Bacem", price: 2000 }, { id: "v19", name: "Tempe Bacem", price: 2000 }] },
    { id: "g7", groupName: "Menu Tambahan", desc: "Tambah lauknya, dobel puasnya!", img: "pala.jpeg", variants: [{ id: "v20", name: "Sayap Ayam", price: 6000 }, { id: "v21", name: "Kepala Ayam", price: 3000 }] },
    { id: "g8", groupName: "Minuman Dingin", desc: "Teman sejuk untuk obrolan hangat di angkringan.", img: "es.jpeg", variants: [{ id: "v22", name: "Es Nutrisari", price: 5000 }, { id: "v23", name: "Jeruk Peras", price: 5000}, { id: "v24", name: "GoodDay Freez", price: 7000} ]},
    { id: "g9", groupName: "Ngopii BosQuee...", desc: "Satu cangkir, semangat langsung ngalir!", img: "kopi.jpeg", variants: [{ id: "v25", name: "Kopi Hitam", price: 4000 }, { id: "v26", name: "Kopi Susu", price: 4000 }] }
];

const SHOP_LAT = -6.397954;
const SHOP_LON = 107.076784;

let cart = [];
let deliveryMethod = 'dine_in';
let shippingCost = 0;
let userDistance = 0;
let isShopOpen = true;
let locationDetected = false;

/* ==========================================================
   STOK MENU: Habis / Tersedia + Mode Admin
   Sinkron real-time via Firebase Firestore, dengan fallback
   ke localStorage kalau koneksi/Firebase bermasalah.
   ========================================================== */
const STOCK_STORAGE_KEY = 'senthirStockState';
const ADMIN_SESSION_KEY = 'senthirAdminMode';
const ADMIN_PIN = '1908'; // Ganti PIN ini sesuai kebutuhan kamu

const firebaseConfig = {
    apiKey: "AIzaSyCr3MIFPDqfd0_Cg2dwVwdBniBRb12kS4A",
    authDomain: "angkringan-senthir.firebaseapp.com",
    projectId: "angkringan-senthir",
    storageBucket: "angkringan-senthir.firebasestorage.app",
    messagingSenderId: "936417557991",
    appId: "1:936417557991:web:8fbc4f6ca347fa795ad142"
};

let firestoreDb = null;
let firebaseReady = false;
const STOCK_DOC_PATH = ['shopData', 'stock']; // koleksi 'shopData', dokumen 'stock'

let stockState = {};   // { itemId: true } → true artinya item tsb HABIS
let isAdminMode = false;
let adminFilter = 'all'; // 'all' | 'tersedia' | 'habis' — filter list di dashboard admin

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') throw new Error('SDK Firebase belum termuat');
        firebase.initializeApp(firebaseConfig);
        firestoreDb = firebase.firestore();
        firebaseReady = true;
    } catch (e) {
        console.warn('Firebase gagal diinisialisasi, pakai penyimpanan lokal saja:', e);
        firebaseReady = false;
        updateSyncStatusUI('offline');
    }
}

function loadStockState() {
    // Muat cache lokal dulu biar tampilan langsung ada isinya tanpa nunggu network
    try {
        const saved = localStorage.getItem(STOCK_STORAGE_KEY);
        stockState = saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.warn('Gagal membaca cache stok lokal:', e);
        stockState = {};
    }

    if (!firebaseReady) return;

    updateSyncStatusUI('connecting');

    // Dengarkan perubahan stok secara real-time dari Firestore.
    // Setiap kali admin update di perangkat manapun, semua pelanggan yang
    // sedang membuka web langsung menerima data terbaru lewat listener ini.
    firestoreDb.collection(STOCK_DOC_PATH[0]).doc(STOCK_DOC_PATH[1]).onSnapshot((docSnap) => {
        stockState = (docSnap.exists && docSnap.data().items) ? docSnap.data().items : {};
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockState));
        } catch (e) { /* abaikan, cache lokal cuma fallback */ }
        updateSyncStatusUI('live');
        refreshAllMenuRenders();
    }, (error) => {
        console.warn('Gagal sinkron stok dari server, tetap pakai data lokal:', error);
        updateSyncStatusUI('offline');
    });
}

function saveStockState() {
    // Simpan ke cache lokal dulu biar responsif meski network lambat
    try {
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockState));
    } catch (e) {
        console.warn('Gagal menyimpan status stok ke cache lokal:', e);
    }

    if (!firebaseReady) return;

    updateSyncStatusUI('connecting');
    firestoreDb.collection(STOCK_DOC_PATH[0]).doc(STOCK_DOC_PATH[1]).set({ items: stockState })
        .then(() => updateSyncStatusUI('live'))
        .catch((error) => {
            console.warn('Gagal menyimpan stok ke server, perubahan hanya tersimpan lokal:', error);
            updateSyncStatusUI('offline');
        });
}

// Tampilkan status sinkronisasi di dashboard admin (live / connecting / offline)
function updateSyncStatusUI(status) {
    const badge = document.getElementById('adminSyncStatus');
    if (!badge) return;
    const dot = badge.querySelector('.sync-dot');
    const label = badge.querySelector('.sync-label');
    if (!dot || !label) return;

    if (status === 'live') {
        dot.className = 'sync-dot w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse';
        label.textContent = 'Tersinkron ke semua perangkat';
        badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400';
    } else if (status === 'connecting') {
        dot.className = 'sync-dot w-1.5 h-1.5 rounded-full bg-flame animate-pulse';
        label.textContent = 'Menyimpan...';
        badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-flame/30 bg-flame/10 text-flame';
    } else {
        dot.className = 'sync-dot w-1.5 h-1.5 rounded-full bg-red-400';
        label.textContent = 'Mode offline (lokal saja)';
        badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400';
    }
}

function isOutOfStock(itemId) {
    return !!stockState[itemId];
}

function isGroupFullyOutOfStock(group) {
    return group.variants.every(v => isOutOfStock(v.id));
}

// Dipanggil dari tombol admin di tiap item (hanya aktif saat isAdminMode true)
function toggleItemStock(itemId, event) {
    if (event) event.stopPropagation();
    if (isOutOfStock(itemId)) {
        delete stockState[itemId];
    } else {
        stockState[itemId] = true;
    }
    saveStockState();
    refreshAllMenuRenders();
}

function loadAdminMode() {
    isAdminMode = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    updateAdminModeUI();
}

function updateAdminModeUI() {
    const chip = document.getElementById('adminModeChip');
    const brandLabel = document.getElementById('brandAdminLabel');
    if (chip) {
        if (isAdminMode) {
            chip.classList.remove('hidden');
            chip.classList.add('inline-flex');
        } else {
            chip.classList.add('hidden');
            chip.classList.remove('inline-flex');
        }
    }
    if (brandLabel) {
        brandLabel.textContent = isAdminMode ? 'Buka Dashboard Admin' : 'Panel Admin';
    }
}

// Dipanggil dari opsi "Panel Admin" di dropdown nama toko / link footer.
// Kalau belum login -> buka modal PIN kustom. Kalau sudah login -> langsung buka dashboard.
function handleAdminMenuClick() {
    closeBrandMenu();
    if (isAdminMode) {
        switchView('admin');
        return;
    }
    openAdminPinModal();
}

/* ==========================================================
   Modal PIN Admin (pengganti prompt() bawaan browser)
   ========================================================== */
function getPinBoxes() {
    return Array.from(document.querySelectorAll('#adminPinBoxes .pin-box'));
}

function openAdminPinModal() {
    const modal = document.getElementById('adminPinModal');
    const content = document.getElementById('adminPinModalContent');
    if (!modal || !content) return;

    // Reset state tiap kali dibuka
    const boxes = getPinBoxes();
    boxes.forEach(b => (b.value = ''));
    document.getElementById('adminPinError')?.classList.add('opacity-0');

    modal.classList.remove('opacity-0', 'pointer-events-none');
    requestAnimationFrame(() => {
        content.classList.remove('scale-95');
    });
    document.body.style.overflow = 'hidden';
    setTimeout(() => boxes[0]?.focus(), 200);
}

function closeAdminPinModal() {
    const modal = document.getElementById('adminPinModal');
    const content = document.getElementById('adminPinModalContent');
    if (!modal || !content) return;
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }, 250);
}

function showAdminPinError(message) {
    const err = document.getElementById('adminPinError');
    const content = document.getElementById('adminPinModalContent');
    if (err) {
        if (message) err.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i>${message}`;
        err.classList.remove('opacity-0');
    }
    // Efek shake singkat biar terasa ada validasi, bukan cuma teks statis
    if (content) {
        content.classList.remove('animate-shake');
        void content.offsetWidth; // restart animasi
        content.classList.add('animate-shake');
    }
    const boxes = getPinBoxes();
    boxes.forEach(b => (b.value = ''));
    boxes[0]?.focus();
}

function submitAdminPin() {
    const boxes = getPinBoxes();
    const pin = boxes.map(b => b.value).join('');

    if (pin.length < boxes.length) {
        showAdminPinError('Lengkapi 4 digit PIN terlebih dahulu.');
        return;
    }

    if (pin === ADMIN_PIN) {
        isAdminMode = true;
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        updateAdminModeUI();
        refreshAllMenuRenders();
        closeAdminPinModal();
        switchView('admin');
    } else {
        showAdminPinError('PIN salah, coba lagi.');
    }
}

// Auto-advance antar kotak PIN + submit otomatis saat 4 digit terisi
function initAdminPinBoxes() {
    const boxes = getPinBoxes();
    if (boxes.length === 0) return;

    boxes.forEach((box, idx) => {
        box.addEventListener('input', () => {
            box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
            document.getElementById('adminPinError')?.classList.add('opacity-0');
            if (box.value && idx < boxes.length - 1) {
                boxes[idx + 1].focus();
            }
            if (boxes.every(b => b.value)) {
                setTimeout(submitAdminPin, 120);
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !box.value && idx > 0) {
                boxes[idx - 1].focus();
            }
            if (e.key === 'Enter') {
                submitAdminPin();
            }
        });

        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const digits = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').split('');
            boxes.forEach((b, i) => (b.value = digits[i] || ''));
            const nextEmpty = boxes.find(b => !b.value);
            (nextEmpty || boxes[boxes.length - 1]).focus();
            if (boxes.every(b => b.value)) {
                setTimeout(submitAdminPin, 120);
            }
        });
    });
}

// Tutup modal PIN kalau klik area gelap di luar kartu
document.addEventListener('click', (event) => {
    const modal = document.getElementById('adminPinModal');
    const content = document.getElementById('adminPinModalContent');
    if (!modal || modal.classList.contains('pointer-events-none')) return;
    if (event.target === modal && content && !content.contains(event.target)) {
        closeAdminPinModal();
    }
});

// Logout dari dashboard admin, kembali ke tampilan pelanggan biasa
function adminLogout() {
    if (!confirm('Keluar dari Dashboard Admin?')) return;
    isAdminMode = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    updateAdminModeUI();
    refreshAllMenuRenders();
    switchView('home');
}

/* ==========================================================
   Dropdown nama toko (Senthir) di navbar
   ========================================================== */
function toggleBrandMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('brandDropdown');
    const trigger = document.getElementById('brandTrigger');
    const chevron = document.getElementById('brandChevron');
    if (!dropdown) return;
    const isOpen = !dropdown.classList.contains('hidden');
    if (isOpen) {
        closeBrandMenu();
    } else {
        dropdown.classList.remove('hidden');
        requestAnimationFrame(() => {
            dropdown.classList.remove('opacity-0', 'scale-95');
        });
        trigger?.setAttribute('aria-expanded', 'true');
        chevron?.classList.add('rotate-180');
    }
}

function closeBrandMenu() {
    const dropdown = document.getElementById('brandDropdown');
    const trigger = document.getElementById('brandTrigger');
    const chevron = document.getElementById('brandChevron');
    if (!dropdown || dropdown.classList.contains('hidden')) return;
    dropdown.classList.add('opacity-0', 'scale-95');
    trigger?.setAttribute('aria-expanded', 'false');
    chevron?.classList.remove('rotate-180');
    setTimeout(() => dropdown.classList.add('hidden'), 150);
}

// Tutup dropdown kalau klik di luar area-nya
document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('brandDropdown');
    const trigger = document.getElementById('brandTrigger');
    if (!dropdown || dropdown.classList.contains('hidden')) return;
    if (dropdown.contains(event.target) || trigger?.contains(event.target)) return;
    closeBrandMenu();
});

/* ==========================================================
   Dashboard Admin — daftar semua item + filter/pencarian
   ========================================================== */
function setAdminFilter(filter) {
    adminFilter = filter;
    ['all', 'tersedia', 'habis'].forEach(f => {
        const btn = document.getElementById('adminFilter' + f.charAt(0).toUpperCase() + f.slice(1));
        if (!btn) return;
        if (f === filter) {
            btn.classList.add('bg-ember', 'text-darker', 'border-ember');
            btn.classList.remove('text-parchment/70', 'border-wood');
        } else {
            btn.classList.remove('bg-ember', 'text-darker', 'border-ember');
            btn.classList.add('text-parchment/70', 'border-wood');
        }
    });
    renderAdminDashboard();
}

function adminToggleRowClass(outOfStock) {
    return outOfStock
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-wood/20 border-wood';
}

function renderAdminItemRow(id, name, price) {
    const outOfStock = isOutOfStock(id);
    return `
        <div class="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border ${adminToggleRowClass(outOfStock)} transition-colors">
            <div class="min-w-0">
                <p class="font-semibold text-parchment truncate">${name}</p>
                <p class="text-xs text-parchment/50 mt-0.5">Rp ${price.toLocaleString('id-ID')}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <span class="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${outOfStock ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}">
                    ${outOfStock ? 'Habis' : 'Tersedia'}
                </span>
                <button onclick="toggleItemStock('${id}', event); renderAdminDashboard();" role="switch" aria-checked="${!outOfStock}" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${outOfStock ? 'bg-stone/40' : 'bg-green-500'}">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${outOfStock ? 'translate-x-1' : 'translate-x-6'}"></span>
                </button>
            </div>
        </div>`;
}

function renderAdminDashboard() {
    const list = document.getElementById('adminItemsList');
    if (!list) return;

    const query = (document.getElementById('adminSearchInput')?.value || '').trim().toLowerCase();

    // Kumpulkan semua item (best seller + semua varian) jadi satu daftar flat dengan info kategori
    const allItems = [{ id: bestSellerMenu.id, name: bestSellerMenu.name, price: bestSellerMenu.price, group: 'Favorit Pelanggan' }];
    menuData.forEach(group => {
        group.variants.forEach(v => {
            allItems.push({ id: v.id, name: v.name, price: v.price, group: group.groupName });
        });
    });

    // Statistik
    const totalHabis = allItems.filter(it => isOutOfStock(it.id)).length;
    document.getElementById('adminStatTotal').textContent = allItems.length;
    document.getElementById('adminStatHabis').textContent = totalHabis;
    document.getElementById('adminStatTersedia').textContent = allItems.length - totalHabis;
    document.getElementById('adminStatGroup').textContent = menuData.length + 1;

    // Filter pencarian + status
    let filtered = allItems.filter(it => it.name.toLowerCase().includes(query));
    if (adminFilter === 'tersedia') filtered = filtered.filter(it => !isOutOfStock(it.id));
    if (adminFilter === 'habis') filtered = filtered.filter(it => isOutOfStock(it.id));

    if (filtered.length === 0) {
        list.innerHTML = `<div class="text-center py-16 text-parchment/40">
            <i class="fa-solid fa-box-open text-3xl mb-3"></i>
            <p class="text-sm">Tidak ada menu yang cocok.</p>
        </div>`;
        return;
    }

    // Kelompokkan ulang berdasarkan kategori, sesuai urutan menuData
    const groupOrder = ['Favorit Pelanggan', ...menuData.map(g => g.groupName)];
    let html = '';
    groupOrder.forEach(groupName => {
        const itemsInGroup = filtered.filter(it => it.group === groupName);
        if (itemsInGroup.length === 0) return;
        html += `
            <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-parchment/40 mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-tag text-ember/60"></i> ${groupName}
                </h3>
                <div class="space-y-2">
                    ${itemsInGroup.map(it => renderAdminItemRow(it.id, it.name, it.price)).join('')}
                </div>
            </div>`;
    });
    list.innerHTML = html;
}

function refreshAllMenuRenders() {
    renderFeaturedMenu();
    renderMenuGroups();
    // Kalau modal varian sedang terbuka, refresh juga isinya
    const openGroupId = document.getElementById('variantModal')?.dataset.openGroupId;
    if (openGroupId && !document.getElementById('variantModal').classList.contains('opacity-0')) {
        openVariantModal(openGroupId, true);
    }
}

// Overlay "HABIS" + tombol admin di atas gambar kartu (best seller / group)
function renderStockOverlay(itemId) {
    const outOfStock = isOutOfStock(itemId);
    const adminChip = isAdminMode
        ? `<button onclick="toggleItemStock('${itemId}', event)" class="absolute top-2 right-2 z-10 text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-lg ${outOfStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
             <i class="fa-solid ${outOfStock ? 'fa-rotate-left' : 'fa-ban'} mr-1"></i>${outOfStock ? 'Tandai Tersedia' : 'Tandai Habis'}
           </button>`
        : '';
    const habisRibbon = outOfStock
        ? `<div class="absolute inset-0 bg-darker/70 flex items-center justify-center z-[5]">
             <span class="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">HABIS</span>
           </div>`
        : '';
    return adminChip + habisRibbon;
}

// Overlay "HABIS" untuk kartu grup varian, aktif hanya kalau SEMUA variannya habis
function renderGroupStockOverlay(group) {
    if (!isGroupFullyOutOfStock(group)) return '';
    return `<div class="absolute inset-0 bg-darker/70 flex items-center justify-center z-[5]">
                <span class="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">HABIS</span>
            </div>`;
}

/* ==========================================================
   PWA: Service Worker Registration & Install Prompt
   ========================================================== */
let deferredInstallPrompt = null;

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function isRunningStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((reg) => console.log('[PWA] Service Worker terdaftar, scope:', reg.scope))
            .catch((err) => console.warn('[PWA] Gagal mendaftarkan Service Worker:', err));
    });
}

function showInstallButton() {
    const btn = document.getElementById('installAppBtn');
    if (!btn) return;
    btn.classList.remove('hidden');
    btn.classList.add('flex');
}

function hideInstallButton() {
    const btn = document.getElementById('installAppBtn');
    if (!btn) return;
    btn.classList.add('hidden');
    btn.classList.remove('flex');
}

function initInstallPrompt() {
    if (isRunningStandalone()) return; // sudah terpasang, tombol tak perlu muncul

    // Chrome/Edge/Android: event ini tersedia saat kriteria installable terpenuhi
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        showInstallButton();
    });

    // iOS Safari tidak pernah mengirim beforeinstallprompt,
    // jadi tombolnya tetap ditampilkan dengan instruksi manual.
    if (isIosDevice()) {
        showInstallButton();
    }

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        hideInstallButton();
    });
}

async function installApp() {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        if (outcome === 'accepted') hideInstallButton();
        return;
    }

    if (isIosDevice()) {
        alert('Cara pasang di iPhone/iPad:\n\n1. Ketuk ikon Share (kotak dengan panah ke atas) di Safari\n2. Pilih "Add to Home Screen" / "Tambah ke Layar Utama"\n3. Ketuk "Tambah"');
        return;
    }

    alert('Aplikasi belum bisa dipasang saat ini. Pastikan kamu membuka situs ini lewat https:// (bukan file lokal), lalu coba lagi.');
}

const CART_STORAGE_KEY = 'senthirCart';
const HISTORY_STORAGE_KEY = 'senthirOrderHistory';
const HISTORY_MAX_ITEMS = 15;

function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.warn('Gagal menyimpan keranjang ke localStorage:', e);
    }
}

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.warn('Gagal membaca keranjang dari localStorage:', e);
        cart = [];
    }
}

function loadOrderHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.warn('Gagal membaca riwayat pesanan:', e);
        return [];
    }
}

function saveOrderToHistory(order) {
    try {
        const history = loadOrderHistory();
        history.unshift(order);
        if (history.length > HISTORY_MAX_ITEMS) history.length = HISTORY_MAX_ITEMS;
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Gagal menyimpan riwayat pesanan:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    initInstallPrompt();
    validateOperatingHours();
    setInterval(validateOperatingHours, 1000); 
    loadCartFromStorage();
    initFirebase();
    loadStockState();
    loadAdminMode();
    initAdminPinBoxes();
    renderMenuGroups();
    renderFeaturedMenu();
    initKeunggulanReveal();
    initReviewSlider();
    initCounterAnimation();
    updateCartUI();

    const nameInput = document.getElementById('customerName');
    if (nameInput) {
        // Pakai fungsi ringan khusus validasi tombol checkout, BUKAN updateCartUI() penuh.
        // updateCartUI() akan render ulang seluruh list item cart — kalau itu yang
        // dipanggil di setiap keystroke, ketikan nama jadi kerasa patah-patah.
        nameInput.addEventListener('input', updateCheckoutButtonState);
    }
});

// LOGIKA WARNA NAVIGASI DIPERBARUI DI SINI
function switchView(view) {
    const homeView = document.getElementById('homeView');
    const menuView = document.getElementById('menuView');
    const adminView = document.getElementById('adminView');
    const navHome = document.getElementById('navHome');
    const navMenu = document.getElementById('navMenu');

    if (view === 'admin') {
        if (!isAdminMode) { handleAdminMenuClick(); return; }
        homeView.classList.add('hidden');
        menuView.classList.add('hidden');
        adminView.classList.remove('hidden');
        setAdminFilter('all');
        renderAdminDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    adminView.classList.add('hidden');

    if (view === 'menu') {
        homeView.classList.add('hidden');
        menuView.classList.remove('hidden');
        
        // Ubah warna active nav
        navHome.classList.replace('text-ember', 'text-parchment/70');
        navMenu.classList.replace('text-parchment/70', 'text-ember');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        menuView.classList.add('hidden');
        homeView.classList.remove('hidden');
        
        // Ubah warna active nav
        navMenu.classList.replace('text-ember', 'text-parchment/70');
        navHome.classList.replace('text-parchment/70', 'text-ember');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function validateOperatingHours() {
    const currentHour = new Date().getHours();
    // Buka 18:00 - 00:00 (sesuai teks di overlay)
    const isClosed = currentHour < 0;
    const overlay = document.getElementById('closedOverlay');
    const statusChanged = isShopOpen === isClosed; // true kalau isShopOpen lama = isClosed baru (artinya berubah)

    if (isClosed) {
        isShopOpen = false;
        if (statusChanged) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    } else {
        isShopOpen = true;
        if (statusChanged) {
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Update badge status live di navbar — titik warna = status buka/tutup, teks = jam real-time WIB
    const badge = document.getElementById('shopStatusBadge');
    const dot = document.getElementById('shopStatusDot');
    const text = document.getElementById('shopStatusText');
    if (badge && dot && text) {
        const liveTime = new Date().toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        // classList cuma disentuh saat status buka/tutup beneran berubah,
        // bukan tiap detik — biar nggak ada style recalc yang sia-sia.
        if (statusChanged) {
            if (isShopOpen) {
                badge.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-400');
                badge.classList.add('bg-green-500/10', 'border-green-500/30', 'text-green-400');
                dot.classList.remove('bg-red-400');
                dot.classList.add('bg-green-400', 'animate-pulse');
            } else {
                badge.classList.remove('bg-green-500/10', 'border-green-500/30', 'text-green-400');
                badge.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
                dot.classList.remove('bg-green-400', 'animate-pulse');
                dot.classList.add('bg-red-400');
            }
        }
        text.textContent = `${liveTime} WIB`;
    }
}

function renderFeaturedMenu() {
    const wrap = document.getElementById('featuredMenuGrid');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Kartu best seller (varian tunggal, langsung bisa pesan)
    const bestOutOfStock = isOutOfStock(bestSellerMenu.id);
    const bestCard = document.createElement('div');
    bestCard.className = 'menu-card overflow-hidden group flex flex-col border-2 border-flame shadow-[0_0_15px_rgba(244,196,48,0.25)]';
    bestCard.innerHTML = `
        <div class="relative h-44 hover-zoom">
            <img src="${bestSellerMenu.img}" class="w-full h-full object-cover" loading="lazy">
            <div class="absolute top-2 left-2 bg-flame text-darker text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <i class="fa-solid fa-fire text-[10px]"></i> FAVORIT
            </div>
            ${renderStockOverlay(bestSellerMenu.id)}
        </div>
        <div class="p-5 flex-1 flex flex-col">
            <h3 class="text-lg font-bold text-ink leading-tight">${bestSellerMenu.name}</h3>
            <p class="text-ember text-sm font-semibold mt-1 mb-4">Rp ${bestSellerMenu.price.toLocaleString('id-ID')}</p>
            <button onclick="addVariantToCart('${bestSellerMenu.id}', 'bestSeller', this)" ${bestOutOfStock ? 'disabled' : ''} class="w-full bg-flame text-darker py-3 rounded-lg font-bold hover:brightness-110 transition-all mt-auto ${bestOutOfStock ? 'opacity-50 cursor-not-allowed hover:brightness-100' : ''}">${bestOutOfStock ? 'Stok Habis' : 'Pesan Sekarang'}</button>
        </div>
    `;
    wrap.appendChild(bestCard);

    // Tiga grup menu dipilih sebagai sorotan (id: g1 Sate, g4 Nasi Bakar, g9 Kopi)
    const featuredGroupIds = ['g1', 'g4', 'g9'];
    featuredGroupIds.forEach(gid => {
        const group = menuData.find(g => g.id === gid);
        if (!group) return;
        const fullyOut = isGroupFullyOutOfStock(group);
        const card = document.createElement('div');
        card.className = 'menu-card overflow-hidden group flex flex-col';
        card.innerHTML = `
            <div class="relative h-44 hover-zoom">
                <img src="${group.img}" class="w-full h-full object-cover" loading="lazy">
                ${renderGroupStockOverlay(group)}
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <div class="flex justify-between items-start gap-2 mb-1">
                    <h3 class="font-serif text-lg font-bold text-ink leading-tight">${group.groupName}</h3>
                    <span class="shrink-0 bg-ember/10 text-ember text-[10px] font-bold px-2 py-1 rounded border border-ember/30">${group.variants.length} Varian</span>
                </div>
                <p class="text-stone text-xs mb-4 line-clamp-2">${group.desc}</p>
                <button onclick="openVariantModal('${group.id}')" ${fullyOut && !isAdminMode ? 'disabled' : ''} class="w-full border border-ember text-ember hover:bg-ember hover:text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-auto text-sm ${fullyOut && !isAdminMode ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-ember' : ''}">
                    <i class="fa-solid fa-list-ul"></i> ${fullyOut ? 'Stok Habis' : 'Pilih Varian'}
                </button>
            </div>
        `;
        wrap.appendChild(card);
    });
}

// Diambil langsung dari <img> di grid galeri, jadi selalu sinkron kalau foto diganti di HTML
const getGalleryImages = () => Array.from(document.querySelectorAll('#galleryGrid img')).map(img => img.getAttribute('src'));
let currentGalleryIndex = 0;

function openGalleryLightbox(index) {
    currentGalleryIndex = index;
    const lightbox = document.getElementById('galleryLightbox');
    const img = document.getElementById('galleryLightboxImg');
    img.src = getGalleryImages()[currentGalleryIndex];
    lightbox.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}

function closeGalleryLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    lightbox.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
}

function changeGalleryImage(direction) {
    const galleryImages = getGalleryImages();
    currentGalleryIndex = (currentGalleryIndex + direction + galleryImages.length) % galleryImages.length;
    document.getElementById('galleryLightboxImg').src = galleryImages[currentGalleryIndex];
}

function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter-num');
    if (!counters.length) return;

    const animate = (el) => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const textSuffix = el.dataset.textSuffix || '';
        const decimal = parseInt(el.dataset.decimal || '0');
        const duration = 1500;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = target * eased;
            el.textContent = decimal > 0 ? current.toFixed(decimal) + suffix + textSuffix : Math.round(current) + suffix + textSuffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.counter-num').forEach(animate);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    const section = counters[0].closest('section');
    if (section) observer.observe(section);
}

/* ── Keunggulan: reveal kartu saat scroll masuk viewport ── */
function initKeunggulanReveal() {
    const cards = document.querySelectorAll('.keunggulan-card');
    if (!cards.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 120);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => observer.observe(c));
}

/* ── Review Slider ── */
let reviewIndex = 0;
let reviewAuto;

// Berikan fallback angka 5 jika DOM belum sepenuhnya siap saat inisialisasi awal
const getReviewTotal = () => document.querySelectorAll('.review-slide').length || 5;

function updateReviewSlider() {
    const track = document.getElementById('reviewTrack');
    const dots  = document.querySelectorAll('.review-dot');
    if (!track) return;
    
    const total = getReviewTotal();
    const visibleSlides = window.innerWidth >= 768 ? 3 : 1;
    const slideWidth = 100 / visibleSlides;
    const maxIndex = total - visibleSlides;

    // Antisipasi batas index agar tidak bergeser ke area kosong di desktop
    if (reviewIndex > maxIndex) reviewIndex = maxIndex;
    if (reviewIndex < 0) reviewIndex = 0;

    track.style.transform = `translateX(-${reviewIndex * slideWidth}%)`;
    
    // Update indicator dots
    dots.forEach((d, i) => {
        // Pada desktop, jika user klik dot ke-4 atau ke-5, dot akan mengunci di slide terakhir yang valid
        const isActive = i === reviewIndex || (visibleSlides === 3 && reviewIndex === maxIndex && i >= maxIndex);
        d.style.width      = isActive ? '1.5rem' : '0.375rem';
        d.style.background = isActive ? '#C25A1A' : '#3D2C1E';
    });
}

function changeReview(dir) {
    const total = getReviewTotal();
    const visibleSlides = window.innerWidth >= 768 ? 3 : 1;
    const maxIndex = total - visibleSlides;

    reviewIndex += dir;
    
    // Efek melingkar (looping) yang presisi sesuai sisa slide yang tersedia
    if (reviewIndex > maxIndex) {
        reviewIndex = 0;
    } else if (reviewIndex < 0) {
        reviewIndex = maxIndex;
    }

    updateReviewSlider();
    resetReviewAuto();
}

function goToReview(idx) {
    const total = getReviewTotal();
    const visibleSlides = window.innerWidth >= 768 ? 3 : 1;
    const maxIndex = total - visibleSlides;
    
    // Jika klik melewati batas maksimal tampilan desktop, kunci di maxIndex
    reviewIndex = idx > maxIndex ? maxIndex : idx;
    
    updateReviewSlider();
    resetReviewAuto();
}

function resetReviewAuto() {
    clearInterval(reviewAuto);
    reviewAuto = setInterval(() => changeReview(1), 4500);
}

function initReviewSlider() {
    updateReviewSlider();
    resetReviewAuto();
    
    /* Jalankan ulang kalkulasi saat layar di-resize (ganti orientasi HP/Laptop) */
    window.addEventListener('resize', updateReviewSlider);

    /* Pause saat hover */
    const section = document.getElementById('reviewTrack');
    if (section) {
        section.closest('section').addEventListener('mouseenter', () => clearInterval(reviewAuto));
        section.closest('section').addEventListener('mouseleave', resetReviewAuto);
    }
}

/* ── Floating WA Button ── */
let waBubbleOpen = false;
let waHideTimeout;

function toggleWABubble() {
    waBubbleOpen = !waBubbleOpen;
    const bubble = document.getElementById('waBubble');
    const icon   = document.getElementById('waFloatIcon');

    if (waBubbleOpen) {
        bubble.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
        icon.className = 'fa-solid fa-xmark text-xl transition-all duration-300';
        // Auto-tutup setelah 6 detik jika tidak diklik
        clearTimeout(waHideTimeout);
        waHideTimeout = setTimeout(() => closeWABubble(), 6000);
    } else {
        closeWABubble();
    }
}

function closeWABubble() {
    waBubbleOpen = false;
    const bubble = document.getElementById('waBubble');
    const icon   = document.getElementById('waFloatIcon');
    bubble.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
    icon.className = 'fa-brands fa-whatsapp text-2xl transition-all duration-300';
    clearTimeout(waHideTimeout);
}

// Tutup bubble jika klik di luar area floating WA
document.addEventListener('click', (e) => {
    const floatEl = document.getElementById('floatingWA');
    if (waBubbleOpen && floatEl && !floatEl.contains(e.target)) {
        closeWABubble();
    }
});

// Sembunyikan floating button saat cart/modal terbuka agar tidak bentrok
function updateFloatingWAVisibility(hide) {
    const el = document.getElementById('floatingWA');
    if (!el) return;
    el.style.opacity    = hide ? '0' : '1';
    el.style.pointerEvents = hide ? 'none' : 'auto';
    el.style.transform  = hide ? 'scale(0.8)' : 'scale(1)';
}

function renderMenuGroups() {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '';

    const bestOutOfStock = isOutOfStock(bestSellerMenu.id);
    const bestCard = document.createElement('div');
    bestCard.className = 'menu-card overflow-hidden group flex flex-col border-2 border-flame shadow-[0_0_15px_rgba(244,196,48,0.25)]';
    bestCard.innerHTML = `
        <div class="relative h-48">
            <img src="${bestSellerMenu.img}" class="w-full h-full object-cover" loading="lazy">
            <div class="absolute top-2 left-2 bg-flame text-darker text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <i class="fa-solid fa-fire text-[10px]"></i> FAVORIT PELANGGAN
            </div>
            ${renderStockOverlay(bestSellerMenu.id)}
        </div>
        <div class="p-5 flex-1">
            <h3 class="text-xl font-bold text-ink">${bestSellerMenu.name}</h3>
            <p class="text-ember text-sm font-semibold mb-2">Rp ${bestSellerMenu.price.toLocaleString('id-ID')}</p>
            <p class="text-stone text-xs mb-3 italic">"${bestSellerMenu.desc}"</p>
            <button onclick="addVariantToCart('${bestSellerMenu.id}', 'bestSeller', this)" ${bestOutOfStock ? 'disabled' : ''} class="w-full bg-flame text-darker py-3 rounded-lg font-bold hover:brightness-110 transition-all mt-4 ${bestOutOfStock ? 'opacity-50 cursor-not-allowed hover:brightness-100' : ''}">${bestOutOfStock ? 'Stok Habis' : 'Pesan Sekarang'}</button>
        </div>
    `;
    grid.appendChild(bestCard);

    menuData.forEach(group => {
        const fullyOut = isGroupFullyOutOfStock(group);
        const card = document.createElement('div');
        card.className = 'menu-card overflow-hidden group flex flex-col';
        card.innerHTML = `
            <div class="relative h-48 hover-zoom">
                <img src="${group.img}" class="w-full h-full object-cover" loading="lazy">
                ${renderGroupStockOverlay(group)}
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start gap-3 mb-2">
                        <h3 class="font-serif text-xl font-bold text-ink leading-tight">${group.groupName}</h3>
                        <span class="shrink-0 bg-ember/10 text-ember text-xs font-bold px-2 py-1 rounded border border-ember/30">${group.variants.length} Varian</span>
                    </div>
                    <p class="text-stone text-sm mb-5">${group.desc}</p>
                </div>
                <button onclick="openVariantModal('${group.id}')" ${fullyOut && !isAdminMode ? 'disabled' : ''} class="w-full border border-ember text-ember hover:bg-ember hover:text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${fullyOut && !isAdminMode ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-ember' : ''}">
                    <i class="fa-solid fa-list-ul"></i> ${fullyOut ? 'Stok Habis' : 'Pilih Varian'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderVariantStockControl(variantId, groupId) {
    const outOfStock = isOutOfStock(variantId);
    if (isAdminMode) {
        return `<button onclick="toggleItemStock('${variantId}', event)" class="text-[10px] font-bold px-3 py-2 rounded-lg border whitespace-nowrap ${outOfStock ? 'bg-red-500/10 text-red-600 border-red-500/30' : 'bg-green-500/10 text-green-700 border-green-500/30'}">
                    <i class="fa-solid ${outOfStock ? 'fa-rotate-left' : 'fa-ban'} mr-1"></i>${outOfStock ? 'Tandai Tersedia' : 'Tandai Habis'}
                </button>`;
    }
    if (outOfStock) {
        return `<span class="text-red-600 text-xs font-bold bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg whitespace-nowrap">Habis</span>`;
    }
    return `<button onclick="addVariantToCart('${variantId}', '${groupId}', this)" class="bg-ember/10 text-ember hover:bg-ember hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-ember/20">
                <i class="fa-solid fa-plus"></i>
            </button>`;
}

function openVariantModal(groupId, isRefresh) {
    if (!isShopOpen && !isAdminMode) return;
    const group = menuData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('variantModalTitle').innerText = group.groupName;
    const list = document.getElementById('variantList');

    // Bangun semua HTML dulu di memori, baru assign SEKALI ke DOM.
    // (Sebelumnya pakai innerHTML += di dalam loop → tiap iterasi
    // re-parse seluruh isi list dari awal, jadi lag terutama di HP.)
    list.innerHTML = group.variants.map(variant => `
        <div class="flex justify-between items-center bg-creamCard p-4 rounded-xl border border-taupe hover:border-ember/50 transition-colors ${isOutOfStock(variant.id) && !isAdminMode ? 'opacity-50' : ''}">
            <div>
                <h4 class="text-ink font-medium mb-1">${variant.name}</h4>
                <span class="text-ember text-sm font-semibold">Rp ${variant.price.toLocaleString('id-ID')}</span>
            </div>
            ${renderVariantStockControl(variant.id, groupId)}
        </div>
    `).join('');

    const modal = document.getElementById('variantModal');
    const content = document.getElementById('variantModalContent');
    modal.dataset.openGroupId = groupId;
    if (!isRefresh) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        document.body.style.overflow = 'hidden';
    }
}

function closeVariantModal() {
    const modal = document.getElementById('variantModal');
    const content = document.getElementById('variantModalContent');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    modal.classList.add('opacity-0', 'pointer-events-none');
    if (document.getElementById('cartModal').classList.contains('opacity-0')) {
         document.body.style.overflow = '';
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 2000);
}

function addVariantToCart(variantId, groupId, btnElement) {
    if (!isShopOpen) return;
    if (isOutOfStock(variantId)) return; // lapisan keamanan tambahan, harusnya tombol sudah tidak muncul kalau habis
    let itemToAdd;
    if (groupId === 'bestSeller') {
        itemToAdd = { ...bestSellerMenu, qty: 1 };
    } else {
        const group = menuData.find(g => g.id === groupId);
        const variant = group.variants.find(v => v.id === variantId);
        itemToAdd = { ...variant, qty: 1 };
    }
    
    const existing = cart.find(c => c.id === itemToAdd.id);
    if (existing) existing.qty += 1;
    else cart.push(itemToAdd);
    
    saveCartToStorage();
    updateCartUI();
    showToast();
    
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `<i class="fa-solid fa-check"></i>`;
    btnElement.classList.replace('text-ember', 'text-white');
    btnElement.classList.add('bg-green-500');
    
    setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        btnElement.classList.replace('text-white', 'text-ember');
        btnElement.classList.remove('bg-green-500');
    }, 800);
}

function updateCartQuantity(id, delta) {
    const itemIndex = cart.findIndex(c => c.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += delta;
        if (cart[itemIndex].qty <= 0) cart.splice(itemIndex, 1);
    }
    saveCartToStorage();
    updateCartUI();
}

// UI KERANJANG DIPERBARUI DI SINI (Lebih Profesional)
// Validasi ringan: cuma toggle disabled tombol checkout, tanpa sentuh DOM list cart.
// Ini yang dipanggil tiap keystroke di form nama, biar tetap responsif saat mengetik.
function updateCheckoutButtonState() {
    const btnCheckout = document.getElementById('btnCheckout');
    if (!btnCheckout || cart.length === 0) return;

    const nameInput = document.getElementById('customerName');
    const nameFilled = nameInput && nameInput.value.trim() !== '';
    const distanceOk = !(deliveryMethod === 'delivery' && userDistance > 4);
    const locationOk = deliveryMethod === 'delivery' ? (locationDetected && distanceOk) : true;

    btnCheckout.disabled = !(nameFilled && locationOk);
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const badgeDesk = document.getElementById('cartBadgeDesk');
    const badgeMob = document.getElementById('cartBadgeMob');
    
    [badgeDesk, badgeMob].forEach(badge => {
        badge.innerText = totalItems;
        totalItems > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    });

    const list = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('emptyCart');
    const formArea = document.getElementById('orderFormArea');
    const btnCheckout = document.getElementById('btnCheckout');

    list.innerHTML = '';
    let subtotal = 0;

    if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        formArea.classList.add('hidden');
        btnCheckout.disabled = true;
    } else {
        emptyState.classList.add('hidden');
        formArea.classList.remove('hidden');
        updateCheckoutButtonState();

        subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

        // Bangun semua HTML dulu di memori, baru assign SEKALI ke DOM.
        // (Sebelumnya pakai innerHTML += di dalam loop → tiap item baru
        // memaksa browser re-parse ulang seluruh list dari awal, jadi
        // makin banyak item makin lag. Ini juga kepanggil tiap kali
        // user mengetik nama, jadi ngetik pun kerasa patah-patah.)
        list.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center bg-creamCard p-4 rounded-xl border border-taupe shadow-sm relative overflow-hidden group">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-taupe group-hover:bg-ember transition-colors"></div>
                <div class="flex-1 pl-2">
                    <h4 class="text-ink text-base font-bold mb-1">${item.name}</h4>
                    <span class="text-ember font-semibold text-sm">Rp ${item.price.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex items-center gap-3 bg-cream rounded-lg p-1 border border-taupe shadow-inner">
                    <button onclick="updateCartQuantity('${item.id}', -1)" class="text-stone hover:text-ink hover:bg-taupe w-7 h-7 rounded flex items-center justify-center transition-colors"><i class="fa-solid fa-minus text-xs"></i></button>
                    <span class="text-ink text-sm font-bold w-4 text-center">${item.qty}</span>
                    <button onclick="updateCartQuantity('${item.id}', 1)" class="text-ember bg-ember/10 hover:bg-ember hover:text-white w-7 h-7 rounded flex items-center justify-center transition-colors"><i class="fa-solid fa-plus text-xs"></i></button>
                </div>
            </div>
        `).join('');
    }

    // Kalkulasi Total
    document.getElementById('cartSubtotal').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    let finalTotal = subtotal + (deliveryMethod === 'delivery' ? shippingCost : 0);
    document.getElementById('cartTotal').innerText = `Rp ${finalTotal.toLocaleString('id-ID')}`;

    // --- LOGIKA UNTUK MENAMPILKAN / MENYEMBUNYIKAN ONGKIR ---
    const shippingRow = document.getElementById('shippingRow');
    if (deliveryMethod === 'delivery' && locationDetected && userDistance <= 4) {
        // Tampilkan baris ongkir jika delivery dipilih dan lokasi valid
        shippingRow.classList.remove('hidden');
        document.getElementById('cartShipping').innerText = `Rp ${shippingCost.toLocaleString('id-ID')}`;
    } else {
        // Sembunyikan baris ongkir jika dine-in atau lokasi belum dideteksi/kejauhan
        shippingRow.classList.add('hidden');
    }
}
function toggleCart() {
    const modal = document.getElementById('cartModal');
    const sidebar = document.getElementById('cartSidebar');
    if (modal.classList.contains('opacity-0')) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        sidebar.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
        updateFloatingWAVisibility(true);
        closeWABubble();
    } else {
        sidebar.classList.add('translate-x-full');
        modal.classList.add('opacity-0', 'pointer-events-none');
        if (document.getElementById('variantModal').classList.contains('opacity-0')) {
            document.body.style.overflow = '';
        }
        updateFloatingWAVisibility(false);
    }
}

function handleDeliveryChange() {
    const radios = document.getElementsByName('deliveryType');
    for (let r of radios) {
        if (r.checked) deliveryMethod = r.value;
    }

    const addressWrap = document.getElementById('addressWrap');
    const locationArea = document.getElementById('locationArea');
    const distanceRow = document.getElementById('distanceRow');
    const geoError = document.getElementById('geoError');
    const geoStatus = document.getElementById('geoStatus');

    if (deliveryMethod === 'delivery') {
        if (locationArea) locationArea.classList.remove('hidden');
        addressWrap.classList.remove('hidden');
    } else {
        if (locationArea) locationArea.classList.add('hidden');
        addressWrap.classList.add('hidden');
        if (distanceRow) distanceRow.classList.add('hidden');
        if (geoError) geoError.classList.add('hidden');
        if (geoStatus) geoStatus.innerText = '';
        shippingCost = 0;
        userDistance = 0;
        locationDetected = false;
        document.getElementById('cartShipping').innerText = `Rp 0`;
    }
    updateCartUI();
}

function calculateShipping() {
    const status = document.getElementById('geoStatus');
    const geoError = document.getElementById('geoError');
    const distanceRow = document.getElementById('distanceRow');
    const btnCekLokasi = document.getElementById('btnCekLokasi');

    geoError.classList.add('hidden');
    distanceRow.classList.add('hidden');
    locationDetected = false;

    if (!navigator.geolocation) {
        status.innerText = '';
        geoError.querySelector('p').innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i> Perangkat atau browser kamu tidak mendukung deteksi lokasi (GPS). Coba gunakan browser lain.';
        geoError.classList.remove('hidden');
        updateCartUI();
        return;
    }

    status.innerText = "Mencari lokasi...";
    status.className = "text-xs text-center text-ember animate-pulse mt-2 block";
    btnCekLokasi.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            btnCekLokasi.disabled = false;
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            userDistance = haversineDistance(SHOP_LAT, SHOP_LON, userLat, userLon);
            locationDetected = true;

            if (deliveryMethod === 'delivery' && userDistance > 4) {
                status.innerText = `Jarak ${userDistance.toFixed(2)} km. Terlalu jauh untuk pengantaran (Maks 4km).`;
                status.className = "text-xs text-center text-red-500 font-bold mt-2 block";
                shippingCost = 0;
            } else {
                if (userDistance <= 1) shippingCost = 3000;
                else if (userDistance <= 2) shippingCost = 5000;
                else if (userDistance <= 3) shippingCost = 10000;
                else if (userDistance <= 4) shippingCost = 12000;
                else shippingCost = 0;

                status.innerText = "Lokasi berhasil terdeteksi.";
                status.className = "text-xs text-center text-green-400 mt-2 block";
            }

            document.getElementById('distanceText').innerText = `${userDistance.toFixed(2)} km`;
            distanceRow.classList.remove('hidden');
            distanceRow.classList.add('flex');
            document.getElementById('cartShipping').innerText = `Rp ${shippingCost.toLocaleString('id-ID')}`;
            updateCartUI();
        },
        (error) => {
            btnCekLokasi.disabled = false;
            status.innerText = '';
            let pesan = 'Lokasi gagal terdeteksi. Pastikan GPS aktif dan izin lokasi untuk situs ini sudah diizinkan di pengaturan browser kamu, lalu coba lagi.';
            if (error.code === error.PERMISSION_DENIED) {
                pesan = 'Akses lokasi ditolak. Buka pengaturan izin situs di browser kamu, aktifkan izin Lokasi untuk halaman ini, lalu coba lagi.';
            } else if (error.code === error.TIMEOUT) {
                pesan = 'Waktu pencarian lokasi habis. Pastikan GPS aktif dan sinyal cukup kuat, lalu coba lagi.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                pesan = 'Lokasi tidak tersedia saat ini. Pastikan GPS aktif, lalu coba lagi.';
            }
            geoError.querySelector('p').innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${pesan}`;
            geoError.classList.remove('hidden');
            updateCartUI();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function processWhatsAppCheckout() {
    if (!isShopOpen) return alert("Angkringan Senthir sedang tutup.");
    if (cart.length === 0) return;

    const customerName = document.getElementById('customerName').value.trim();
    const address      = document.getElementById('addressInput')?.value.trim() ?? '';

    if (customerName === '') {
        alert("Nama penerima wajib diisi.");
        document.getElementById('customerName').focus();
        return;
    }
    if (deliveryMethod === 'delivery' && !locationDetected) {
        alert("Lokasi kamu wajib dideteksi dulu. Tekan tombol \"Cek Lokasi Saya\".");
        document.getElementById('btnCekLokasi').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (deliveryMethod === 'delivery' && userDistance > 4) {
        alert("Lokasi kamu terlalu jauh untuk pengantaran (Maks 4km).");
        return;
    }
    if (deliveryMethod === 'delivery' && address === '') {
        alert("Detail alamat tidak boleh kosong.");
        document.getElementById('addressInput').focus();
        return;
    }

    // Semua validasi lulus → tampilkan modal konfirmasi dulu
    openConfirmModal(customerName, address);
}

function openConfirmModal(customerName, address) {
    const isDelivery = deliveryMethod === 'delivery';
    const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ongkir     = isDelivery ? shippingCost : 0;
    const total      = subtotal + ongkir;

    // Nama & metode
    document.getElementById('confirmName').textContent = customerName;
    document.getElementById('confirmMethod').innerHTML = isDelivery
        ? '<i class="fa-solid fa-motorcycle text-ember mr-1"></i> Pesan Antar'
        : '<i class="fa-solid fa-store text-ember mr-1"></i> Makan di Tempat';

    // Estimasi waktu
    document.getElementById('confirmEtaText').textContent = isDelivery
        ? '25–40 menit (tergantung jarak)'
        : '10–20 menit (siap di tempat)';

    // Step label adaptif
    const deliverIcon  = document.getElementById('stepDeliverIcon');
    const deliverLabel = document.getElementById('stepDeliverLabel');
    deliverIcon.className  = isDelivery
        ? 'fa-solid fa-motorcycle text-parchment/40 text-xs'
        : 'fa-solid fa-bell-concierge text-parchment/40 text-xs';
    deliverLabel.textContent = isDelivery ? 'Diantar' : 'Siap';

    // Daftar item
    document.getElementById('confirmItemList').innerHTML = cart.map(item => `
        <div class="flex justify-between items-center px-4 py-3">
            <div>
                <p class="text-darker font-semibold text-sm">${item.name}</p>
                <p class="text-darker/40 text-xs">${item.qty} × Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <span class="text-darker font-bold text-sm">Rp ${(item.qty * item.price).toLocaleString('id-ID')}</span>
        </div>
    `).join('');

    // Biaya
    document.getElementById('confirmSubtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('confirmTotal').textContent    = `Rp ${total.toLocaleString('id-ID')}`;

    const shippingRow = document.getElementById('confirmShippingRow');
    if (isDelivery && ongkir > 0) {
        shippingRow.classList.remove('hidden');
        document.getElementById('confirmShipping').textContent = `Rp ${ongkir.toLocaleString('id-ID')}`;
    } else {
        shippingRow.classList.add('hidden');
    }

    // Alamat
    const addrRow = document.getElementById('confirmAddressRow');
    if (isDelivery && address) {
        addrRow.classList.remove('hidden');
        document.getElementById('confirmAddress').textContent = address;
    } else {
        addrRow.classList.add('hidden');
    }

    // Simpan data pending
    window._pendingOrder = { customerName, address, subtotal, ongkir, total };

    // Tampilkan modal
    const modal   = document.getElementById('confirmModal');
    const content = document.getElementById('confirmModalContent');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    requestAnimationFrame(() => {
        content.classList.remove('translate-y-6', 'md:scale-95');
    });
    document.body.style.overflow = 'hidden';

    // Animasi step cascade
    setTimeout(() => {
        const sp = document.getElementById('stepProcess');
        sp.className = 'w-7 h-7 rounded-full bg-ember/30 border border-ember/50 flex items-center justify-center transition-all duration-500';
        sp.querySelector('i').className = 'fa-solid fa-fire text-ember text-xs';
        document.getElementById('stepProcessLabel').className = 'text-[10px] text-ember/70 mt-1 font-semibold transition-colors duration-500';
    }, 450);
    setTimeout(() => {
        const sd = document.getElementById('stepDeliver');
        sd.className = 'w-7 h-7 rounded-full bg-ember/20 border border-ember/40 flex items-center justify-center transition-all duration-500';
        const icon = sd.querySelector('i');
        icon.className = icon.className.replace('text-parchment/40', 'text-ember/60');
        document.getElementById('stepDeliverLabel').className = 'text-[10px] text-ember/50 mt-1 font-semibold transition-colors duration-500';
    }, 900);
}

function closeConfirmModal() {
    const modal   = document.getElementById('confirmModal');
    const content = document.getElementById('confirmModalContent');
    content.classList.add('translate-y-6', 'md:scale-95');
    setTimeout(() => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';

        // Reset step animasi untuk next kali
        const sp = document.getElementById('stepProcess');
        sp.className = 'w-7 h-7 rounded-full bg-parchment/15 border border-parchment/20 flex items-center justify-center transition-all duration-500';
        sp.querySelector('i').className = 'fa-solid fa-fire text-parchment/40 text-xs';
        document.getElementById('stepProcessLabel').className = 'text-[10px] text-parchment/40 mt-1 font-semibold transition-colors duration-500';
        const sd = document.getElementById('stepDeliver');
        sd.className = 'w-7 h-7 rounded-full bg-parchment/15 border border-parchment/20 flex items-center justify-center transition-all duration-500';
        const sdIcon = sd.querySelector('i');
        sdIcon.className = sdIcon.className.replace('text-ember/60', 'text-parchment/40');
        document.getElementById('stepDeliverLabel').className = 'text-[10px] text-parchment/40 mt-1 font-semibold transition-colors duration-500';
    }, 300);
}

function sendToWhatsApp() {
    const adminPhone = "6285880706634";
    const { customerName, address, subtotal, ongkir, total } = window._pendingOrder;

    let waText = `*🥘 PESANAN ANGKRINGAN SENTHIR 🥘*\n================================\n\n*Atas Nama:* ${customerName}\n\n*Daftar Menu:*\n`;
    cart.forEach((item, i) => {
        waText += `${i + 1}. ${item.name}\n   ${item.qty} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.qty * item.price).toLocaleString('id-ID')}\n`;
    });
    waText += `--------------------------------\nSubtotal  : *Rp ${subtotal.toLocaleString('id-ID')}*\n\n*Metode Pemesanan:*\nTipe      : ${deliveryMethod === 'delivery' ? '🛵 Diantarkan' : '🏪 Makan di Tempat'}\n`;
    if (deliveryMethod === 'delivery') {
        waText += `Jarak     : ${userDistance.toFixed(2)} km\nOngkir    : Rp ${ongkir.toLocaleString('id-ID')}\nAlamat    : ${address}\n`;
    }
    waText += `\n================================\n*TOTAL BAYAR : Rp ${total.toLocaleString('id-ID')}*\n================================\n\n_Mohon segera diproses ya Min!_`;

    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(waText)}`, '_blank');
    closeConfirmModal();

    // Simpan pesanan ini ke riwayat sebelum cart dikosongkan
    saveOrderToHistory({
        id: Date.now(),
        date: new Date().toISOString(),
        customerName,
        deliveryMethod,
        address: deliveryMethod === 'delivery' ? address : '',
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
        subtotal,
        ongkir,
        total
    });

    // Reset cart setelah order terkirim
    setTimeout(() => {
        cart = [];
        saveCartToStorage();
        updateCartUI();
        toggleCart();
        if (document.getElementById('customerName'))
            document.getElementById('customerName').value = '';
    }, 350);
}

function formatHistoryDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
}

function renderOrderHistory() {
    const list = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyHistory');
    if (!list || !emptyState) return;

    const history = loadOrderHistory();
    list.innerHTML = '';

    if (history.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    history.forEach(order => {
        const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        const methodLabel = order.deliveryMethod === 'delivery' ? '🛵 Pesan Antar' : '🏪 Makan di Tempat';
        const card = document.createElement('div');
        card.className = 'bg-creamCard border border-taupe rounded-xl p-4 relative overflow-hidden';
        card.innerHTML = `
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-ember"></div>
            <div class="pl-2">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-stone">${formatHistoryDate(order.date)}</span>
                    <span class="text-ember font-bold text-sm">Rp ${order.total.toLocaleString('id-ID')}</span>
                </div>
                <p class="text-ink text-sm font-semibold mb-1">${order.customerName}</p>
                <p class="text-stone text-xs mb-1">${methodLabel}</p>
                <p class="text-ink/70 text-xs leading-relaxed mb-3">${itemsSummary}</p>
                <button onclick="reorderFromHistory(${order.id})" class="w-full bg-ember text-dark font-bold py-2.5 rounded-lg hover:bg-emberHover transition-all flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-rotate-right"></i> Pesan Lagi
                </button>
            </div>
        `;
        list.appendChild(card);
    });
}

function toggleHistoryModal() {
    const modal = document.getElementById('historyModal');
    const sidebar = document.getElementById('historySidebar');
    if (modal.classList.contains('opacity-0')) {
        renderOrderHistory();
        modal.classList.remove('opacity-0', 'pointer-events-none');
        sidebar.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
        updateFloatingWAVisibility(true);
        closeWABubble();
    } else {
        sidebar.classList.add('translate-x-full');
        modal.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
        updateFloatingWAVisibility(false);
    }
}

function reorderFromHistory(orderId) {
    const history = loadOrderHistory();
    const order = history.find(o => o.id === orderId);
    if (!order) return;

    if (!isShopOpen) {
        alert('Angkringan Senthir sedang tutup. Pesanan belum bisa diproses sekarang.');
        return;
    }

    // Gabungkan item dari riwayat ke cart yang aktif
    order.items.forEach(histItem => {
        const existing = cart.find(c => c.id === histItem.id);
        if (existing) existing.qty += histItem.qty;
        else cart.push({ ...histItem });
    });

    saveCartToStorage();
    updateCartUI();
    toggleHistoryModal();
    if (document.getElementById('cartModal').classList.contains('opacity-0')) {
        toggleCart();
    }

    const nameInput = document.getElementById('customerName');
    if (nameInput && nameInput.value.trim() === '') {
        nameInput.value = order.customerName;
        updateCartUI();
    }
}
