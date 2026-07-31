const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const usuarios = [
    { usuario: "admin.net", nome: "Administrador", cargo: "Administrador" },
    { usuario: "andre.sargon", nome: "André Saraiva", cargo: "Diretor" },
    { usuario: "joao.sargon", nome: "João Araújo", cargo: "Gerente" },
    { usuario: "ronaldo.sargon", nome: "Ronaldo", cargo: "Encarregado_Geral" },
    { usuario: "ana.sargon", nome: "Ana Stabile", cargo: "Recepcao" },
    { usuario: "renan.sargon", nome: "Renan Pedro", cargo: "Controle" },
    { usuario: "katriel.sargon", nome: "Katriel Machado", cargo: "Controle" },
    { usuario: "lucas.sargon", nome: "Lucas Ferreira", cargo: "Controle" },
    { usuario: "carlos.sargon", nome: "Carlos Mec.", cargo: "Encarregado_Setor" },
    { usuario: "elison.sargon", nome: "Elison Ensac.", cargo: "Encarregado_Setor" },
    { usuario: "luis.sargon", nome: "Luis Brit.", cargo: "Encarregado_Setor" },
    { usuario: "ricardo.sargon", nome: "Ricardo Eletr.", cargo: "Encarregado_Setor" },
    { usuario: "jadson.sargon", nome: "Jadson Roch.", cargo: "Encarregado_Setor" },
    { usuario: "matheus.sargon", nome: "Matheus Mec.", cargo: "Mecânico" },
    { usuario: "julia", nome: "Julia Lima", cargo: "Operador" },
];

function gerarSenha() {
    return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 8);
}

const linhas = [];
const listaSenhas = [];

for (const u of usuarios) {
    const senha = gerarSenha();
    const hash = bcrypt.hashSync(senha, 10);
    listaSenhas.push(`${u.usuario.padEnd(20)} ${senha}`);
    linhas.push(
        `('${u.usuario}', '${hash}', '${u.nome.replace(/'/g, "''")}', '${u.cargo}', true)`
    );
}

console.log("-- Cole isso no SQL Editor do Supabase, dentro do INSERT INTO usuarios:\n");
console.log(linhas.join(",\n") + ";");

console.error("\n\n===== SENHAS NOVAS (guarde/repasse com segurança, não ficam em nenhum arquivo) =====\n");
console.error(listaSenhas.join("\n"));
console.error("\n=====================================================================================\n");
