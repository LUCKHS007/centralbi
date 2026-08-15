const { exigirAdmin } = require("./_admin");

const POR_PAGINA = 8;
const LIMITE_BUSCA = 5000;

function formatarDiaChave(data) {
    return data.toISOString().slice(0, 10);
}

function nomeCargo(cargo) {
    const nomes = {
        Diretor: "Diretor",
        Gerente: "Gerente",
        Encarregado_Geral: "Encarregado geral",
        Encarregado_Setor: "Encarregado de setor",
        Controle: "Controle",
        Recepcao: "Recepção",
        "Mecânico": "Mecânico",
        Operador: "Operador",
    };
    return nomes[cargo] || cargo || "Ex-usuário";
}

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function topN(mapa, n) {
    return [...mapa.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([nome, qtd]) => ({ nome, qtd }));
}

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    const { supabase, erro } = await exigirAdmin(event);
    if (erro) return erro;

    const params = event.queryStringParameters || {};
    const dias = Math.min(Math.max(parseInt(params.dias, 10) || 30, 1), 365);
    const pagina = Math.max(parseInt(params.pagina, 10) || 1, 1);
    const busca = normalizar((params.busca || "").trim());
    const dashboardFiltro = (params.dashboard || "").trim();

    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const { data: linhas, error: erroConsulta } = await supabase
        .from("acessos_log")
        .select("usuario_id, usuario_nome, dashboard_id, dashboard_titulo, criado_em")
        .gte("criado_em", desde.toISOString())
        .order("criado_em", { ascending: false })
        .limit(LIMITE_BUSCA);

    if (erroConsulta) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível carregar o histórico." }) };
    }

    const idsUsuarios = [...new Set(linhas.map((l) => l.usuario_id).filter(Boolean))];
    let cargoPorId = {};
    let ativoPorId = {};
    if (idsUsuarios.length > 0) {
        const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id, cargo, ativo")
            .in("id", idsUsuarios);
        (usuarios || []).forEach((u) => {
            cargoPorId[u.id] = u.cargo;
            ativoPorId[u.id] = u.ativo;
        });
    }

    const { count: totalUsuariosAtivos } = await supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

    // ---- filtros aplicados sobre a janela já carregada ----
    const filtradas = linhas.filter((l) => {
        if (dashboardFiltro && l.dashboard_titulo !== dashboardFiltro) return false;
        if (busca && !normalizar(l.usuario_nome).includes(busca)) return false;
        return true;
    });

    // ---- agregações (sobre a janela filtrada por dashboard, sem a busca por nome,
    // pra que os cards/gráfico/rankings representem o período todo) ----
    const baseAgregacao = dashboardFiltro
        ? linhas.filter((l) => l.dashboard_titulo === dashboardFiltro)
        : linhas;

    const porDiaMapa = new Map();
    for (let i = dias - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        porDiaMapa.set(formatarDiaChave(d), 0);
    }
    const porPainelMapa = new Map();
    const porUsuarioMapa = new Map();
    const porCargoMapa = new Map();
    const usuariosComAcesso = new Set();

    baseAgregacao.forEach((l) => {
        const dia = formatarDiaChave(new Date(l.criado_em));
        if (porDiaMapa.has(dia)) porDiaMapa.set(dia, porDiaMapa.get(dia) + 1);

        porPainelMapa.set(l.dashboard_titulo, (porPainelMapa.get(l.dashboard_titulo) || 0) + 1);
        porUsuarioMapa.set(l.usuario_nome, (porUsuarioMapa.get(l.usuario_nome) || 0) + 1);

        const cargo = nomeCargo(l.usuario_id ? cargoPorId[l.usuario_id] : null);
        porCargoMapa.set(cargo, (porCargoMapa.get(cargo) || 0) + 1);

        if (l.usuario_id) usuariosComAcesso.add(l.usuario_id);
    });

    const painelTop = topN(porPainelMapa, 1)[0] || null;

    const totalPaginas = Math.max(Math.ceil(filtradas.length / POR_PAGINA), 1);
    const paginaValida = Math.min(pagina, totalPaginas);
    const inicio = (paginaValida - 1) * POR_PAGINA;
    const registros = filtradas.slice(inicio, inicio + POR_PAGINA);

    const dashboardsDisponiveis = [...new Set(linhas.map((l) => l.dashboard_titulo))].sort();

    return {
        statusCode: 200,
        body: JSON.stringify({
            resumo: {
                totalPeriodo: baseAgregacao.length,
                usuariosAtivosNoPeriodo: usuariosComAcesso.size,
                totalUsuariosAtivos: totalUsuariosAtivos || 0,
                painelTop,
                porDia: [...porDiaMapa.entries()].map(([dia, qtd]) => ({ dia, qtd })),
                porPainel: topN(porPainelMapa, 5),
                porUsuario: topN(porUsuarioMapa, 5),
                porCargo: topN(porCargoMapa, 8),
            },
            dashboardsDisponiveis,
            registros,
            totalRegistros: filtradas.length,
            pagina: paginaValida,
            totalPaginas,
        }),
    };
};
