/* ==========================================================
   Verificação em duas etapas (TOTP) — opcional, qualquer usuário
   pode ativar pra própria conta
========================================================== */

const secao2fa = document.getElementById("secao2fa");
const statusInativo2fa = document.getElementById("statusInativo2fa");
const statusAtivo2fa = document.getElementById("statusAtivo2fa");
const configuracao2fa = document.getElementById("configuracao2fa");
const qrCode2fa = document.getElementById("qrCode2fa");
const chaveManual2fa = document.getElementById("chaveManual2fa");
const formConfirmar2fa = document.getElementById("formConfirmar2fa");
const mensagem2fa = document.getElementById("mensagem2fa");
const senhaDesativar2fa = document.getElementById("senhaDesativar2fa");

function mostrarMensagem2fa(texto, ehErro){
    mensagem2fa.textContent = texto;
    mensagem2fa.className = ehErro ? "mensagem-2fa erro" : "mensagem-2fa sucesso";
}

function atualizarEstado2fa(ativo){

    statusInativo2fa.hidden = ativo;
    statusAtivo2fa.hidden = !ativo;
    configuracao2fa.hidden = true;

}

async function iniciarConfiguracao2fa(){

    mensagem2fa.textContent = "";

    try {

        const resposta = await fetch("/.netlify/functions/totp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acao: "iniciar" }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mostrarMensagem2fa(dados.erro || "Não foi possível iniciar a configuração.", true);
            return;
        }

        qrCode2fa.src = dados.qrCodeDataUrl;
        chaveManual2fa.textContent = dados.segredo;

        statusInativo2fa.hidden = true;
        configuracao2fa.hidden = false;
        document.getElementById("codigoConfirmar2fa").focus();

    } catch {

        mostrarMensagem2fa("Não foi possível conectar. Tente novamente.", true);

    }

}

function cancelarConfiguracao2fa(){
    configuracao2fa.hidden = true;
    statusInativo2fa.hidden = false;
    mensagem2fa.textContent = "";
}

formConfirmar2fa.addEventListener("submit", async (e) => {

    e.preventDefault();

    const codigo = document.getElementById("codigoConfirmar2fa").value.trim();
    const botao = formConfirmar2fa.querySelector(".btn-login");
    const conteudoOriginal = botao.innerHTML;

    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {

        const resposta = await fetch("/.netlify/functions/totp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acao: "confirmar", codigo }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mostrarMensagem2fa(dados.erro || "Código inválido.", true);
            return;
        }

        atualizarEstado2fa(true);
        mostrarMensagem2fa("Verificação em duas etapas ativada.", false);
        document.getElementById("codigoConfirmar2fa").value = "";

    } catch {

        mostrarMensagem2fa("Não foi possível conectar. Tente novamente.", true);

    } finally {

        botao.disabled = false;
        botao.innerHTML = conteudoOriginal;

    }

});

async function desativar2fa(){

    const senhaAtual = senhaDesativar2fa.value;

    if (!senhaAtual){
        mostrarMensagem2fa("Digite sua senha pra confirmar.", true);
        return;
    }

    const confirmou = window.confirm("Desativar a verificação em duas etapas? Você vai poder entrar só com usuário e senha de novo.");
    if (!confirmou) return;

    try {

        const resposta = await fetch("/.netlify/functions/totp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acao: "desativar", senhaAtual }),
            credentials: "same-origin",
        });

        const dados = await resposta.json();

        if (!resposta.ok){
            mostrarMensagem2fa(dados.erro || "Não foi possível desativar.", true);
            return;
        }

        senhaDesativar2fa.value = "";
        atualizarEstado2fa(false);
        mostrarMensagem2fa("Verificação em duas etapas desativada.", false);

    } catch {

        mostrarMensagem2fa("Não foi possível conectar. Tente novamente.", true);

    }

}

function copiarChave2fa(){

    const botao = document.getElementById("botaoCopiarChave2fa");
    const original = botao.innerHTML;

    navigator.clipboard.writeText(chaveManual2fa.textContent).then(() => {
        botao.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { botao.innerHTML = original; }, 1500);
    }).catch(() => {});

}

document.getElementById("botaoCopiarChave2fa").addEventListener("click", copiarChave2fa);

window.__sessaoCentralBI.then((sessao) => {

    if (!sessao) return;

    secao2fa.hidden = false;
    atualizarEstado2fa(Boolean(sessao.totpAtivo));

});
