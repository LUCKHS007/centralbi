const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie } = require("./_cookie");

// Gerenciar usuários é restrito à conta admin.net, não ao cargo
// Administrador em geral — só essa conta deve existir com esse nível de acesso.
const LOGIN_ADMIN_UNICO = "admin.net";

async function exigirAdmin(event) {
    const token = lerCookie(event.headers);

    if (!token) {
        return { erro: { statusCode: 401, body: JSON.stringify({ erro: "Não autenticado" }) } };
    }

    let sessao;
    try {
        sessao = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { erro: { statusCode: 401, body: JSON.stringify({ erro: "Sessão inválida" }) } };
    }

    const supabase = getSupabase();

    const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("id, usuario, cargo, ativo, sessao_versao")
        .eq("id", sessao.sub)
        .maybeSingle();

    if (error || !usuario || !usuario.ativo || usuario.sessao_versao !== sessao.sessaoVersao) {
        return { erro: { statusCode: 401, body: JSON.stringify({ erro: "Sessão encerrada" }) } };
    }

    if (usuario.usuario !== LOGIN_ADMIN_UNICO) {
        return { erro: { statusCode: 403, body: JSON.stringify({ erro: "Apenas o administrador do sistema pode fazer isso." }) } };
    }

    return { supabase, usuarioAdmin: usuario };
}

module.exports = { exigirAdmin };
