/* ===================================================
   Logout
=================================================== */

async function logout() {

    const confirmar = confirm("Deseja realmente sair da Central BI?");

    if (!confirmar) return;

    try {
        await fetch("/.netlify/functions/logout", { method: "POST", credentials: "same-origin" });
    } catch {
        // segue para o redirecionamento mesmo se a chamada falhar
    }

    window.location.replace("login.html");

}
