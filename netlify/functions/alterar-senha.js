const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie } = require("./_cookie");

const TAMANHO_MINIMO_SENHA = 6;

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
        return { statusCode: 401, body: JSON.stringify({ erro: "Sessão inválida ou expirada" }) };
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
        .select("id, senha_hash")
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

    const { error: erroUpdate } = await supabase
        .from("usuarios")
        .update({ senha_hash: novoHash })
        .eq("id", usuario.id);

    if (erroUpdate) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível salvar a nova senha." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
