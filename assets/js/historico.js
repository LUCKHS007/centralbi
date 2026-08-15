/* ==========================================================
   Histórico de acessos (modal admin, dentro de Gerenciar usuários)
========================================================== */

const modalHistorico = document.getElementById("modalHistorico");
const histStats = document.getElementById("histStats");
const histGrafico = document.getElementById("histGrafico");
const histRankingPaineis = document.getElementById("histRankingPaineis");
const histRankingUsuarios = document.getElementById("histRankingUsuarios");
const histRankingCargos = document.getElementById("histRankingCargos");
const histBusca = document.getElementById("histBusca");
const histPeriodo = document.getElementById("histPeriodo");
const histDashboard = document.getElementById("histDashboard");
const histCorpoTabela = document.getElementById("histCorpoTabela");
const histContagem = document.getElementById("histContagem");
const histPaginaAtual = document.getElementById("histPaginaAtual");
const histPaginaAnterior = document.getElementById("histPaginaAnterior");
const histPaginaProxima = document.getElementById("histPaginaProxima");

let histPaginaAtualNum = 1;
let histDebounce = null;
let histDashboardsCarregados = false;

function formatarDataHistorico(isoString){
    const data = new Date(isoString);
    return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function iniciaisHistorico(nome){
    return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function abrirHistorico(){
    fecharUsuarios();
    modalHistorico.hidden = false;
    document.body.classList.add("modal-aberto");
    histPaginaAtualNum = 1;
    carregarHistorico();
}

function fecharHistorico(){
    modalHistorico.hidden = true;
    if (modalPerfil.hidden && modalUsuarios.hidden) document.body.classList.remove("modal-aberto");
}

modalHistorico.addEventListener("click", (e) => {
    if (e.target === modalHistorico) fecharHistorico();
});

function montarRankingHistorico(el, itens, vazio){
    if (!itens || itens.length === 0){
        el.innerHTML = `<li class="hist-ranking-vazio">${vazio}</li>`;
        return;
    }
    const max = Math.max(...itens.map((i) => i.qtd));
    el.innerHTML = itens.map((it, i) => `
        <li>
            <span class="hist-pos">${i + 1}</span>
            <span class="hist-nome" title="${escaparHtml(it.nome)}">${escaparHtml(it.nome)}</span>
            <span class="hist-barra-fundo"><span class="hist-barra" style="width:${max ? (it.qtd / max * 100).toFixed(0) : 0}%"></span></span>
            <span class="hist-qtd">${it.qtd}</span>
        </li>
    `).join("");
}

function desenharGraficoHistorico(porDia){
    const ctx = histGrafico.getContext("2d");
    const w = histGrafico.width, h = histGrafico.height;
    ctx.clearRect(0, 0, w, h);

    const valores = porDia.map((p) => p.qtd);
    const max = Math.max(...valores, 1) * 1.15;
    const media = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);

    const estilo = getComputedStyle(document.documentElement);
    const corAzul = (estilo.getPropertyValue("--tema-acento-fundo").trim()) || "#0057b8";
    const corBorda = (estilo.getPropertyValue("--tema-borda").trim()) || "#d7e2ee";
    const corTextoSec = (estilo.getPropertyValue("--tema-texto-secundario").trim()) || "#5b6b81";
    const corFundoCard = (estilo.getPropertyValue("--tema-fundo-card").trim()) || "#ffffff";

    const padL = 4, padR = 4, padT = 8, padB = 4;
    const plotW = w - padL - padR, plotH = h - padT - padB;

    ctx.strokeStyle = corBorda;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++){
        const y = padT + (plotH * i) / 3;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
    }

    const yMedia = padT + plotH - (media / max) * plotH;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = corTextoSec;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(padL, yMedia);
    ctx.lineTo(w - padR, yMedia);
    ctx.stroke();
    ctx.restore();

    if (valores.length < 2) return;

    const pontos = valores.map((v, i) => ({
        x: padL + (plotW * i) / (valores.length - 1),
        y: padT + plotH - (v / max) * plotH,
    }));

    ctx.beginPath();
    ctx.moveTo(pontos[0].x, padT + plotH);
    pontos.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pontos[pontos.length - 1].x, padT + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, corAzul + "55");
    grad.addColorStop(1, corAzul + "05");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pontos.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = corAzul;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.stroke();

    const last = pontos[pontos.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = corAzul;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = corFundoCard;
    ctx.stroke();
}

function montarStatsHistorico(resumo){
    histStats.innerHTML = `
        <div class="hist-stat">
            <div class="hist-stat-rotulo">Acessos no período</div>
            <div class="hist-stat-valor">${resumo.totalPeriodo}</div>
        </div>
        <div class="hist-stat">
            <div class="hist-stat-rotulo">Usuários que acessaram</div>
            <div class="hist-stat-valor">${resumo.usuariosAtivosNoPeriodo} <span class="hist-stat-total">/ ${resumo.totalUsuariosAtivos}</span></div>
        </div>
        <div class="hist-stat">
            <div class="hist-stat-rotulo">Painel mais acessado</div>
            <div class="hist-stat-valor hist-stat-valor-pequeno">${resumo.painelTop ? escaparHtml(resumo.painelTop.nome) : "—"}</div>
        </div>
    `;
}

function montarTabelaHistorico(registros){
    if (registros.length === 0){
        histCorpoTabela.innerHTML = '<tr><td colspan="3" class="hist-tabela-vazia">Nenhum acesso encontrado com esses filtros.</td></tr>';
        return;
    }
    histCorpoTabela.innerHTML = registros.map((r) => `
        <tr>
            <td>
                <div class="hist-usuario-cel">
                    <div class="hist-avatar">${iniciaisHistorico(r.usuario_nome)}</div>
                    <span>${escaparHtml(r.usuario_nome)}</span>
                </div>
            </td>
            <td>${escaparHtml(r.dashboard_titulo)}</td>
            <td class="hist-quando">${formatarDataHistorico(r.criado_em)}</td>
        </tr>
    `).join("");
}

async function carregarHistorico(){
    histCorpoTabela.innerHTML = '<tr><td colspan="3" class="hist-tabela-vazia"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>';

    const parametros = new URLSearchParams({
        pagina: String(histPaginaAtualNum),
        dias: histPeriodo.value,
        busca: histBusca.value.trim(),
        dashboard: histDashboard.value,
    });

    try {
        const resposta = await fetch(`/.netlify/functions/historico-acessos?${parametros.toString()}`, { credentials: "same-origin" });
        const dados = await resposta.json();

        if (!resposta.ok){
            histCorpoTabela.innerHTML = `<tr><td colspan="3" class="hist-tabela-vazia">${escaparHtml(dados.erro || "Não foi possível carregar o histórico.")}</td></tr>`;
            return;
        }

        montarStatsHistorico(dados.resumo);
        desenharGraficoHistorico(dados.resumo.porDia);
        montarRankingHistorico(histRankingPaineis, dados.resumo.porPainel, "Sem acessos no período.");
        montarRankingHistorico(histRankingUsuarios, dados.resumo.porUsuario, "Sem acessos no período.");
        montarRankingHistorico(histRankingCargos, dados.resumo.porCargo, "Sem acessos no período.");
        montarTabelaHistorico(dados.registros);

        if (!histDashboardsCarregados){
            dados.dashboardsDisponiveis.forEach((titulo) => {
                const opcao = document.createElement("option");
                opcao.value = titulo;
                opcao.textContent = titulo;
                histDashboard.appendChild(opcao);
            });
            histDashboardsCarregados = true;
        }

        histPaginaAtualNum = dados.pagina;
        histContagem.textContent = `${dados.totalRegistros} registro${dados.totalRegistros === 1 ? "" : "s"}`;
        histPaginaAtual.textContent = `Página ${dados.pagina} de ${dados.totalPaginas}`;
        histPaginaAnterior.disabled = dados.pagina <= 1;
        histPaginaProxima.disabled = dados.pagina >= dados.totalPaginas;

    } catch {
        histCorpoTabela.innerHTML = '<tr><td colspan="3" class="hist-tabela-vazia">Não foi possível conectar. Tente novamente.</td></tr>';
    }
}

histBusca.addEventListener("input", () => {
    clearTimeout(histDebounce);
    histDebounce = setTimeout(() => {
        histPaginaAtualNum = 1;
        carregarHistorico();
    }, 350);
});

histPeriodo.addEventListener("change", () => {
    histPaginaAtualNum = 1;
    carregarHistorico();
});

histDashboard.addEventListener("change", () => {
    histPaginaAtualNum = 1;
    carregarHistorico();
});

histPaginaAnterior.addEventListener("click", () => {
    if (histPaginaAtualNum > 1){
        histPaginaAtualNum -= 1;
        carregarHistorico();
    }
});

histPaginaProxima.addEventListener("click", () => {
    histPaginaAtualNum += 1;
    carregarHistorico();
});
