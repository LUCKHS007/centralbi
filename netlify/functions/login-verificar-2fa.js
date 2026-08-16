const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");
const { getSupabase } = require("./_supabase");
const { montarCookieSessao } = require("./_cookie");

const DEZ_ANOS_EM_SEGUNDOS = 10 * 365 * 24 * 60 * 60;

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    let tokenPendente, codigo;
    try {
        ({ tokenPendente, codigo } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (!tokenPendente || !codigo) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Informe o código do aplicativo autenticador." }) };
    }

    let pendencia;
    try {
        pendencia = jwt.verify(tokenPendente, process.env.JWT_SECRET);
    } catch {
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão de login expirada. Faça login de novo." }) };
    }

    if (!pendencia.pendente2fa) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Requisição inválida." }) };
    }

    const supabase = getSupabase();

    const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("id, usuario, nome, cargo, ativo, sessao_versao, totp_ativo, totp_secret")
        .eq("id", pendencia.sub)
        .maybeSingle();

    if (error || !usuario || !usuario.ativo || !usuario.totp_ativo || !usuario.totp_secret) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Não foi possível concluir o login." }) };
    }

    const codigoValido = authenticator.check(String(codigo).trim(), usuario.totp_secret);

    if (!codigoValido) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Código inválido." }) };
    }

    const token = jwt.sign(
        { sub: usuario.id, usuario: usuario.usuario, sessaoVersao: usuario.sessao_versao },
        process.env.JWT_SECRET
    );

    return {
        statusCode: 200,
        headers: { "Set-Cookie": montarCookieSessao(token, DEZ_ANOS_EM_SEGUNDOS) },
        body: JSON.stringify({ nome: usuario.nome, cargo: usuario.cargo }),
    };
};
