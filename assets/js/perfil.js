/* ==========================================================
   Perfil do usuário / troca de senha
========================================================== */

const modalPerfil = document.getElementById("modalPerfil");
const formSenha = document.getElementById("formSenha");
const mensagemSenha = document.getElementById("mensagemSenha");

async function abrirPerfil(){

    const sessao = await window.__sessaoCentralBI;
    if (!sessao) return;

    document.getElementById("perfilNome").textContent = sessao.nome;
    document.getElementById("perfilCargo").textContent = sessao.cargo;

    mensagemSenha.textContent = "";
    formSenha.reset();

    modalPerfil.hidden = false;

}

function fecharPerfil(){

    modalPerfil.hidden = true;

}

modalPerfil.addEventListener("click", (e) => {

    if (e.target === modalPerfil) fecharPerfil();

});

formSenha.addEventListener("submit", async (e) => {

    e.preventDefault();

    mensagemSenha.textContent = "";
    mensagemSenha.className = "";

    const senhaAtual = document.getElementById("senhaAtual").value;
    const senhaNova = document.getElementById("senhaNova").value;
    const senhaNovaConfirma = document.getElementById("senhaNovaConfirma").value;

    if (senhaNova !== senhaNovaConfirma){
        mensagemSenha.textContent = "A confirmação não confere com a nova senha.";
        mensagemSenha.className = "erro";
        return;
    }

    try {

        const resposta = await fetch("/.netlify/functions/alterar-senha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senhaAtual, senhaNova }),
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mensagemSenha.textContent = dados.erro || "Não foi possível trocar a senha.";
            mensagemSenha.className = "erro";
            return;
        }

        mensagemSenha.textContent = "Senha alterada com sucesso!";
        mensagemSenha.className = "sucesso";
        formSenha.reset();

    } catch {

        mensagemSenha.textContent = "Não foi possível conectar. Tente novamente.";
        mensagemSenha.className = "erro";

    }

});
