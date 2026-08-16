const bcrypt = require("bcryptjs");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const { exigirAdmin } = require("./_admin");

// Só o admin.net pode configurar 2FA — é a conta mais sensível
// (gerencia usuários e senhas de todo mundo). exigirAdmin já garante
// que quem está chamando é exatamente essa conta.
const EMISSOR = "Central BI - Pedreira Sargon";

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método não permitido" };
    }

    const { supabase, erro, usuarioAdmin } = await exigirAdmin(event);
    if (erro) return erro;

    let acao, codigo, senhaAtual;
    try {
        ({ acao, codigo, senhaAtual } = JSON.parse(event.body || "{}"));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
    }

    if (acao === "iniciar") {

        const segredo = authenticator.generateSecret();

        const { error: erroUpdate } = await supabase
            .from("usuarios")
            .update({ totp_secret: segredo, totp_ativo: false })
            .eq("id", usuarioAdmin.id);

        if (erroUpdate) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível iniciar a configuração." }) };
        }

        const otpauthUrl = authenticator.keyuri(usuarioAdmin.usuario, EMISSOR, segredo);
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });

        return {
            statusCode: 200,
            body: JSON.stringify({ segredo, qrCodeDataUrl }),
        };

    }

    if (acao === "confirmar") {

        const { data: usuario, error: erroBusca } = await supabase
            .from("usuarios")
            .select("totp_secret")
            .eq("id", usuarioAdmin.id)
            .maybeSingle();

        if (erroBusca || !usuario || !usuario.totp_secret) {
            return { statusCode: 400, body: JSON.stringify({ erro: "Inicie a configuração antes de confirmar." }) };
        }

        const codigoValido = authenticator.check(String(codigo || "").trim(), usuario.totp_secret);

        if (!codigoValido) {
            return { statusCode: 401, body: JSON.stringify({ erro: "Código inválido. Confira o app autenticador e tente de novo." }) };
        }

        const { error: erroUpdate } = await supabase
            .from("usuarios")
            .update({ totp_ativo: true })
            .eq("id", usuarioAdmin.id);

        if (erroUpdate) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível ativar a verificação em duas etapas." }) };
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    }

    if (acao === "desativar") {

        const { data: usuario, error: erroBusca } = await supabase
            .from("usuarios")
            .select("senha_hash")
            .eq("id", usuarioAdmin.id)
            .maybeSingle();

        if (erroBusca || !usuario) {
            return { statusCode: 400, body: JSON.stringify({ erro: "Não foi possível desativar." }) };
        }

        const senhaConfere = await bcrypt.compare(senhaAtual || "", usuario.senha_hash);
        if (!senhaConfere) {
            return { statusCode: 401, body: JSON.stringify({ erro: "Senha incorreta." }) };
        }

        const { error: erroUpdate } = await supabase
            .from("usuarios")
            .update({ totp_ativo: false, totp_secret: null })
            .eq("id", usuarioAdmin.id);

        if (erroUpdate) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível desativar." }) };
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    }

    return { statusCode: 400, body: JSON.stringify({ erro: "Ação desconhecida." }) };
};
