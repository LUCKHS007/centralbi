const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { exigirAdmin } = require("./_admin");

function gerarSenha() {
    return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 8);
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    const { supabase, erro } = await exigirAdmin(event);
    if (erro) return erro;

    let usuarioId;
    try {
        ({ usuarioId } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (!usuarioId) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Usuário não informado." }) };
    }

    const { data: alvo, error: erroBusca } = await supabase
        .from("usuarios")
        .select("id, sessao_versao")
        .eq("id", usuarioId)
        .maybeSingle();

    if (erroBusca || !alvo) {
        return { statusCode: 404, body: JSON.stringify({ erro: "Usuário não encontrado." }) };
    }

    const novaSenha = gerarSenha();
    const hash = await bcrypt.hash(novaSenha, 10);

    const { error: erroUpdate } = await supabase
        .from("usuarios")
        .update({ senha_hash: hash, sessao_versao: alvo.sessao_versao + 1 })
        .eq("id", usuarioId);

    if (erroUpdate) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível redefinir a senha." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ senha: novaSenha }) };
};
