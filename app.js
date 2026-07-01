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

document.addEventListener('DOMContentLoaded', () => {
    validateOperatingHours();
    setInterval(validateOperatingHours, 60000); 
    renderMenuGroups();
    renderFeaturedMenu();
    initKeunggulanReveal();
    initReviewSlider();
    initCounterAnimation();

    const nameInput = document.getElementById('customerName');
    if (nameInput) {
        nameInput.addEventListener('input', updateCartUI);
    }
});

// LOGIKA WARNA NAVIGASI DIPERBARUI DI SINI
function switchView(view) {
    const homeView = document.getElementById('homeView');
    const menuView = document.getElementById('menuView');
    const navHome = document.getElementById('navHome');
    const navMenu = document.getElementById('navMenu');
    
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
    if (isClosed) {
        isShopOpen = false;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.style.overflow = 'hidden';
    } else {
        isShopOpen = true;
        overlay.classList.remove('flex');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Update badge status live di navbar
    const badge = document.getElementById('shopStatusBadge');
    const dot = document.getElementById('shopStatusDot');
    const text = document.getElementById('shopStatusText');
    if (badge && dot && text) {
        if (isShopOpen) {
            badge.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-400');
            badge.classList.add('bg-green-500/10', 'border-green-500/30', 'text-green-400');
            dot.classList.remove('bg-red-400');
            dot.classList.add('bg-green-400', 'animate-pulse');
            text.textContent = 'Buka Sekarang';
        } else {
            badge.classList.remove('bg-green-500/10', 'border-green-500/30', 'text-green-400');
            badge.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-400');
            dot.classList.remove('bg-green-400', 'animate-pulse');
            dot.classList.add('bg-red-400');
            text.textContent = 'Tutup Sekarang';
        }
    }
}

function renderFeaturedMenu() {
    const wrap = document.getElementById('featuredMenuGrid');
    if (!wrap) return;
    wrap.innerHTML = '';

    // Kartu best seller (varian tunggal, langsung bisa pesan)
    const bestCard = document.createElement('div');
    bestCard.className = 'menu-card overflow-hidden group flex flex-col border-2 border-flame shadow-[0_0_15px_rgba(244,196,48,0.25)]';
    bestCard.innerHTML = `
        <div class="relative h-44 hover-zoom">
            <img src="${bestSellerMenu.img}" class="w-full h-full object-cover" loading="lazy">
            <div class="absolute top-2 left-2 bg-flame text-darker text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <i class="fa-solid fa-fire text-[10px]"></i> FAVORIT
            </div>
        </div>
        <div class="p-5 flex-1 flex flex-col">
            <h3 class="text-lg font-bold text-ink leading-tight">${bestSellerMenu.name}</h3>
            <p class="text-ember text-sm font-semibold mt-1 mb-4">Rp ${bestSellerMenu.price.toLocaleString('id-ID')}</p>
            <button onclick="addVariantToCart('${bestSellerMenu.id}', 'bestSeller', this)" class="w-full bg-flame text-darker py-3 rounded-lg font-bold hover:brightness-110 transition-all mt-auto">Pesan Sekarang</button>
        </div>
    `;
    wrap.appendChild(bestCard);

    // Tiga grup menu dipilih sebagai sorotan (id: g1 Sate, g4 Nasi Bakar, g9 Kopi)
    const featuredGroupIds = ['g1', 'g4', 'g9'];
    featuredGroupIds.forEach(gid => {
        const group = menuData.find(g => g.id === gid);
        if (!group) return;
        const card = document.createElement('div');
        card.className = 'menu-card overflow-hidden group flex flex-col';
        card.innerHTML = `
            <div class="relative h-44 hover-zoom">
                <img src="${group.img}" class="w-full h-full object-cover" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-wood2 to-transparent opacity-80"></div>
                <div class="absolute bottom-3 left-4 right-4">
                    <h3 class="font-serif text-lg font-bold text-white leading-tight">${group.groupName}</h3>
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <p class="text-stone text-xs mb-4 line-clamp-2">${group.desc}</p>
                <button onclick="openVariantModal('${group.id}')" class="w-full border border-ember text-ember hover:bg-ember hover:text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mt-auto text-sm">
                    <i class="fa-solid fa-list-ul"></i> Pilih Varian
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

function renderMenuGroups() {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '';

    const bestCard = document.createElement('div');
    bestCard.className = 'menu-card overflow-hidden group flex flex-col border-2 border-flame shadow-[0_0_15px_rgba(244,196,48,0.25)]';
    bestCard.innerHTML = `
        <div class="relative h-48">
            <img src="${bestSellerMenu.img}" class="w-full h-full object-cover" loading="lazy">
            <div class="absolute top-2 left-2 bg-flame text-darker text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <i class="fa-solid fa-fire text-[10px]"></i> FAVORIT PELANGGAN
            </div>
        </div>
        <div class="p-5 flex-1">
            <h3 class="text-xl font-bold text-ink">${bestSellerMenu.name}</h3>
            <p class="text-ember text-sm font-semibold mb-2">Rp ${bestSellerMenu.price.toLocaleString('id-ID')}</p>
            <p class="text-stone text-xs mb-3 italic">"${bestSellerMenu.desc}"</p>
            <button onclick="addVariantToCart('${bestSellerMenu.id}', 'bestSeller', this)" class="w-full bg-flame text-darker py-3 rounded-lg font-bold hover:brightness-110 transition-all mt-4">Pesan Sekarang</button>
        </div>
    `;
    grid.appendChild(bestCard);

    menuData.forEach(group => {
        const card = document.createElement('div');
        card.className = 'menu-card overflow-hidden group flex flex-col';
        card.innerHTML = `
            <div class="relative h-48 hover-zoom">
                <img src="${group.img}" class="w-full h-full object-cover" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-wood2 to-transparent opacity-80"></div>
                <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <h3 class="font-serif text-2xl font-bold text-white leading-tight">${group.groupName}</h3>
                    <span class="bg-ember text-darker text-xs font-bold px-2 py-1 rounded">${group.variants.length} Varian</span>
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <p class="text-stone text-sm mb-5">${group.desc}</p>
                <button onclick="openVariantModal('${group.id}')" class="w-full border border-ember text-ember hover:bg-ember hover:text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-list-ul"></i> Pilih Varian
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openVariantModal(groupId) {
    if (!isShopOpen) return;
    const group = menuData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('variantModalTitle').innerText = group.groupName;
    const list = document.getElementById('variantList');
    list.innerHTML = '';

    group.variants.forEach(variant => {
        list.innerHTML += `
            <div class="flex justify-between items-center bg-creamCard p-4 rounded-xl border border-taupe hover:border-ember/50 transition-colors">
                <div>
                    <h4 class="text-ink font-medium mb-1">${variant.name}</h4>
                    <span class="text-ember text-sm font-semibold">Rp ${variant.price.toLocaleString('id-ID')}</span>
                </div>
                <button onclick="addVariantToCart('${variant.id}', '${groupId}', this)" class="bg-ember/10 text-ember hover:bg-ember hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-ember/20">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
    });

    const modal = document.getElementById('variantModal');
    const content = document.getElementById('variantModalContent');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
    document.body.style.overflow = 'hidden';
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
    updateCartUI();
}

// UI KERANJANG DIPERBARUI DI SINI (Lebih Profesional)
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

        const nameInput = document.getElementById('customerName');
        const nameFilled = nameInput && nameInput.value.trim() !== '';
        const distanceOk = !(deliveryMethod === 'delivery' && userDistance > 4);
        const locationOk = deliveryMethod === 'delivery' ? (locationDetected && distanceOk) : true;

        btnCheckout.disabled = !(nameFilled && locationOk);

        cart.forEach(item => {
            subtotal += item.price * item.qty;
            list.innerHTML += `
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
            `;
        });
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
    } else {
        sidebar.classList.add('translate-x-full');
        modal.classList.add('opacity-0', 'pointer-events-none');
        if (document.getElementById('variantModal').classList.contains('opacity-0')) {
            document.body.style.overflow = '';
        }
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

    const adminPhone = "6285880706634"; // GANTI DENGAN NOMOR WA LU
    const customerName = document.getElementById('customerName').value.trim();
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let total = subtotal + (deliveryMethod === 'delivery' ? shippingCost : 0);
    let address = document.getElementById('addressInput').value.trim();

    if (customerName === '') {
        alert("Nama penerima wajib diisi.");
        document.getElementById('customerName').focus();
        return;
    }

    if (deliveryMethod === 'delivery' && !locationDetected) {
        alert("Lokasi kamu wajib dideteksi dulu sebelum memesan. Tekan tombol \"Cek Lokasi Saya\" dan izinkan akses lokasi.");
        document.getElementById('btnCekLokasi').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (deliveryMethod === 'delivery' && userDistance > 4) {
        alert("Lokasi kamu terlalu jauh untuk pengantaran (Maks 4km). Silakan pilih Makan di Tempat atau cek ulang lokasi.");
        return;
    }

    if (deliveryMethod === 'delivery' && address === '') {
        alert("Detail alamat tidak boleh kosong.");
        document.getElementById('addressInput').focus();
        return;
    }

    let waText = `*🥘 PESANAN ANGKRINGAN SENTHIR 🥘*\n================================\n\n*Atas Nama:* ${customerName}\n\n*Daftar Menu:*\n`;
    cart.forEach((item, index) => {
        waText += `${index + 1}. ${item.name}\n   ${item.qty} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.qty * item.price).toLocaleString('id-ID')}\n`;
    });
    waText += `--------------------------------\nSubtotal  : *Rp ${subtotal.toLocaleString('id-ID')}*\n\n*Metode Pemesanan:*\nTipe      : ${deliveryMethod === 'delivery' ? '🛵 Diantarkan' : '🏪 Makan di Tempat'}\n`;
    if (deliveryMethod === 'delivery') {
        waText += `Jarak     : ${userDistance.toFixed(2)} km\nOngkir    : Rp ${shippingCost.toLocaleString('id-ID')}\nAlamat    : ${address}\n`;
    }
    waText += `\n================================\n*TOTAL BAYAR : Rp ${total.toLocaleString('id-ID')}*\n================================\n\n_Mohon segera diproses ya Min!_`;

    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(waText)}`, '_blank');
}
