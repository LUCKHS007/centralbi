/* ===================================================
   CENTRAL BI
   Proteção das Páginas — sessão validada no servidor
=================================================== */

window.__sessaoCentralBI = fetch("/.netlify/functions/me", { credentials: "same-origin" })
    .then((resposta) => {

        if (!resposta.ok) {
            window.location.replace("login.html");
            return null;
        }

        return resposta.json();

    })
    .catch(() => {

        window.location.replace("login.html");
        return null;

    });
