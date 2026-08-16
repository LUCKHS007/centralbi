/* ==========================================
   LOGIN
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const formCodigo = document.getElementById("formCodigo2fa");
    const erroLogin = document.getElementById("erroLogin");
    const botaoVoltar = document.getElementById("botaoVoltarLogin");

    let tokenPendente = null;

    function redirecionarParaHome(){

        document.querySelector(".login-container").classList.add("saindo");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 450);

    }

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const usuarioDigitado =
            document.getElementById("usuario").value.trim();

        const senhaDigitada =
            document.getElementById("senha").value;

        erroLogin.innerHTML = "";

        const botao = form.querySelector(".btn-login");
        const conteudoOriginal = botao.innerHTML;

        botao.disabled = true;
        botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';

        try {

            const resposta = await fetch("/.netlify/functions/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: usuarioDigitado, senha: senhaDigitada }),
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                erroLogin.innerHTML = "Usuário ou senha inválidos.";
                botao.disabled = false;
                botao.innerHTML = conteudoOriginal;
                return;
            }

            if (dados.precisaCodigo){

                tokenPendente = dados.tokenPendente;
                form.hidden = true;
                formCodigo.hidden = false;
                document.getElementById("codigo2fa").focus();
                botao.disabled = false;
                botao.innerHTML = conteudoOriginal;
                return;

            }

            redirecionarParaHome();
            return;

        } catch {

            erroLogin.innerHTML = "Não foi possível conectar. Tente novamente.";
            botao.disabled = false;
            botao.innerHTML = conteudoOriginal;

        }

    });

    formCodigo.addEventListener("submit", async function (e) {

        e.preventDefault();

        const codigo = document.getElementById("codigo2fa").value.trim();

        erroLogin.innerHTML = "";

        const botao = formCodigo.querySelector(".btn-login");
        const conteudoOriginal = botao.innerHTML;

        botao.disabled = true;
        botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirmando...';

        try {

            const resposta = await fetch("/.netlify/functions/login-verificar-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenPendente, codigo }),
            });

            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}));
                erroLogin.innerHTML = dados.erro || "Código inválido.";
                botao.disabled = false;
                botao.innerHTML = conteudoOriginal;
                return;
            }

            redirecionarParaHome();

        } catch {

            erroLogin.innerHTML = "Não foi possível conectar. Tente novamente.";
            botao.disabled = false;
            botao.innerHTML = conteudoOriginal;

        }

    });

    botaoVoltar.addEventListener("click", () => {

        formCodigo.hidden = true;
        form.hidden = false;
        erroLogin.innerHTML = "";
        document.getElementById("codigo2fa").value = "";
        tokenPendente = null;

    });

});
