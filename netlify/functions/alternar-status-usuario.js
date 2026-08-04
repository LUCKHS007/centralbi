const { exigirAdmin } = require("./_admin");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    const { supabase, usuarioAdmin, erro } = await exigirAdmin(event);
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

    if (usuarioId === usuarioAdmin.id) {
        return { statusCode: 400, body: JSON.stringify({ erro: "Você não pode desativar sua própria conta." }) };
    }

    const { data: alvo, error: erroBusca } = await supabase
        .from("usuarios")
        .select("id, ativo, sessao_versao")
        .eq("id", usuarioId)
        .maybeSingle();

    if (erroBusca || !alvo) {
        return { statusCode: 404, body: JSON.stringify({ erro: "Usuário não encontrado." }) };
    }

    const novoStatus = !alvo.ativo;

    const atualizacao = { ativo: novoStatus };
    // Ao desativar, invalida a sessão ativa da pessoa imediatamente.
    if (!novoStatus) atualizacao.sessao_versao = alvo.sessao_versao + 1;

    const { error: erroUpdate } = await supabase
        .from("usuarios")
        .update(atualizacao)
        .eq("id", usuarioId);

    if (erroUpdate) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível atualizar o status." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ativo: novoStatus }) };
};
