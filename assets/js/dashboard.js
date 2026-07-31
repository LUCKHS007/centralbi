/* ==========================================================
   Renderização dos Dashboards e Acessos Rápidos
   (dados vêm de /.netlify/functions/me, já filtrados por cargo)
========================================================== */

const painel = document.getElementById("painelBI");
const painelLinks = document.getElementById("painelLinks");

function renderizarDashboards(lista){

    painel.innerHTML = "";

    lista.forEach(item=>{

        painel.innerHTML += `

        <a
            href="${item.link}"
            target="_blank"
            class="card-bi"
            data-categoria="${item.categoria}">

            <i class="fa-solid ${item.icone}"></i>

            <h3>${item.titulo}</h3>

            <p>${item.descricao}</p>

            <span class="abrir">

                Abrir Dashboard

                <i class="fa-solid fa-arrow-right"></i>

            </span>

        </a>

        `;

    });

}

function renderizarLinks(lista){

    painelLinks.innerHTML = "";

    lista.forEach(item=>{

        painelLinks.innerHTML += `

        <a
            href="${item.url || '#'}"
            target="_blank"
            class="card-bi">

            <i class="fa-solid ${item.icone}"></i>

            <h3>${item.titulo}</h3>

            <p>${item.descricao}</p>

            <span class="abrir">

                Acessar

                <i class="fa-solid fa-arrow-right"></i>

            </span>

        </a>

        `;

    });

}

window.__sessaoCentralBI.then((sessao) => {

    if (!sessao) return;

    renderizarDashboards(sessao.dashboards);
    renderizarLinks(sessao.linksExternos);

    document.getElementById("totalDashboards").textContent =
        sessao.dashboards.length;

    const nomeHeader = document.getElementById("nomeUsuario");
    if (nomeHeader) nomeHeader.textContent = sessao.nome;

    const nomeCard = document.getElementById("nomeUsuarioCard");
    if (nomeCard) nomeCard.textContent = sessao.nome;

});
