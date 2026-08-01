const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie, montarCookieSessao } = require("./_cookie");

const TAMANHO_MINIMO_SENHA = 6;
const DEZ_ANOS_EM_SEGUNDOS = 10 * 365 * 24 * 60 * 60;

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

    let senhaAtual, senhaNova;
    try {
        ({ senhaAtual, senhaNova } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (!senhaAtual || !senhaNova) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Preencha a senha atual e a nova senha." }) };
    }

    if (senhaNova.length < TAMANHO_MINIMO_SENHA) {
        return { statusCode: 400, body: JSON.stringify({ erro: `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` }) };
    }

    const supabase = getSupabase();

    const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("id, usuario, senha_hash, sessao_versao")
        .eq("id", sessao.sub)
        .maybeSingle();

    if (error || !usuario) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Usuário não encontrado." }) };
    }

    const senhaAtualConfere = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaAtualConfere) {
        return { statusCode: 401, body: JSON.stringify({ erro: "Senha atual incorreta." }) };
    }

    const novoHash = await bcrypt.hash(senhaNova, 10);
    const novaSessaoVersao = usuario.sessao_versao + 1;

    const { error: erroUpdate } = await supabase
        .from("usuarios")
        .update({ senha_hash: novoHash, sessao_versao: novaSessaoVersao })
        .eq("id", usuario.id);

    if (erroUpdate) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível salvar a nova senha." }) };
    }

    // Troca de senha invalida sessões antigas (outros aparelhos), mas emite
    // um cookie novo aqui pra este mesmo aparelho continuar logado.
    const novoToken = jwt.sign(
        { sub: usuario.id, usuario: usuario.usuario, sessaoVersao: novaSessaoVersao },
        process.env.JWT_SECRET
    );

    return {
        statusCode: 200,
        headers: { "Set-Cookie": montarCookieSessao(novoToken, DEZ_ANOS_EM_SEGUNDOS) },
        body: JSON.stringify({ ok: true }),
    };
};
