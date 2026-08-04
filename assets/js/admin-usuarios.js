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
const senhaGeradaTexto = document.getElementById("senhaGeradaTexto");
const listaHistoricoAcessos = document.getElementById("listaHistoricoAcessos");

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

    const status = document.createElement("span");
    status.className = usuario.ativo ? "status-mini ativo" : "status-mini inativo";
    status.textContent = usuario.ativo ? "Ativo" : "Inativo";
    linha.appendChild(status);

    const acoes = document.createElement("div");
    acoes.className = "acoes-usuario";

    const botaoRedefinir = document.createElement("button");
    botaoRedefinir.type = "button";
    botaoRedefinir.className = "btn-redefinir";
    botaoRedefinir.innerHTML = '<i class="fa-solid fa-rotate"></i> Redefinir senha';
    botaoRedefinir.addEventListener("click", () => redefinirSenhaUsuario(usuario, botaoRedefinir));
    acoes.appendChild(botaoRedefinir);

    const botaoStatus = document.createElement("button");
    botaoStatus.type = "button";
    botaoStatus.className = usuario.ativo ? "btn-status desativar" : "btn-status ativar";
    botaoStatus.innerHTML = usuario.ativo
        ? '<i class="fa-solid fa-user-slash"></i> Desativar'
        : '<i class="fa-solid fa-user-check"></i> Ativar';
    botaoStatus.addEventListener("click", () => alternarStatusUsuario(usuario, botaoStatus));
    acoes.appendChild(botaoStatus);

    linha.appendChild(acoes);

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

async function alternarStatusUsuario(usuario, botao){

    const acao = usuario.ativo ? "desativar" : "ativar";

    const confirmou = window.confirm(
        usuario.ativo
            ? `Desativar ${usuario.nome}?\n\nA sessão dela é encerrada na hora e ela não consegue mais entrar.`
            : `Ativar ${usuario.nome} de novo?`
    );

    if (!confirmou) return;

    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {

        const resposta = await fetch("/.netlify/functions/alternar-status-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarioId: usuario.id }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mensagemNovoUsuario.textContent = dados.erro || `Não foi possível ${acao} o usuário.`;
            mensagemNovoUsuario.className = "erro";
            botao.disabled = false;
            botao.innerHTML = textoOriginal;
            return;
        }

        carregarUsuarios();

    } catch {

        mensagemNovoUsuario.textContent = "Não foi possível conectar. Tente novamente.";
        mensagemNovoUsuario.className = "erro";
        botao.disabled = false;
        botao.innerHTML = textoOriginal;

    }

}

function mostrarSenhaGerada(mensagem, ehErro){

    senhaGeradaTexto.textContent = mensagem;
    senhaGeradaAviso.className = ehErro ? "senha-gerada-aviso erro" : "senha-gerada-aviso";
    senhaGeradaAviso.hidden = false;

}

function copiarSenhaGerada(){

    const botao = document.getElementById("botaoCopiarSenha");
    const textoOriginal = botao.innerHTML;

    navigator.clipboard.writeText(senhaGeradaTexto.textContent).then(() => {

        botao.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { botao.innerHTML = textoOriginal; }, 1500);

    }).catch(() => {});

}

function formatarDataHistorico(isoString){

    const data = new Date(isoString);
    return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

}

async function carregarHistoricoAcessos(){

    listaHistoricoAcessos.innerHTML = '<div class="carregando-usuarios"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</div>';

    try {

        const resposta = await fetch("/.netlify/functions/historico-acessos", { credentials: "same-origin" });
        const dados = await resposta.json();

        if (!resposta.ok){
            listaHistoricoAcessos.innerHTML = `<div class="erro-lista-usuarios">${escaparHtml(dados.erro || "Não foi possível carregar o histórico.")}</div>`;
            return;
        }

        if (dados.acessos.length === 0){
            listaHistoricoAcessos.innerHTML = '<div class="erro-lista-usuarios">Ainda não há acessos registrados.</div>';
            return;
        }

        listaHistoricoAcessos.innerHTML = "";

        dados.acessos.forEach((acesso) => {

            const linha = document.createElement("div");
            linha.className = "linha-historico";

            const nome = document.createElement("span");
            nome.className = "historico-nome";
            nome.textContent = acesso.usuario_nome;
            linha.appendChild(nome);

            const dashboard = document.createElement("span");
            dashboard.className = "historico-dashboard";
            dashboard.textContent = acesso.dashboard_titulo;
            linha.appendChild(dashboard);

            const quando = document.createElement("span");
            quando.className = "historico-quando";
            quando.textContent = formatarDataHistorico(acesso.criado_em);
            linha.appendChild(quando);

            listaHistoricoAcessos.appendChild(linha);

        });

    } catch {

        listaHistoricoAcessos.innerHTML = '<div class="erro-lista-usuarios">Não foi possível conectar. Tente novamente.</div>';

    }

}

function abrirUsuarios(){

    fecharPerfil();
    modalUsuarios.hidden = false;
    senhaGeradaAviso.hidden = true;
    mensagemNovoUsuario.textContent = "";
    formNovoUsuario.reset();

    carregarUsuarios();
    carregarHistoricoAcessos();

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
