/* =================================================== */
/* ==== SCRIPT DE PRODUTO (Firebase Integrado) ==== */
/* =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

    // 1. Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = "loja.html";
        return;
    }

    // 2. Busca no Firebase
    const docRef = doc(db, "produtos", productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        document.getElementById('pdp-content').innerHTML = `
            <div class="pdp-error-container">
                <h2>Produto não encontrado</h2>
                <p>Este produto pode ter sido removido.</p>
                <a href="loja.html" class="pdp-whatsapp-button">Voltar para a Loja</a>
            </div>
        `;
        return;
    }

    const produto = docSnap.data();
    renderProductPage(productId, produto);
});

// --- Renderização da Página ---
function renderProductPage(id, produto) {
    const container = document.getElementById('pdp-content');
    
    // Prepara imagens
    const fotos = (produto.fotos && produto.fotos.length > 0) ? produto.fotos : [(produto.foto || 'placeholder.jpg')];
    
    // HTML da Galeria
    let thumbnailsHTML = fotos.map((foto, index) => `
        <div class="pdp-thumbnail-img ${index === 0 ? 'active' : ''}" 
             style="background-image: url('${foto}')" 
             onclick="changeMainImage(this, '${foto}')">
        </div>
    `).join('');

    // HTML dos Tamanhos
    let sizesHTML = (produto.tamanhos || []).map(t => 
        `<div class="size-option" onclick="selectSize(this)">${t}</div>`
    ).join('');

    // HTML das Cores
    let colorsHTML = (produto.cores || []).map((cor, i) => {
        const nome = (produto.corNomes && produto.corNomes[i]) ? produto.corNomes[i] : 'Cor';
        return `<div class="color-swatch" style="background-color: ${cor}" title="${nome}" data-name="${nome}" onclick="selectColor(this)"></div>`;
    }).join('');

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
                <div class="pdp-colors">${colorsHTML}</div>
            </div>

            <div class="pdp-options-block">
                <span class="pdp-options-label">Tamanhos:</span>
                <div class="pdp-sizes">${sizesHTML}</div>
            </div>

            <button class="pdp-whatsapp-button" id="add-to-bag-btn" style="background-color:#222; margin-bottom:10px;">
                <i class="fas fa-shopping-bag"></i> Adicionar à Sacola
            </button>

            <button class="pdp-whatsapp-button" id="whatsapp-order-btn">
                <i class="fab fa-whatsapp"></i> Pedir no WhatsApp
            </button>
        </div>
    `;

    // --- Lógica de Seleção e Botões ---
    let selectedSize = null;
    let selectedColor = null;

    // Funções globais para o onclick HTML funcionar dentro do módulo
    window.changeMainImage = (el, src) => {
        document.querySelectorAll('.pdp-thumbnail-img').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('pdp-main-img').src = src;
    };

    window.selectSize = (el) => {
        document.querySelectorAll('.size-option').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        selectedSize = el.innerText;
    };

    window.selectColor = (el) => {
        document.querySelectorAll('.color-swatch').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        selectedColor = el.dataset.name;
    };

    // Adicionar à Sacola
    document.getElementById('add-to-bag-btn').addEventListener('click', () => {
        if(!selectedSize && (produto.tamanhos && produto.tamanhos.length > 0)) {
            alert("Por favor, selecione um tamanho."); return;
        }
        if(!selectedColor && (produto.cores && produto.cores.length > 0)) {
            alert("Por favor, selecione uma cor."); return;
        }

        const item = {
            id: id,
            nome: produto.nome,
            preco: produto.preco,
            foto: fotos[0],
            tamanho: selectedSize || 'Único',
            cor: selectedColor || 'Única'
        };

        if(window.addToBag) {
            window.addToBag(item); // Função do bag-script.js
        } else {
            console.error("Função addToBag não encontrada.");
        }
    });

    // Pedir no WhatsApp
    document.getElementById('whatsapp-order-btn').addEventListener('click', () => {
        const num = "5561994134559";
        let msg = `Olá! Gostaria de pedir: *${produto.nome}*`;
        if(selectedSize) msg += `\nTamanho: ${selectedSize}`;
        if(selectedColor) msg += `\nCor: ${selectedColor}`;
        
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    });
}