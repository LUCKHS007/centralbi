/* ==========================================
   LOGIN
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const usuarioDigitado =
            document.getElementById("usuario").value.trim();

        const senhaDigitada =
            document.getElementById("senha").value;

        const erroLogin = document.getElementById("erroLogin");
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

            if (!resposta.ok) {
                erroLogin.innerHTML = "Usuário ou senha inválidos.";
                botao.disabled = false;
                botao.innerHTML = conteudoOriginal;
                return;
            }

            document.querySelector(".login-container").classList.add("saindo");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 450);

            return;

        } catch {

            erroLogin.innerHTML = "Não foi possível conectar. Tente novamente.";
            botao.disabled = false;
            botao.innerHTML = conteudoOriginal;

        }

    });

});
