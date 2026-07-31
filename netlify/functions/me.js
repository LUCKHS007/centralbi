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
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão inválida ou expirada" }) };
    }

    const supabase = getSupabase();

    const [dashboardsRes, linksRes, permissoesRes] = await Promise.all([
        supabase.from("dashboards").select("*"),
        supabase.from("links_externos").select("*"),
        supabase.from("permissoes_cargo").select("permissao").eq("cargo", sessao.cargo),
    ]);

    if (dashboardsRes.error || linksRes.error || permissoesRes.error) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Erro ao carregar dados" }) };
    }

    const permissoesDoCargo = permissoesRes.data.map((p) => p.permissao);

    return {
        statusCode: 200,
        body: JSON.stringify({
            nome: sessao.nome,
            cargo: sessao.cargo,
            dashboards: filtrarPermitidos(permissoesDoCargo, dashboardsRes.data),
            linksExternos: filtrarPermitidos(permissoesDoCargo, linksRes.data),
        }),
    };
};
