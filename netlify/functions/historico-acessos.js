const { exigirAdmin } = require("./_admin");

const LIMITE_REGISTROS = 50;

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    const { supabase, erro } = await exigirAdmin(event);
    if (erro) return erro;

    const { data, error } = await supabase
        .from("acessos_log")
        .select("usuario_nome, dashboard_titulo, criado_em")
        .order("criado_em", { ascending: false })
        .limit(LIMITE_REGISTROS);

    if (error) {
        return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível carregar o histórico." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ acessos: data }) };
};
