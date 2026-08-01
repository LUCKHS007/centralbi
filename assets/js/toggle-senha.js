/* ==========================================================
   Botão de mostrar/ocultar senha
========================================================== */

document.querySelectorAll(".toggle-senha").forEach((botao) => {

    botao.addEventListener("click", () => {

        const input = document.getElementById(botao.dataset.alvo);
        if (!input) return;

        const icone = botao.querySelector("i");
        const visivel = input.type === "text";

        input.type = visivel ? "password" : "text";

        icone.classList.toggle("fa-eye", visivel);
        icone.classList.toggle("fa-eye-slash", !visivel);

        botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");

    });

});
