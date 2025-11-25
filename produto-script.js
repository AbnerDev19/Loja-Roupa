/* =================================================== */
/* ==== SCRIPT DE PRODUTO (Refatorado e Corrigido) ==== */
/* =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração Firebase (igual aos outros arquivos)
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
    const loadingEl = document.getElementById('pdp-loading');
    const contentEl = document.getElementById('pdp-content');

    // 1. Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        alert("Produto não especificado.");
        window.location.href = "loja.html";
        return;
    }

    try {
        // 2. Busca no Firebase
        const docRef = doc(db, "produtos", productId);
        const docSnap = await getDoc(docRef);

        loadingEl.style.display = 'none';

        if (docSnap.exists()) {
            const produto = docSnap.data();
            renderProductPage(productId, produto);
            contentEl.style.display = 'flex';
        } else {
            contentEl.style.display = 'block';
            contentEl.innerHTML = `
                <div style="text-align:center; padding:3rem;">
                    <h2>Produto não encontrado</h2>
                    <p>Talvez ele tenha sido removido.</p>
                    <a href="loja.html" class="pdp-btn pdp-btn-bag" style="width:200px; margin: 2rem auto;">Voltar para Loja</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("Erro ao carregar produto:", error);
        loadingEl.innerHTML = "<p>Erro ao carregar. Tente novamente.</p>";
    }
});

function renderProductPage(id, produto) {
    const container = document.getElementById('pdp-content');
    
    // Garante arrays válidos
    const fotos = (produto.fotos && produto.fotos.length > 0) ? produto.fotos : [(produto.foto || 'Fotos/placeholder.jpg')];
    const tamanhos = produto.tamanhos || [];
    const cores = produto.cores || [];
    const corNomes = produto.corNomes || [];

    // HTML da Galeria
    const thumbnailsHTML = fotos.map((foto, index) => `
        <div class="pdp-thumbnail-img ${index === 0 ? 'active' : ''}" 
             data-src="${foto}">
             <img src="${foto}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
        </div>
    `).join('');

    // HTML dos Tamanhos
    let sizesHTML = '';
    if(tamanhos.length > 0) {
        sizesHTML = tamanhos.map(t => `<div class="pdp-size-option" data-value="${t}">${t}</div>`).join('');
    } else {
        sizesHTML = '<p style="color:#666; font-size:0.9rem;">Tamanho Único</p>';
    }

    // HTML das Cores
    let colorsHTML = '';
    if(cores.length > 0) {
        colorsHTML = cores.map((cor, i) => {
            const nome = corNomes[i] || 'Cor';
            return `<div class="pdp-color-swatch" style="background-color: ${cor}" title="${nome}" data-name="${nome}"></div>`;
        }).join('');
    } else {
        colorsHTML = '<p style="color:#666; font-size:0.9rem;">Cor Única</p>';
    }

    // Monta o Layout
    container.innerHTML = `
        <div class="pdp-gallery-column">
            <div class="pdp-gallery-thumbnails">${thumbnailsHTML}</div>
            <div class="pdp-gallery-main-wrapper">
                <img src="${fotos[0]}" id="pdp-main-img" alt="${produto.nome}">
            </div>
        </div>

        <div class="pdp-info-column">
            <span class="pdp-cod">Cód. ${id.substring(0, 6).toUpperCase()}</span>
            <h1 class="pdp-title">${produto.nome}</h1>
            
            <div class="pdp-price-block">
                <span class="pdp-price">${produto.preco}</span>
                <span class="pdp-installments">${produto.parcelas || ''}</span>
            </div>

            <div class="pdp-options-block">
                <span class="pdp-options-label">Cores:</span>
                <div class="pdp-colors" id="color-options">${colorsHTML}</div>
            </div>

            <div class="pdp-options-block">
                <span class="pdp-options-label">Tamanhos:</span>
                <div class="pdp-sizes" id="size-options">${sizesHTML}</div>
            </div>

            <div class="pdp-action-buttons">
                <button class="pdp-btn pdp-btn-bag" id="btn-add-sacola">
                    <i class="fas fa-shopping-bag"></i> Adicionar à Sacola
                </button>
                
                <button class="pdp-btn pdp-btn-whatsapp" id="btn-whatsapp-direto">
                    <i class="fab fa-whatsapp"></i> Pedir no WhatsApp
                </button>
            </div>
        </div>
    `;

    // --- Lógica de Eventos (Agora segura e encapsulada) ---
    
    // 1. Galeria de Imagens
    const mainImg = document.getElementById('pdp-main-img');
    const thumbs = container.querySelectorAll('.pdp-thumbnail-img');
    
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Remove active de todos
            thumbs.forEach(t => t.classList.remove('active'));
            // Adiciona no clicado
            this.classList.add('active');
            // Troca imagem principal
            mainImg.src = this.dataset.src;
        });
    });

    // 2. Seleção de Tamanho
    let selectedSize = (tamanhos.length === 0) ? 'Único' : null;
    const sizeOpts = container.querySelectorAll('.pdp-size-option');
    
    sizeOpts.forEach(opt => {
        opt.addEventListener('click', function() {
            sizeOpts.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            selectedSize = this.dataset.value;
        });
    });

    // 3. Seleção de Cor
    let selectedColor = (cores.length === 0) ? 'Única' : null;
    const colorOpts = container.querySelectorAll('.pdp-color-swatch');
    
    colorOpts.forEach(opt => {
        opt.addEventListener('click', function() {
            colorOpts.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedColor = this.dataset.name;
        });
    });

    // 4. Botão Adicionar à Sacola
    document.getElementById('btn-add-sacola').addEventListener('click', () => {
        if(!selectedSize && tamanhos.length > 0) {
            alert("Por favor, selecione um tamanho.");
            return;
        }
        if(!selectedColor && cores.length > 0) {
            alert("Por favor, selecione uma cor.");
            return;
        }

        const itemParaSacola = {
            id: id,
            nome: produto.nome,
            preco: produto.preco,
            foto: fotos[0],
            tamanho: selectedSize,
            cor: selectedColor
        };

        // Chama a função global do bag-script.js
        if(window.addToBag) {
            window.addToBag(itemParaSacola);
            // Abre a sidebar da sacola visualmente para confirmar
            const bagBtn = document.getElementById('bag-icon-button');
            if(bagBtn) bagBtn.click();
        } else {
            console.error("Função addToBag não encontrada. Verifique se bag-script.js foi carregado.");
            alert("Erro ao adicionar à sacola.");
        }
    });

    // 5. Botão WhatsApp Direto
    document.getElementById('btn-whatsapp-direto').addEventListener('click', () => {
        const num = "5561994134559"; // Número da dona
        let msg = `Olá! Gostaria de encomendar o produto:\n\n*${produto.nome}*\n`;
        
        if(selectedSize) msg += `Tamanho: ${selectedSize}\n`;
        else if(tamanhos.length > 0) msg += `(Não selecionei tamanho ainda)\n`;
        
        if(selectedColor) msg += `Cor: ${selectedColor}\n`;
        else if(cores.length > 0) msg += `(Não selecionei cor ainda)\n`;
        
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    });
}