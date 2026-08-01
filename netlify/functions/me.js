const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie } = require("./_cookie");
const { filtrarPermitidos } = require("./_permissoes");

exports.handler = async (event) => {
    const token = lerCookie(event.headers);

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Não autenticado" }) };
    }

    let sessao;
    try {
        sessao = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão inválida" }) };
    }

    const supabase = getSupabase();

    const { data: usuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("nome, cargo, ativo, sessao_versao")
        .eq("id", sessao.sub)
        .maybeSingle();

    if (erroUsuario) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Erro ao carregar usuário" }) };
    }

    if (!usuario || !usuario.ativo || usuario.sessao_versao !== sessao.sessaoVersao) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão encerrada" }) };
    }

    const [dashboardsRes, linksRes, permissoesRes] = await Promise.all([
        supabase.from("dashboards").select("*"),
        supabase.from("links_externos").select("*"),
        supabase.from("permissoes_cargo").select("permissao").eq("cargo", usuario.cargo),
    ]);

    if (dashboardsRes.error || linksRes.error || permissoesRes.error) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Erro ao carregar dados" }) };
    }

    const permissoesDoCargo = permissoesRes.data.map((p) => p.permissao);

    return {
        statusCode: 200,
        body: JSON.stringify({
            nome: usuario.nome,
            cargo: usuario.cargo,
            dashboards: filtrarPermitidos(permissoesDoCargo, dashboardsRes.data),
            linksExternos: filtrarPermitidos(permissoesDoCargo, linksRes.data),
        }),
    };
};
