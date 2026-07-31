const ACESSO_TOTAL = "*";

function usuarioTemPermissao(permissoesDoCargo, item) {
    if (!permissoesDoCargo || permissoesDoCargo.length === 0) return false;
    if (permissoesDoCargo.includes(ACESSO_TOTAL)) return true;
    if (permissoesDoCargo.includes(item.id)) return true;

    const grupo = item.permissao || item.categoria;
    return permissoesDoCargo.includes(grupo);
}

function filtrarPermitidos(permissoesDoCargo, lista) {
    return lista.filter((item) => usuarioTemPermissao(permissoesDoCargo, item));
}

module.exports = { usuarioTemPermissao, filtrarPermitidos };
