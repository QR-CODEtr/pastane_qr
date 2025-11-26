// AYARLAR
const SHEET_ID = '1XM1Nen-80GOPN-SLqhSpMYEUDFvjg9DzhZUG6agwk-M'; // Senin ID
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/1`;

// Varsayılan kategori resmi (Excel'de boş bırakılırsa bu görünür)
const DEFAULT_IMG = "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80";

let MENU_DATA = {}; // Verileri burada tutacağız

document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    
    // Arama Yapma
    document.getElementById('search-input').addEventListener('input', (e) => searchProducts(e.target.value));
});

async function fetchMenu() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        if(data.length === 0) {
            document.getElementById('category-grid').innerHTML = "<p>Menü boş.</p>";
            return;
        }
        
        organizeData(data);

    } catch (err) {
        console.error(err);
        document.getElementById('category-grid').innerHTML = "<p style='color:red'>Bağlantı hatası.</p>";
    }
}

function organizeData(items) {
    MENU_DATA = {};

    items.forEach(item => {
        // Kategori veya Ad yoksa atla
        if (!item.kategori || !item.ad) return;

        let katAdi = item.kategori.trim();

        // Eğer bu kategori henüz oluşmadıysa oluştur
        if (!MENU_DATA[katAdi]) {
            MENU_DATA[katAdi] = {
                name: katAdi,
                image: DEFAULT_IMG, // Başlangıçta varsayılan resim
                products: []
            };
        }

        // Eğer Excel'de 'kategori_resmi' sütunu doluysa, kategorinin resmini güncelle
        // (Aynı kategori için birden fazla satırda resim varsa sonuncuyu alır, fark etmez)
        if (item.kategori_resmi && item.kategori_resmi.trim() !== "") {
            MENU_DATA[katAdi].image = item.kategori_resmi.trim();
        }

        // Ürünü listeye ekle
        MENU_DATA[katAdi].products.push(item);
    });

    renderCategories();
}

// 1. EKRAN: KATEGORİLERİ ÇİZ
function renderCategories() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = '';

    Object.values(MENU_DATA).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'cat-card';
        div.innerHTML = `
            <img src="${cat.image}" loading="lazy">
            <div class="cat-title">${cat.name}</div>
        `;
        div.onclick = () => openCategory(cat.name);
        grid.appendChild(div);
    });
}

// 2. EKRAN: KATEGORİ İÇERİĞİNİ AÇ
function openCategory(catName) {
    document.getElementById('categories-page').classList.add('hidden');
    document.getElementById('products-page').classList.remove('hidden');
    
    document.getElementById('cat-title-display').innerText = catName;
    
    renderSubMenu(catName);
    renderProducts(MENU_DATA[catName].products);
    
    window.scrollTo(0,0);
}

// ÜRÜNLERİ ÇİZ
function renderProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = '';

    if(products.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Sonuç yok.</p>";
        return;
    }

    products.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'product-card';

        let imageHTML = '';
        // Ürün resmi var mı? (Excel'deki 'resim' sütunu)
        if (prod.resim && prod.resim.trim() !== "") {
            imageHTML = `
                <div class="p-img-area">
                    <img src="${prod.resim}" loading="lazy" onerror="this.style.display='none'">
                    <div class="price-badge">${prod.fiyat} ₺</div>
                </div>
            `;
        } else {
            imageHTML = `<div style="text-align:right; padding:10px; color:#d4a056; font-weight:bold; border-bottom:1px solid #333;">${prod.fiyat} ₺</div>`;
        }

        div.innerHTML = `
            ${imageHTML}
            <div class="p-info">
                <h3>${prod.ad}</h3>
                <p>${prod.aciklama || ''}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

// ÜST YATAY MENÜ (Hızlı Geçiş)
function renderSubMenu(activeCat) {
    const menu = document.getElementById('sub-menu');
    menu.innerHTML = '';

    Object.keys(MENU_DATA).forEach(catKey => {
        const btn = document.createElement('button');
        btn.innerText = catKey;
        if(catKey === activeCat) btn.classList.add('active');
        
        btn.onclick = () => {
            document.querySelectorAll('.horizontal-menu button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('cat-title-display').innerText = catKey;
            renderProducts(MENU_DATA[catKey].products);
        };
        menu.appendChild(btn);
    });
}

// GERİ DÖN
function goHome() {
    document.getElementById('products-page').classList.add('hidden');
    document.getElementById('categories-page').classList.remove('hidden');
    document.getElementById('search-input').value = ''; // Aramayı temizle
    window.scrollTo(0,0);
}

// ARAMA YAPMA
function searchProducts(keyword) {
    if(!keyword) return; // Boşsa bir şey yapma
    
    keyword = keyword.toLowerCase();
    let results = [];

    // Tüm kategorilerin içindeki ürünlerde ara
    Object.values(MENU_DATA).forEach(cat => {
        cat.products.forEach(prod => {
            if(prod.ad.toLowerCase().includes(keyword)) {
                results.push(prod);
            }
        });
    });

    // Sonuç ekranını aç
    document.getElementById('categories-page').classList.add('hidden');
    document.getElementById('products-page').classList.remove('hidden');
    document.getElementById('cat-title-display').innerText = `Arama: "${keyword}"`;
    document.getElementById('sub-menu').innerHTML = ''; // Menüyü gizle
    renderProducts(results);
}