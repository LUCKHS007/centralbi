const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { montarCookieSessao } = require("./_cookie");

const DEZ_ANOS_EM_SEGUNDOS = 10 * 365 * 24 * 60 * 60;
const CINCO_MINUTOS_EM_SEGUNDOS = 5 * 60;

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    let usuarioDigitado, senhaDigitada;
    try {
        ({ usuario: usuarioDigitado, senha: senhaDigitada } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (!usuarioDigitado || !senhaDigitada) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Usuário e senha são obrigatórios" }) };
    }

    const supabase = getSupabase();

    const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("id, usuario, senha_hash, nome, cargo, ativo, sessao_versao, totp_ativo")
        .ilike("usuario", usuarioDigitado.trim())
        .maybeSingle();

    if (error || !usuario || !usuario.ativo) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Usuário ou senha inválidos." }) };
    }

    const senhaConfere = await bcrypt.compare(senhaDigitada, usuario.senha_hash);

    if (!senhaConfere) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Usuário ou senha inválidos." }) };
    }

    if (usuario.totp_ativo) {

        const tokenPendente = jwt.sign(
            { sub: usuario.id, pendente2fa: true },
            process.env.JWT_SECRET,
            { expiresIn: CINCO_MINUTOS_EM_SEGUNDOS }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ precisaCodigo: true, tokenPendente }),
        };

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
