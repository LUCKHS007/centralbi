const { montarCookieLogout } = require("./_cookie");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    return {
        statusCode: 200,
        headers: { "Set-Cookie": montarCookieLogout() },
        body: JSON.stringify({ ok: true }),
    };
};
