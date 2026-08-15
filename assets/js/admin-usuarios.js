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

    const card = document.createElement("div");
    card.className = "card-usuario";

    const linha = document.createElement("button");
    linha.type = "button";
    linha.className = "linha-usuario";
    linha.setAttribute("aria-expanded", "false");

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

    const setaExpandir = document.createElement("i");
    setaExpandir.className = "fa-solid fa-chevron-down seta-expandir";
    linha.appendChild(setaExpandir);

    const detalhe = montarDetalheUsuario(usuario);

    linha.addEventListener("click", () => {

        const abrindo = detalhe.hidden;
        detalhe.hidden = !abrindo;
        linha.setAttribute("aria-expanded", String(abrindo));
        card.classList.toggle("expandido", abrindo);

    });

    card.appendChild(linha);
    card.appendChild(detalhe);

    return card;

}

function montarDetalheUsuario(usuario){

    const detalhe = document.createElement("div");
    detalhe.className = "detalhe-usuario";
    detalhe.hidden = true;

    const grade = document.createElement("div");
    grade.className = "detalhe-grade";
    grade.innerHTML = `
        <div><span>Nome completo</span><strong>${escaparHtml(usuario.nome)}</strong></div>
        <div><span>Usuário de login</span><strong>${escaparHtml(usuario.usuario)}</strong></div>
        <div><span>Cargo</span><strong>${escaparHtml(usuario.cargo)}</strong></div>
        <div><span>Status</span><strong>${usuario.ativo ? "Ativo" : "Inativo"}</strong></div>
    `;
    detalhe.appendChild(grade);

    const avisoSenha = document.createElement("p");
    avisoSenha.className = "detalhe-aviso-senha";
    avisoSenha.innerHTML = '<i class="fa-solid fa-lock"></i> A senha atual não pode ser exibida (fica salva de forma criptografada). Você pode definir uma nova abaixo.';
    detalhe.appendChild(avisoSenha);

    const formSenha = document.createElement("form");
    formSenha.className = "form-nova-senha";

    const grupoInput = document.createElement("div");
    grupoInput.className = "input-group-senha";

    const inputSenha = document.createElement("input");
    inputSenha.type = "password";
    inputSenha.placeholder = "Nova senha (mín. 6 caracteres)";
    inputSenha.minLength = 6;
    inputSenha.autocomplete = "new-password";
    grupoInput.appendChild(inputSenha);

    const botaoMostrar = document.createElement("button");
    botaoMostrar.type = "button";
    botaoMostrar.className = "botao-mostrar-senha-inline";
    botaoMostrar.innerHTML = '<i class="fa-solid fa-eye"></i>';
    botaoMostrar.addEventListener("click", () => {
        const mostrando = inputSenha.type === "text";
        inputSenha.type = mostrando ? "password" : "text";
        botaoMostrar.innerHTML = mostrando ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    });
    grupoInput.appendChild(botaoMostrar);

    formSenha.appendChild(grupoInput);

    const linhaBotoesSenha = document.createElement("div");
    linhaBotoesSenha.className = "linha-botoes-senha";

    const botaoSalvarSenha = document.createElement("button");
    botaoSalvarSenha.type = "submit";
    botaoSalvarSenha.className = "btn-salvar-senha";
    botaoSalvarSenha.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar senha';
    linhaBotoesSenha.appendChild(botaoSalvarSenha);

    const botaoAleatoria = document.createElement("button");
    botaoAleatoria.type = "button";
    botaoAleatoria.className = "btn-redefinir";
    botaoAleatoria.innerHTML = '<i class="fa-solid fa-shuffle"></i> Gerar aleatória';
    botaoAleatoria.addEventListener("click", () => redefinirSenhaUsuario(usuario, botaoAleatoria));
    linhaBotoesSenha.appendChild(botaoAleatoria);

    formSenha.appendChild(linhaBotoesSenha);

    const mensagemSenhaDetalhe = document.createElement("p");
    mensagemSenhaDetalhe.className = "mensagem-senha-detalhe";
    formSenha.appendChild(mensagemSenhaDetalhe);

    formSenha.addEventListener("submit", (e) => {
        e.preventDefault();
        definirSenhaCustomizada(usuario, inputSenha, botaoSalvarSenha, mensagemSenhaDetalhe);
    });

    detalhe.appendChild(formSenha);

    const botaoStatus = document.createElement("button");
    botaoStatus.type = "button";
    botaoStatus.className = usuario.ativo ? "btn-status desativar" : "btn-status ativar";
    botaoStatus.innerHTML = usuario.ativo
        ? '<i class="fa-solid fa-user-slash"></i> Desativar usuário'
        : '<i class="fa-solid fa-user-check"></i> Ativar usuário';
    botaoStatus.addEventListener("click", () => alternarStatusUsuario(usuario, botaoStatus));
    detalhe.appendChild(botaoStatus);

    return detalhe;

}

async function definirSenhaCustomizada(usuario, inputSenha, botao, mensagemEl){

    const novaSenha = inputSenha.value;

    if (novaSenha.length < 6){
        mensagemEl.textContent = "A senha precisa ter pelo menos 6 caracteres.";
        mensagemEl.className = "mensagem-senha-detalhe erro";
        return;
    }

    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    mensagemEl.textContent = "";

    try {

        const resposta = await fetch("/.netlify/functions/redefinir-senha-usuario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarioId: usuario.id, novaSenha }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mensagemEl.textContent = dados.erro || "Não foi possível salvar a senha.";
            mensagemEl.className = "mensagem-senha-detalhe erro";
            return;
        }

        mensagemEl.textContent = `Senha de ${usuario.nome} atualizada.`;
        mensagemEl.className = "mensagem-senha-detalhe sucesso";
        inputSenha.value = "";

    } catch {

        mensagemEl.textContent = "Não foi possível conectar. Tente novamente.";
        mensagemEl.className = "mensagem-senha-detalhe erro";

    } finally {

        botao.disabled = false;
        botao.innerHTML = textoOriginal;

    }

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

function abrirUsuarios(){

    fecharPerfil();
    modalUsuarios.hidden = false;
    document.body.classList.add("modal-aberto");
    senhaGeradaAviso.hidden = true;
    mensagemNovoUsuario.textContent = "";
    formNovoUsuario.reset();

    carregarUsuarios();

}

function fecharUsuarios(){

    modalUsuarios.hidden = true;
    if (modalPerfil.hidden && modalHistorico.hidden) document.body.classList.remove("modal-aberto");

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
