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

        try {

            const resposta = await fetch("/.netlify/functions/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: usuarioDigitado, senha: senhaDigitada }),
            });

            if (!resposta.ok) {
                erroLogin.innerHTML = "Usuário ou senha inválidos.";
                return;
            }

            window.location.href = "index.html";

        } catch {

            erroLogin.innerHTML = "Não foi possível conectar. Tente novamente.";

        }

    });

});
