/* ==========================================================
   CENTRAL BI
   Cache curto da sessão (evita bater na Function /me toda hora)
========================================================== */

const CENTRALBI_CACHE_CHAVE = "centralbi_sessao_cache";
const CENTRALBI_CACHE_DURACAO_MS = 5 * 60 * 1000;

function centralBiLerCache(){

    try {

        const bruto = sessionStorage.getItem(CENTRALBI_CACHE_CHAVE);
        if (!bruto) return null;

        const { dados, expiraEm } = JSON.parse(bruto);
        if (Date.now() > expiraEm) return null;

        return dados;

    } catch {

        return null;

    }

}

function centralBiSalvarCache(dados){

    try {

        sessionStorage.setItem(CENTRALBI_CACHE_CHAVE, JSON.stringify({
            dados,
            expiraEm: Date.now() + CENTRALBI_CACHE_DURACAO_MS,
        }));

    } catch {

        // sessionStorage indisponível (ex: modo privado) - segue sem cache

    }

}

function centralBiLimparCache(){

    try {

        sessionStorage.removeItem(CENTRALBI_CACHE_CHAVE);

    } catch {

        // ignora

    }

}

async function centralBiBuscarSessao(){

    const cache = centralBiLerCache();
    if (cache) return cache;

    let resposta;

    try {

        resposta = await fetch("/.netlify/functions/me", { credentials: "same-origin" });

    } catch (erroDeRede) {

        const erro = new Error("Falha de conexão ao buscar sessão");
        erro.tipoErro = "conexao";
        throw erro;

    }

    if (resposta.status >= 500){

        const erro = new Error("Servidor indisponível");
        erro.tipoErro = "conexao";
        throw erro;

    }

    if (!resposta.ok){
        centralBiLimparCache();
        return null;
    }

    const dados = await resposta.json();
    centralBiSalvarCache(dados);

    return dados;

}

function centralBiMostrarErroConexao(){

    document.body.innerHTML = `
        <div class="erro-conexao">
            <i class="fa-solid fa-plug-circle-xmark"></i>
            <h1>Não foi possível conectar</h1>
            <p>Verifique sua internet e tente novamente. Se o problema continuar, avise o TI.</p>
            <button onclick="window.location.reload()">Tentar novamente</button>
        </div>
    `;

}
