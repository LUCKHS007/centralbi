/* ==========================================================
   Perfil do usuário / troca de senha
========================================================== */

const modalPerfil = document.getElementById("modalPerfil");
const formSenha = document.getElementById("formSenha");
const mensagemSenha = document.getElementById("mensagemSenha");

async function abrirPerfil(){

    mensagemSenha.textContent = "";
    formSenha.reset();

    document.getElementById("perfilNome").textContent = "Carregando...";
    document.getElementById("perfilCargo").textContent = "Carregando...";

    modalPerfil.hidden = false;

    try {

        const resposta = await fetch("/.netlify/functions/me", { credentials: "same-origin" });

        if (!resposta.ok){
            window.location.replace("login.html");
            return;
        }

        const sessao = await resposta.json();

        document.getElementById("perfilNome").textContent = sessao.nome;
        document.getElementById("perfilCargo").textContent = sessao.cargo;

    } catch {

        document.getElementById("perfilNome").textContent = "-";
        document.getElementById("perfilCargo").textContent = "-";

    }

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
