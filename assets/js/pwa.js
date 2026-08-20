/* ==========================================
   Registro do Service Worker (PWA)
========================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("/service-worker.js").catch(() => {
            // sem suporte/erro de registro: site continua funcionando normal,
            // só sem os benefícios de instalar como app
        });

    });

}
