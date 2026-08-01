const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { exigirAdmin } = require("./_admin");

const TAMANHO_MINIMO_SENHA = 6;

function gerarSenha() {
    return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 8);
}

exports.handler = async (event) => {
    const { supabase, erro } = await exigirAdmin(event);
    if (erro) return erro;

    if (event.httpMethod === "GET") {
        const { data, error } = await supabase
            .from("usuarios")
            .select("id, nome, usuario, cargo, ativo")
            .order("nome");

        if (error) {
            return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível carregar os usuários." }) };
        }

        return { statusCode: 200, body: JSON.stringify({ usuarios: data }) };
    }

    if (event.httpMethod === "POST") {
        let nome, usuario, cargo, senha;
        try {
            ({ nome, usuario, cargo, senha } = JSON.parse(event.body || "{}"));
        } catch {
            return { statusCode: 400, body: JSON.stringify({ erro: "Requisição inválida" }) };
        }

        nome = (nome || "").trim();
        usuario = (usuario || "").trim().toLowerCase();
        cargo = (cargo || "").trim();

        if (!nome || !usuario || !cargo) {
            return { statusCode: 400, body: JSON.stringify({ erro: "Preencha nome, usuário e cargo." }) };
        }

        if (cargo === "Administrador") {
            return { statusCode: 400, body: JSON.stringify({ erro: "Não é possível criar outro usuário com cargo Administrador." }) };
        }

        if (senha && senha.length < TAMANHO_MINIMO_SENHA) {
            return { statusCode: 400, body: JSON.stringify({ erro: `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` }) };
        }

        const senhaFinal = senha || gerarSenha();
        const hash = await bcrypt.hash(senhaFinal, 10);

        const { data, error } = await supabase
            .from("usuarios")
            .insert({ nome, usuario, cargo, senha_hash: hash, ativo: true })
            .select("id, nome, usuario, cargo, ativo")
            .single();

        if (error) {
            if (error.code === "23505") {
                return { statusCode: 409, body: JSON.stringify({ erro: "Esse usuário já existe." }) };
            }
            return { statusCode: 500, body: JSON.stringify({ erro: "Não foi possível criar o usuário." }) };
        }

        return { statusCode: 201, body: JSON.stringify({ usuario: data, senha: senhaFinal }) };
    }

    return { statusCode: 405, body: "Método não permitido" };
};
