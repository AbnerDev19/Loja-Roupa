/* =================================================== */
/* ==== SCRIPT DA LOJA (Firebase Integrado) ==== */
/* =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCxznTW2u5DMawvTratTuZ-bFpQoDb4XlQ",
  authDomain: "crismon-modas.firebaseapp.com",
  projectId: "crismon-modas",
  storageBucket: "crismon-modas.firebasestorage.app",
  messagingSenderId: "595669038570",
  appId: "1:595669038570:web:2b42fba0e7e6fe7bb8ae93",
  measurementId: "G-KFWZBJZ4SX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- 1. Elementos da DOM ---
    const productGrid = document.getElementById('product-grid');
    const filterTabs = document.querySelectorAll('.filter-tab-btn');
    const searchBar = document.getElementById('search-bar');
    const sidebarCheckboxes = document.querySelectorAll('.sub-filter-checkbox');
    const colorSwatches = document.querySelectorAll('.color-filter-swatch');
    
    let allProducts = []; // Armazena todos os produtos baixados

    // --- 2. Função para Carregar Produtos ---
    async function fetchProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "produtos"));
            allProducts = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allProducts.push({ id: doc.id, ...data });
            });

            renderProducts(allProducts);
            
            // Verifica URL para filtro inicial (ex: loja.html?categoria=vestidos)
            const params = new URLSearchParams(window.location.search);
            const categoryParam = params.get('categoria');
            if (categoryParam) {
                // Ativa a aba correta visualmente
                filterTabs.forEach(t => {
                    t.classList.remove('active');
                    if(t.dataset.filter === categoryParam) t.classList.add('active');
                });
                // Aplica o filtro
                applyFilters();
            }

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            productGrid.innerHTML = "<p>Erro ao carregar produtos. Tente novamente.</p>";
        }
    }

    // --- 3. Função para Renderizar HTML ---
    function renderProducts(products) {
        productGrid.innerHTML = "";

        if (products.length === 0) {
            productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem;">Nenhum produto encontrado.</div>`;
            return;
        }

        products.forEach(prod => {
            // Define a imagem principal (primeira do array ou campo foto)
            const mainImage = (prod.fotos && prod.fotos.length > 0) ? prod.fotos[0] : (prod.foto || 'placeholder.jpg');
            
            // Cria as strings de dados para filtro
            const categoryString = (prod.categoria || "").toLowerCase();
            const nameString = (prod.nome || "").toLowerCase();
            const colorString = (prod.corNomes ? prod.corNomes.join(" ") : "").toLowerCase();

            const card = document.createElement('div');
            card.className = 'product-card';
            // Guarda dados nos atributos para filtragem rápida se necessário, 
            // mas aqui usaremos a array 'allProducts' para filtrar.
            
            card.innerHTML = `
                <a href="produto.html?id=${prod.id}" class="product-card-link">
                    <div class="product-image-placeholder" style="background-image: url('${mainImage}');"></div>
                </a>
                <div class="product-card-content">
                    <span class="product-card-label">Cód ${prod.id.substring(0, 6).toUpperCase()}</span>
                    <h3><a href="produto.html?id=${prod.id}" class="product-card-link">${prod.nome}</a></h3>
                    <p class="product-price">${prod.preco}</p>
                    <p class="product-installments">${prod.parcelas || ''}</p>
                    <div class="product-card-footer">
                        <a href="produto.html?id=${prod.id}" class="card-add-button">
                            <span>Ver Opções</span>
                        </a>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }

    // --- 4. Lógica de Filtragem ---
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        
        // Aba Ativa
        const activeTabBtn = document.querySelector('.filter-tab-btn.active');
        const activeCategory = activeTabBtn ? activeTabBtn.dataset.filter : 'todos';

        // Checkboxes (Sidebar)
        const activeSubFilters = Array.from(sidebarCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        // Cores (Sidebar)
        const activeColorFilters = Array.from(document.querySelectorAll('.color-filter-swatch.selected'))
            .map(s => s.dataset.colorName.toLowerCase());

        // Filtrar o Array
        const filtered = allProducts.filter(prod => {
            const prodCat = (prod.categoria || "").toLowerCase();
            const prodName = (prod.nome || "").toLowerCase();
            const prodColors = (prod.corNomes || []).map(c => c.toLowerCase());
            const prodSizes = (prod.tamanhos || []).join(" ").toLowerCase(); // Para filtrar plus size se estiver no tamanho

            // 1. Filtro de Categoria (Abas)
            let matchCategory = true;
            if (activeCategory !== 'todos') {
                // Se for "destaques", verifica se tem tag destaque OU se é a home (simplificado aqui para mostrar tudo ou filtrar específico)
                if (activeCategory === 'destaques') {
                    // Se você tiver um campo 'destaque' no banco, use-o. 
                    // Por enquanto, vamos assumir que 'destaques' mostra tudo ou uma categoria específica.
                    // Vamos fazer 'destaques' mostrar tudo por enquanto na loja.
                    matchCategory = true; 
                } else {
                    matchCategory = prodCat.includes(activeCategory);
                }
            }

            // 2. Busca por Texto
            const matchSearch = prodName.includes(searchTerm) || prod.id.includes(searchTerm);

            // 3. Sub-filtros (Sidebar - ex: Plus Size)
            let matchSub = true;
            if (activeSubFilters.length > 0) {
                // Verifica se alguma das tags selecionadas bate com o produto
                // Ex: se selecionou 'plus', verifica se nome ou categoria tem 'plus'
                matchSub = activeSubFilters.some(filter => {
                    return prodName.includes(filter) || prodCat.includes(filter) || prodSizes.includes(filter);
                });
            }

            // 4. Filtro de Cor
            let matchColor = true;
            if (activeColorFilters.length > 0) {
                // Verifica se o produto tem ALGUMA das cores selecionadas
                matchColor = activeColorFilters.some(filterColor => {
                    // Verifica nos nomes das cores do produto
                    return prodColors.some(prodColorName => prodColorName.includes(filterColor));
                });
            }

            return matchCategory && matchSearch && matchSub && matchColor;
        });

        renderProducts(filtered);
    }

    // --- 5. Event Listeners ---
    
    // Abas
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            applyFilters();
        });
    });

    // Busca
    searchBar.addEventListener('input', applyFilters);

    // Sidebar Checkboxes
    sidebarCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // Sidebar Cores
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatch.classList.toggle('selected');
            applyFilters();
        });
    });

    // Menu Mobile e Sidebar
    const hamburger = document.getElementById('hamburger-menu');
    const nav = document.getElementById('card-nav');
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            nav.classList.toggle('open');
            if(nav.classList.contains('open')) {
                nav.style.height = window.innerWidth > 768 ? '200px' : 'auto';
            } else {
                nav.style.height = '60px';
            }
        });
    }

    // Sidebar de Filtro (Refinar)
    const openFilterBtn = document.getElementById('open-subfilter-btn');
    const closeFilterBtn = document.getElementById('sub-filter-close-btn');
    const filterSidebar = document.getElementById('sub-filter-sidebar');
    const filterOverlay = document.getElementById('sub-filter-overlay');

    function toggleFilter() {
        filterSidebar.classList.toggle('open');
        filterOverlay.classList.toggle('open');
    }

    if(openFilterBtn) openFilterBtn.addEventListener('click', toggleFilter);
    if(closeFilterBtn) closeFilterBtn.addEventListener('click', toggleFilter);
    if(filterOverlay) filterOverlay.addEventListener('click', toggleFilter);

    // --- Inicializar ---
    fetchProducts();

});