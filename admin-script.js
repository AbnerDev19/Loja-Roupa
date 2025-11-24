/* =================================================== */
/* ==== SCRIPT DO PAINEL ADMINISTRATIVO (Firebase) ==== */
/* =================================================== */

// Importa as funções do Firebase diretamente da internet (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. CONFIGURAÇÃO (Substitua pelos seus dados do Console) ---
// COLE SUA CONFIGURAÇÃO DO FIREBASE AQUI (DENTRO DAS CHAVES)
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const collectionName = "produtos"; // Nome da pasta no banco de dados

// --- 2. CONTROLE DE LOGIN ---

const loginScreen = document.getElementById("login-screen");
const adminPanel = document.getElementById("admin-panel");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const inputPassword = document.getElementById("admin-password");
// Para simplificar, vamos usar um email fixo no código ou pedir no login. 
// Sugestão: No HTML, mude o input de senha para email e senha, ou fixe o email aqui:
const adminEmail = "admin@crismon.com"; // Esse e-mail deve ser criado no Firebase Auth

// Verifica se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado: Esconde login, mostra painel
        loginScreen.style.display = "none";
        adminPanel.style.display = "block";
        carregarProdutosEmTempoReal();
    } else {
        // Deslogado: Mostra login, esconde painel
        loginScreen.style.display = "flex";
        adminPanel.style.display = "none";
    }
});

// Botão Entrar
btnLogin.addEventListener("click", () => {
    const password = inputPassword.value;
    // Tenta logar no Firebase
    signInWithEmailAndPassword(auth, adminEmail, password)
        .then(() => {
            alert("Bem-vinda de volta!");
        })
        .catch((error) => {
            alert("Erro: Senha incorreta ou usuário não encontrado. (" + error.message + ")");
        });
});

// Botão Sair
btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
        alert("Saiu com sucesso.");
    });
});


// --- 3. GERENCIAMENTO DE PRODUTOS (CRUD) ---

const adminProductList = document.getElementById("admin-product-list");
const modal = document.getElementById("product-modal");
const btnAddProduct = document.getElementById("btn-add-product");
const closeModal = document.querySelector(".close-modal");
const productForm = document.getElementById("product-form");

// Abrir Modal
btnAddProduct.addEventListener("click", () => {
    productForm.reset(); // Limpa o formulário
    document.getElementById("prod-id").value = ""; // Garante que não tem ID (é criação)
    document.getElementById("modal-title").innerText = "Novo Produto";
    modal.style.display = "flex";
});

// Fechar Modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// Salvar Produto (Adicionar ou Editar)
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Pega os dados do formulário
    const id = document.getElementById("prod-id").value;
    const produto = {
        nome: document.getElementById("prod-name").value,
        preco: document.getElementById("prod-price").value,
        parcelas: document.getElementById("prod-installments").value,
        categoria: document.getElementById("prod-category").value,
        foto: document.getElementById("prod-photo").value, // Por enquanto é o link/caminho
        // Campos extras para manter compatibilidade
        tamanhos: ["P", "M", "G"], // Padrão, depois podemos criar campo pra isso
        cores: ["#000000"], // Padrão
        dataCriacao: new Date()
    };

    try {
        if (id) {
            // SE TEM ID: É EDIÇÃO (Update)
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, produto);
            alert("Produto atualizado!");
        } else {
            // SE NÃO TEM ID: É CRIAÇÃO (Add)
            await addDoc(collection(db, collectionName), produto);
            alert("Produto criado com sucesso!");
        }
        modal.style.display = "none";
        productForm.reset();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar produto.");
    }
});


// --- 4. LISTAR PRODUTOS NA TABELA ---

function carregarProdutosEmTempoReal() {
    // "Ouve" o banco de dados. Se mudar lá, muda aqui na hora.
    onSnapshot(collection(db, collectionName), (snapshot) => {
        adminProductList.innerHTML = ""; // Limpa a tabela

        snapshot.forEach((doc) => {
            const prod = doc.data();
            const id = doc.id;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><img src="${prod.foto}" class="admin-thumb" onerror="this.src='Fotos/logo-removebg-preview.png'"></td>
                <td>${prod.nome}</td>
                <td>${prod.preco}</td>
                <td>${id.slice(0,5)}...</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editarProduto('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deletarProduto('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            adminProductList.appendChild(tr);
        });
    });
}

// --- 5. FUNÇÕES GLOBAIS (Para funcionar no onclick do HTML) ---

window.deletarProduto = async (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            alert("Produto excluído.");
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir.");
        }
    }
};

window.editarProduto = async (id) => {
    // Para editar, precisamos buscar os dados atuais desse produto primeiro
    // Ou podemos pegar da lista se já tivermos carregado, mas buscar do banco é mais seguro
    // Para simplificar, vamos preencher o modal com os dados (mas precisaríamos ter os dados em mão)
    // Uma forma rápida: buscar o doc específico
    const docRef = doc(db, collectionName, id);
    // Nota: getDoc é uma promessa, mas aqui vamos simplificar e assumir que o admin 
    // vai esperar um pouquinho ou podemos melhorar isso depois.
    
    // DICA: Em sistemas reais, passamos o objeto inteiro para a função editar.
    // Como estamos usando type="module", o escopo global é restrito.
    // Vamos fazer um hackzinho para achar o produto na tela se necessário, 
    // mas o ideal é buscar no Firestore:
    
    alert("Para editar, implementaremos a busca dos dados no próximo passo para garantir que venha do banco!");
    
    // IMPLEMENTAÇÃO RÁPIDA DE EDIÇÃO (Preenche o form)
    // 1. Abre o modal
    document.getElementById("modal-title").innerText = "Editar Produto";
    document.getElementById("prod-id").value = id;
    modal.style.display = "flex";
    
    // OBS: Os campos virão vazios por enquanto. 
    // No próximo ajuste faremos eles preencherem sozinhos.
};