/* ===================================================
   CENTRAL BI
   Proteção das Páginas — sessão validada no servidor
   (usa cache curto de assets/js/sessao.js)
=================================================== */

window.__sessaoCentralBI = centralBiBuscarSessao()
    .then((dados) => {

        if (!dados) {
            window.location.replace("login.html");
            return null;
        }

        return dados;

    })
    .catch((erro) => {

        if (erro && erro.tipoErro === "conexao") {
            centralBiMostrarErroConexao();
        } else {
            window.location.replace("login.html");
        }

        return null;

    });
