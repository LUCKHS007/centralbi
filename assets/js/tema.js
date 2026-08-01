/* ==========================================
   CENTRAL BI
   Pedreira Sargon
   Seletor de Tema (Claro, Escuro, Azul
   Corporativo, Verde Ambiental, Amarelo
   Power BI)
========================================== */

(function(){

    const temaSalvo = localStorage.getItem("tema") || "claro";

    document.documentElement.setAttribute("data-tema", temaSalvo);

})();

const TEMAS = [
    { valor: "claro", emoji: "⚪" },
    { valor: "escuro", emoji: "🌙" },
    { valor: "azul", emoji: "🔵" },
    { valor: "verde", emoji: "🟢" },
    { valor: "amarelo", emoji: "🟡" }
];

function selecionarTema(nomeTema){

    document.documentElement.setAttribute("data-tema", nomeTema);

    localStorage.setItem("tema", nomeTema);

    atualizarSeletorTema();

    fecharMenuTema();

    fetch("/.netlify/functions/tema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: nomeTema }),
        credentials: "same-origin",
    }).catch(() => {
        // sem internet/servidor fora do ar: tema já está salvo local,
        // só não sincroniza com a conta até a próxima troca bem-sucedida
    });

}

function alternarMenuTema(){

    const menu = document.getElementById("menuTema");
    const botao = document.getElementById("botaoTema");

    if(!menu || !botao) return;

    if(menu.hasAttribute("hidden")){

        menu.removeAttribute("hidden");
        botao.setAttribute("aria-expanded", "true");

    } else {

        fecharMenuTema();

    }

}

function fecharMenuTema(){

    const menu = document.getElementById("menuTema");
    const botao = document.getElementById("botaoTema");

    if(!menu || !botao) return;

    menu.setAttribute("hidden", "");

    botao.setAttribute("aria-expanded", "false");

}

function atualizarSeletorTema(){

    const temaAtual = document.documentElement.getAttribute("data-tema") || "claro";

    const info = TEMAS.find(t => t.valor === temaAtual) || TEMAS[0];

    const icone = document.getElementById("iconeTema");

    if(icone) icone.textContent = info.emoji;

    document.querySelectorAll(".opcao-tema").forEach(botao => {

        botao.classList.toggle("ativo", botao.dataset.tema === temaAtual);

    });

}

document.addEventListener("DOMContentLoaded", function(){

    atualizarSeletorTema();

    document.addEventListener("click", function(evento){

        const seletor = document.querySelector(".seletor-tema");

        if(seletor && !seletor.contains(evento.target)){

            fecharMenuTema();

        }

    });

    fetch("/.netlify/functions/tema", { credentials: "same-origin" })
        .then(resposta => resposta.ok ? resposta.json() : null)
        .then(dados => {

            if(!dados) return;

            document.documentElement.setAttribute("data-tema", dados.tema);
            localStorage.setItem("tema", dados.tema);
            atualizarSeletorTema();

        })
        .catch(() => {
            // sem conexão: fica com o tema já aplicado do localStorage
        });

});
