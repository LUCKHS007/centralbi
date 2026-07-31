const NOME_COOKIE = "centralbi_session";

function lerCookie(headers) {
    const cabecalho = headers && (headers.cookie || headers.Cookie);
    if (!cabecalho) return null;

    for (const parte of cabecalho.split(";")) {
        const [chave, ...resto] = parte.trim().split("=");
        if (chave === NOME_COOKIE) return decodeURIComponent(resto.join("="));
    }

    return null;
}

function montarCookieSessao(token, maxIdadeSegundos) {
    const atributos = [
        `${NOME_COOKIE}=${encodeURIComponent(token)}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${maxIdadeSegundos}`,
    ];
    return atributos.join("; ");
}

function montarCookieLogout() {
    return `${NOME_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

module.exports = { lerCookie, montarCookieSessao, montarCookieLogout };
