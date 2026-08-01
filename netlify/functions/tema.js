const jwt = require("jsonwebtoken");
const { getSupabase } = require("./_supabase");
const { lerCookie } = require("./_cookie");

const TEMAS_VALIDOS = ["claro", "escuro", "azul", "verde", "amarelo"];

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

    if (event.httpMethod === "GET") {

        const { data, error } = await supabase
            .from("usuarios")
            .select("tema")
            .eq("id", sessao.sub)
            .maybeSingle();

        if (error) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Erro ao buscar tema" }) };
        }

        return { statusCode: 200, body: JSON.stringify({ tema: data?.tema || "claro" }) };

    }

    if (event.httpMethod === "POST") {

        let tema;
        try {
            ({ tema } = JSON.parse(event.body || "{}"));
        } catch {
            return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
        }

        if (!TEMAS_VALIDOS.includes(tema)) {
            return { statusCode: 400, body: JSON.stringify({ erro: "Tema inválido" }) };
        }

        const { error } = await supabase
            .from("usuarios")
            .update({ tema })
            .eq("id", sessao.sub);

        if (error) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Erro ao salvar tema" }) };
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    }

    return { statusCode: 405, body: "Método não permitido" };

};
