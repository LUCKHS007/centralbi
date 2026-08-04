const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie } = require("./_cookie");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

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

    let dashboardId, titulo;
    try {
        ({ dashboardId, titulo } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (!dashboardId || !titulo) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Dashboard não informado." }) };
    }

    const supabase = getSupabase();

    const { data: usuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("id, nome, ativo, sessao_versao")
        .eq("id", sessao.sub)
        .maybeSingle();

    if (erroUsuario || !usuario || !usuario.ativo || usuario.sessao_versao !== sessao.sessaoVersao) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão encerrada" }) };
    }

    // Não é crítico se isso falhar (só estatística) — não trava a navegação do usuário.
    await supabase.from("acessos_log").insert({
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        dashboard_id: String(dashboardId),
        dashboard_titulo: String(titulo),
    });

    return { statusCode: 204, body: "" };
};
