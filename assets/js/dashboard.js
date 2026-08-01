/* ==========================================================
   Renderização dos Dashboards e Acessos Rápidos
   (dados vêm de /.netlify/functions/me, já filtrados por cargo)
========================================================== */

const painel = document.getElementById("painelBI");
const painelLinks = document.getElementById("painelLinks");

function criarCardBi(item, { href, categoria, textoAbrir }){

    const card = document.createElement("a");
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener";
    card.className = "card-bi";
    if (categoria) card.dataset.categoria = categoria;

    const icone = document.createElement("i");
    icone.className = `fa-solid ${item.icone}`;
    card.appendChild(icone);

    const titulo = document.createElement("h3");
    titulo.textContent = item.titulo;
    card.appendChild(titulo);

    const descricao = document.createElement("p");
    descricao.textContent = item.descricao;
    card.appendChild(descricao);

    const abrir = document.createElement("span");
    abrir.className = "abrir";
    abrir.append(textoAbrir + " ");

    const setaIcone = document.createElement("i");
    setaIcone.className = "fa-solid fa-arrow-right";
    abrir.appendChild(setaIcone);

    card.appendChild(abrir);

    return card;

}

function criarEstadoVazio(mensagem){

    const aviso = document.createElement("div");
    aviso.className = "estado-vazio";
    aviso.textContent = mensagem;

    return aviso;

}

function renderizarDashboards(lista){

    painel.innerHTML = "";

    if (lista.length === 0){
        painel.appendChild(criarEstadoVazio(
            "Nenhum dashboard disponível para o seu cargo. Fale com o TI se acha que isso está errado."
        ));
        return;
    }

    lista.forEach(item => {

        painel.appendChild(criarCardBi(item, {
            href: item.link,
            categoria: item.categoria,
            textoAbrir: "Abrir Dashboard",
        }));

    });

}

function renderizarLinks(lista){

    painelLinks.innerHTML = "";

    lista.forEach(item => {

        painelLinks.appendChild(criarCardBi(item, {
            href: item.url || "#",
            textoAbrir: "Acessar",
        }));

    });

}

/* ==========================================================
   Categorias
   (fixas no HTML; as que não têm nenhum dashboard liberado
   pro usuário ficam desabilitadas/apagadas)
========================================================== */

const categoriasContainer = document.getElementById("categoriasContainer");

function filtrarCardsPorCategoria(categoriaSelecionada){

    document.querySelectorAll(".card-bi").forEach(card => {

        if (!card.dataset.categoria) return;

        if (categoriaSelecionada === "todos"){
            card.style.display = "flex";
            return;
        }

        card.style.display =
            card.dataset.categoria.toLowerCase() === categoriaSelecionada
                ? "flex"
                : "none";

    });

}

function ativarBotaoCategoria(botaoAtivo){

    categoriasContainer.querySelectorAll(".categoria").forEach(botao => {
        botao.classList.toggle("ativa", botao === botaoAtivo);
    });

}

function configurarCategorias(listaDashboards){

    const categoriasDisponiveis = new Set(
        listaDashboards.map(item => item.categoria.toLowerCase())
    );

    categoriasContainer.querySelectorAll(".categoria").forEach(botao => {

        const categoria = botao.dataset.categoria;
        const disponivel = categoria === "todos" || categoriasDisponiveis.has(categoria);

        botao.classList.toggle("indisponivel", !disponivel);
        botao.disabled = !disponivel;

        botao.addEventListener("click", () => {

            if (botao.disabled) return;

            ativarBotaoCategoria(botao);
            filtrarCardsPorCategoria(categoria);

        });

    });

}

window.__sessaoCentralBI.then((sessao) => {

    if (!sessao) return;

    renderizarDashboards(sessao.dashboards);
    renderizarLinks(sessao.linksExternos);
    configurarCategorias(sessao.dashboards);

    document.getElementById("totalDashboards").textContent =
        sessao.dashboards.length;

    const nomeHeader = document.getElementById("nomeUsuario");
    if (nomeHeader) nomeHeader.textContent = sessao.nome;

    const cargoCard = document.getElementById("cargoUsuarioCard");
    if (cargoCard) cargoCard.textContent = sessao.cargo;

});
