/* =================================================== */
/* ==== SCRIPT DO PAINEL ADMINISTRATIVO (Firebase) ==== */
/* =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, onSnapshot, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

if(btnLogin) {
    btnLogin.addEventListener("click", () => {
        const email = emailInput.value;
        const senha = passwordInput.value;
        signInWithEmailAndPassword(auth, email, senha)
            .catch((error) => alert("Erro ao entrar: " + error.message));
    });
}

if(btnLogout) {
    btnLogout.addEventListener("click", () => {
        signOut(auth).then(() => alert("Saiu com sucesso."));
    });
}

// --- 3. GERENCIAR PRODUTOS (CRUD) ---
const modal = document.getElementById("product-modal");
const productForm = document.getElementById("product-form");
const btnAdd = document.getElementById("btn-add-product");
const btnClose = document.querySelector(".close-modal");

// Abrir Modal (Novo)
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
    btnClose.addEventListener("click", () => modal.style.display = "none");
}

// Salvar (Criar ou Editar)
if(productForm) {
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const id = document.getElementById("prod-id").value;
        
        // Helper para transformar string separada por vírgula em array
        const stringToArray = (str) => str.split(',').map(s => s.trim()).filter(s => s !== "");
        // Helper para transformar textarea em array de linhas
        const textToArray = (str) => str.split('\n').map(s => s.trim()).filter(s => s !== "");

        const dadosProduto = {
            nome: document.getElementById("prod-name").value,
            preco: document.getElementById("prod-price").value,
            parcelas: document.getElementById("prod-installments").value,
            categoria: document.getElementById("prod-category").value,
            tamanhos: stringToArray(document.getElementById("prod-sizes").value),
            corNomes: stringToArray(document.getElementById("prod-color-names").value),
            cores: stringToArray(document.getElementById("prod-colors").value),
            fotos: textToArray(document.getElementById("prod-photos").value),
            // Mantemos 'foto' simples para compatibilidade com códigos antigos que esperam string
            foto: textToArray(document.getElementById("prod-photos").value)[0] || "", 
            data_atualizacao: new Date()
        };

        try {
            if (id) {
                await updateDoc(doc(db, collectionName, id), dadosProduto);
                alert("Produto atualizado com sucesso!");
            } else {
                await addDoc(collection(db, collectionName), dadosProduto);
                alert("Produto criado com sucesso!");
            }
            modal.style.display = "none";
            productForm.reset();
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao salvar: " + error.message);
        }
    });
}

// --- 4. CARREGAR LISTA (Realtime) ---
function carregarProdutos() {
    const lista = document.getElementById("admin-product-list");
    
    onSnapshot(collection(db, collectionName), (snapshot) => {
        lista.innerHTML = "";
        
        if(snapshot.empty) {
            lista.innerHTML = "<tr><td colspan='6' style='text-align:center'>Nenhum produto encontrado no banco de dados.</td></tr>";
            return;
        }

        snapshot.forEach((documento) => {
            const prod = documento.data();
            const id = documento.id;
            
            // Garante que existam arrays para evitar erro
            const tamanhosStr = prod.tamanhos ? prod.tamanhos.join(", ") : "";
            const imgCapa = prod.fotos && prod.fotos.length > 0 ? prod.fotos[0] : (prod.foto || "");

            const row = document.createElement("tr");
            row.innerHTML = `
                <td data-label="Foto"><img src="${imgCapa}" class="admin-thumb" onerror="this.style.display='none'"></td>
                <td data-label="Nome"><strong>${prod.nome}</strong></td>
                <td data-label="Preço">${prod.preco}</td>
                <td data-label="Categoria">${prod.categoria || '-'}</td>
                <td data-label="Tamanhos">${tamanhosStr}</td>
                <td data-label="Ações">
                    <button class="action-btn btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deletar('${id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adiciona evento de click no botão editar (para passar o objeto complexo)
            const btnEdit = row.querySelector(".btn-edit");
            btnEdit.addEventListener("click", () => editarProduto(id, prod));

            lista.appendChild(row);
        });
    });
}

// Função Global para Deletar
window.deletar = async (id) => {
    if(confirm("Tem certeza que deseja excluir este produto permanentemente?")) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (e) {
            alert("Erro ao deletar: " + e.message);
        }
    }
};

// Função Interna para Editar
function editarProduto(id, prod) {
    document.getElementById("prod-id").value = id;
    document.getElementById("prod-name").value = prod.nome || "";
    document.getElementById("prod-price").value = prod.preco || "";
    document.getElementById("prod-installments").value = prod.parcelas || "";
    document.getElementById("prod-category").value = prod.categoria || "vestidos";
    
    // Arrays para String
    document.getElementById("prod-sizes").value = prod.tamanhos ? prod.tamanhos.join(", ") : "";
    document.getElementById("prod-color-names").value = prod.corNomes ? prod.corNomes.join(", ") : "";
    document.getElementById("prod-colors").value = prod.cores ? prod.cores.join(", ") : "";
    
    // Fotos (Array para linhas)
    if (prod.fotos && Array.isArray(prod.fotos)) {
        document.getElementById("prod-photos").value = prod.fotos.join("\n");
    } else if (prod.foto) {
        document.getElementById("prod-photos").value = prod.foto;
    } else {
        document.getElementById("prod-photos").value = "";
    }

    document.getElementById("modal-title").innerText = "Editar Produto";
    modal.style.display = "flex";
};


// --- 5. MIGRAÇÃO DE BANCO DE DADOS (Botão Amarelo) ---
const btnMigrate = document.getElementById("btn-migrate");
if (btnMigrate) {
    btnMigrate.addEventListener("click", async () => {
        if (!confirm("ATENÇÃO: Isso vai ler todos os produtos do arquivo 'produtos-db.js' e enviá-los para o Firebase. Deseja continuar?")) return;

        // Verifica se a variável catalogo existe (carregada do produtos-db.js no HTML)
        if (typeof catalogo === 'undefined') {
            alert("Erro: Objeto 'catalogo' não encontrado. Verifique se produtos-db.js foi carregado.");
            return;
        }

        const batch = writeBatch(db);
        let count = 0;

        // Itera sobre o catálogo estático
        for (const [idAntigo, prod] of Object.entries(catalogo)) {
            // Cria uma referência de documento nova (ID automático ou use idAntigo se preferir)
            // Aqui usaremos o idAntigo como ID do documento para manter consistência
            const docRef = doc(db, collectionName, idAntigo);
            
            // Prepara os dados
            const dadosParaSalvar = {
                nome: prod.nome,
                preco: prod.preco,
                parcelas: prod.parcelas,
                // Tenta adivinhar a categoria baseada no nome ou define padrão
                categoria: "destaques", // Você pode melhorar essa lógica depois
                tamanhos: prod.tamanhos || [],
                cores: prod.cores || [],
                corNomes: prod.corNomes || [],
                fotos: prod.fotos || [],
                foto: (prod.fotos && prod.fotos.length > 0) ? prod.fotos[0] : "",
                migrado_em: new Date()
            };

            batch.set(docRef, dadosParaSalvar);
            count++;
        }

        try {
            await batch.commit();
            alert(`Sucesso! ${count} produtos foram migrados para o banco de dados.`);
        } catch (e) {
            console.error(e);
            alert("Erro na migração: " + e.message);
        }
    });
}