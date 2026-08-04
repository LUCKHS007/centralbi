/* ==========================================================
   Renderização dos Dashboards e Acessos Rápidos
   (dados vêm de /.netlify/functions/me, já filtrados por cargo)
========================================================== */

const painel = document.getElementById("painelBI");
const painelLinks = document.getElementById("painelLinks");

function obterIniciais(nome){

    if (!nome) return "";

    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] || "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";

    return (primeira + ultima).toUpperCase();

}

function criarCardBi(item, { href, categoria, textoAbrir }){

    const card = document.createElement("a");
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener";
    card.className = "card-bi";
    if (categoria) card.dataset.categoria = categoria;

    if (categoria){

        const badge = document.createElement("span");
        badge.className = "badge-categoria";
        badge.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        card.appendChild(badge);

    }

    card.addEventListener("click", () => registrarAcessoNoServidor(item));

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

function registrarAcessoNoServidor(item){

    // Fire-and-forget: não trava a navegação nem mostra erro pro usuário comum.
    fetch("/.netlify/functions/registrar-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId: item.id, titulo: item.titulo }),
        credentials: "same-origin",
    }).catch(() => {});

}

function criarEstadoVazio(mensagem){

    const aviso = document.createElement("div");
    aviso.className = "estado-vazio";

    const icone = document.createElement("i");
    icone.className = "fa-solid fa-folder-open";
    aviso.appendChild(icone);

    const texto = document.createElement("span");
    texto.textContent = mensagem;
    aviso.appendChild(texto);

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

    const tituloAcessoRapido = document.getElementById("tituloAcessoRapido");
    if (tituloAcessoRapido) tituloAcessoRapido.hidden = lista.length === 0;

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

        const total = categoria === "todos"
            ? listaDashboards.length
            : listaDashboards.filter(item => item.categoria.toLowerCase() === categoria).length;

        const contagem = document.createElement("span");
        contagem.className = "contagem";
        contagem.textContent = `(${total})`;
        botao.appendChild(contagem);

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

    const avatarUsuario = document.getElementById("avatarUsuario");
    if (avatarUsuario) avatarUsuario.textContent = obterIniciais(sessao.nome);

    const cargoCard = document.getElementById("cargoUsuarioCard");
    if (cargoCard) cargoCard.textContent = sessao.cargo;

    const totalAcessoRapido = document.getElementById("totalAcessoRapido");
    if (totalAcessoRapido) totalAcessoRapido.textContent = sessao.linksExternos.length;

    const secaoEstatisticas = document.getElementById("secaoEstatisticas");
    if (secaoEstatisticas) secaoEstatisticas.classList.remove("carregando");

});
