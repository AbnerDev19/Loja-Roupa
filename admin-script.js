/* =================================================== */
/* ==== SCRIPT DO PAINEL ADMINISTRATIVO (Firebase) ==== */
/* =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. SUAS CHAVES REAIS DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCxznTW2u5DMawvTratTuZ-bFpQoDb4XlQ",
  authDomain: "crismon-modas.firebaseapp.com",
  projectId: "crismon-modas",
  storageBucket: "crismon-modas.firebasestorage.app",
  messagingSenderId: "595669038570",
  appId: "1:595669038570:web:2b42fba0e7e6fe7bb8ae93",
  measurementId: "G-KFWZBJZ4SX"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const collectionName = "produtos"; 

// --- 2. SISTEMA DE LOGIN ---
const loginScreen = document.getElementById("login-screen");
const adminPanel = document.getElementById("admin-panel");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");

// Verifica se já está logado ao abrir a página
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = "none";
        adminPanel.style.display = "block";
        carregarProdutos();
    } else {
        loginScreen.style.display = "flex";
        adminPanel.style.display = "none";
    }
});

// Botão Entrar
if(btnLogin) {
    btnLogin.addEventListener("click", () => {
        const email = emailInput.value;
        const senha = passwordInput.value;
        
        signInWithEmailAndPassword(auth, email, senha)
            .then(() => {
                // O onAuthStateChanged vai cuidar de mudar a tela
            })
            .catch((error) => {
                alert("Erro ao entrar: " + error.message);
            });
    });
}

// Botão Sair
if(btnLogout) {
    btnLogout.addEventListener("click", () => {
        signOut(auth).then(() => alert("Saiu com sucesso."));
    });
}

// --- 3. GERENCIAR PRODUTOS ---
const modal = document.getElementById("product-modal");
const productForm = document.getElementById("product-form");
const btnAdd = document.getElementById("btn-add-product");
const btnClose = document.querySelector(".close-modal");

// Abrir Modal
if(btnAdd) {
    btnAdd.addEventListener("click", () => {
        productForm.reset();
        document.getElementById("prod-id").value = "";
        document.getElementById("modal-title").innerText = "Novo Produto";
        modal.style.display = "flex";
    });
}

// Fechar Modal
if(btnClose) {
    btnClose.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// Salvar (Adicionar ou Editar)
if(productForm) {
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const id = document.getElementById("prod-id").value;
        const dadosProduto = {
            nome: document.getElementById("prod-name").value,
            preco: document.getElementById("prod-price").value,
            parcelas: document.getElementById("prod-installments").value,
            categoria: document.getElementById("prod-category").value,
            foto: document.getElementById("prod-photo").value,
            tamanhos: ["P", "M", "G"], // Padrão
            cores: ["#000000"], // Padrão
            data: new Date()
        };

        try {
            if (id) {
                await updateDoc(doc(db, collectionName, id), dadosProduto);
                alert("Produto atualizado!");
            } else {
                await addDoc(collection(db, collectionName), dadosProduto);
                alert("Produto criado!");
            }
            modal.style.display = "none";
            productForm.reset();
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao salvar: " + error.message);
        }
    });
}

// --- 4. CARREGAR LISTA ---
function carregarProdutos() {
    const lista = document.getElementById("admin-product-list");
    
    // Fica ouvindo mudanças no banco em tempo real
    onSnapshot(collection(db, collectionName), (snapshot) => {
        lista.innerHTML = ""; // Limpa lista
        
        snapshot.forEach((doc) => {
            const prod = doc.data();
            const id = doc.id;
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${prod.foto}" class="admin-thumb" onerror="this.style.display='none'"></td>
                <td>${prod.nome}</td>
                <td>${prod.preco}</td>
                <td>${prod.categoria}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="window.editar('${id}', '${prod.nome}', '${prod.preco}', '${prod.parcelas}', '${prod.categoria}', '${prod.foto}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deletar('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            lista.appendChild(row);
        });
    });
}

// Funções globais para os botões da tabela
window.deletar = async (id) => {
    if(confirm("Tem certeza que deseja excluir?")) {
        await deleteDoc(doc(db, collectionName, id));
    }
};

window.editar = (id, nome, preco, parcelas, cat, foto) => {
    document.getElementById("prod-id").value = id;
    document.getElementById("prod-name").value = nome;
    document.getElementById("prod-price").value = preco;
    document.getElementById("prod-installments").value = parcelas;
    document.getElementById("prod-category").value = cat;
    document.getElementById("prod-photo").value = foto;
    document.getElementById("modal-title").innerText = "Editar Produto";
    modal.style.display = "flex";
};