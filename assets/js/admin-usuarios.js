/* ==========================================================
   Gerenciar usuários (restrito à conta admin.net)
========================================================== */

// Só a conta admin.net gerencia usuários — não o cargo Administrador
// em geral, pra evitar que outra conta acabe assumindo esse controle.
const LOGIN_ADMIN_UNICO = "admin.net";

const modalUsuarios = document.getElementById("modalUsuarios");
const listaUsuarios = document.getElementById("listaUsuarios");
const formNovoUsuario = document.getElementById("formNovoUsuario");
const mensagemNovoUsuario = document.getElementById("mensagemNovoUsuario");
const senhaGeradaAviso = document.getElementById("senhaGeradaAviso");

window.__sessaoCentralBI.then((sessao) => {

    if (!sessao || sessao.usuario !== LOGIN_ADMIN_UNICO) return;

    const botao = document.getElementById("botaoGerenciarUsuarios");
    const divisor = document.getElementById("divisorAdmin");

    if (botao) botao.hidden = false;
    if (divisor) divisor.hidden = false;

});

function obterIniciaisUsuario(nome){

    if (!nome) return "";

    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] || "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";

    return (primeira + ultima).toUpperCase();

}

function renderizarLinhaUsuario(usuario){

    const linha = document.createElement("div");
    linha.className = "linha-usuario";

    const avatar = document.createElement("span");
    avatar.className = "avatar-mini";
    avatar.textContent = obterIniciaisUsuario(usuario.nome);
    linha.appendChild(avatar);

    const info = document.createElement("div");
    info.className = "info";

    const nome = document.createElement("span");
    nome.className = "nome";
    nome.textContent = usuario.nome;
    info.appendChild(nome);

    const login = document.createElement("span");
    login.className = "login";
    login.textContent = usuario.usuario;
    info.appendChild(login);

    linha.appendChild(info);

    const cargo = document.createElement("span");
    cargo.className = "cargo-mini";
    cargo.textContent = usuario.cargo;
    linha.appendChild(cargo);

    const botaoRedefinir = document.createElement("button");
    botaoRedefinir.type = "button";
    botaoRedefinir.className = "btn-redefinir";
    botaoRedefinir.innerHTML = '<i class="fa-solid fa-rotate"></i> Redefinir senha';
    botaoRedefinir.addEventListener("click", () => redefinirSenhaUsuario(usuario, botaoRedefinir));
    linha.appendChild(botaoRedefinir);

    return linha;

}

async function carregarUsuarios(){

    listaUsuarios.innerHTML = '<div class="carregando-usuarios"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</div>';

    try {

        const resposta = await fetch("/.netlify/functions/usuarios", { credentials: "same-origin" });
        const dados = await resposta.json();

        if (!resposta.ok){
            listaUsuarios.innerHTML = `<div class="erro-lista-usuarios">${escaparHtml(dados.erro || "Não foi possível carregar os usuários.")}</div>`;
            return;
        }

        listaUsuarios.innerHTML = "";
        dados.usuarios.forEach((usuario) => {
            listaUsuarios.appendChild(renderizarLinhaUsuario(usuario));
        });

    } catch {

        listaUsuarios.innerHTML = '<div class="erro-lista-usuarios">Não foi possível conectar. Tente novamente.</div>';

    }

}

function escaparHtml(texto){

    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;

}

async function redefinirSenhaUsuario(usuario, botao){

    const confirmou = window.confirm(
        `Redefinir a senha de ${usuario.nome}?\n\nA senha atual dela deixará de funcionar imediatamente.`
    );

    if (!confirmou) return;

    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {

        const resposta = await fetch("/.netlify/functions/redefinir-senha-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarioId: usuario.id }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mostrarSenhaGerada(dados.erro || "Não foi possível redefinir a senha.", true);
            return;
        }

        mostrarSenhaGerada(`Nova senha de ${usuario.nome}: ${dados.senha}`, false);

    } catch {

        mostrarSenhaGerada("Não foi possível conectar. Tente novamente.", true);

    } finally {

        botao.disabled = false;
        botao.innerHTML = textoOriginal;

    }

}

function mostrarSenhaGerada(mensagem, ehErro){

    senhaGeradaAviso.textContent = mensagem;
    senhaGeradaAviso.className = ehErro ? "senha-gerada-aviso erro" : "senha-gerada-aviso";
    senhaGeradaAviso.hidden = false;

}

function abrirUsuarios(){

    fecharPerfil();
    modalUsuarios.hidden = false;
    senhaGeradaAviso.hidden = true;
    mensagemNovoUsuario.textContent = "";
    formNovoUsuario.reset();

    carregarUsuarios();

}

function fecharUsuarios(){

    modalUsuarios.hidden = true;

}

modalUsuarios.addEventListener("click", (e) => {

    if (e.target === modalUsuarios) fecharUsuarios();

});

formNovoUsuario.addEventListener("submit", async (e) => {

    e.preventDefault();

    mensagemNovoUsuario.textContent = "";
    mensagemNovoUsuario.className = "";
    senhaGeradaAviso.hidden = true;

    const nome = document.getElementById("novoUsuarioNome").value.trim();
    const usuario = document.getElementById("novoUsuarioLogin").value.trim();
    const cargo = document.getElementById("novoUsuarioCargo").value;
    const senha = document.getElementById("novoUsuarioSenha").value;

    try {

        const resposta = await fetch("/.netlify/functions/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, usuario, cargo, senha: senha || undefined }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mensagemNovoUsuario.textContent = dados.erro || "Não foi possível criar o usuário.";
            mensagemNovoUsuario.className = "erro";
            return;
        }

        mensagemNovoUsuario.textContent = `Usuário ${dados.usuario.nome} criado.`;
        mensagemNovoUsuario.className = "sucesso";
        mostrarSenhaGerada(`Senha de ${dados.usuario.nome}: ${dados.senha} (guarde agora, ela não aparece de novo)`, false);

        formNovoUsuario.reset();
        carregarUsuarios();

    } catch {

        mensagemNovoUsuario.textContent = "Não foi possível conectar. Tente novamente.";
        mensagemNovoUsuario.className = "erro";

    }

});
