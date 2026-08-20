/* ==========================================================
   CENTRAL BI - Service Worker
   Deixa o site instalável como app e funcionando com internet
   instável. Estratégia:
   - Functions (/.netlify/functions/*): sempre rede, nunca cache
     (login, sessão e dados não podem servir coisa velha).
   - HTML/CSS/JS: tenta rede primeiro (site sempre atualizado
     quando online) e só usa o cache se a rede falhar.
   - Imagens/ícones/fontes: cache primeiro (mudam raramente).
========================================================== */

const VERSAO_CACHE = "centralbi-v1";

const ARQUIVOS_ESSENCIAIS = [
    "/index.html",
    "/login.html",
    "/manifest.json",
];

self.addEventListener("install", (evento) => {

    evento.waitUntil(
        caches.open(VERSAO_CACHE).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
    );

    self.skipWaiting();

});

self.addEventListener("activate", (evento) => {

    evento.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(
                nomes
                    .filter((nome) => nome !== VERSAO_CACHE)
                    .map((nome) => caches.delete(nome))
            )
        )
    );

    self.clients.claim();

});

function ehArquivoEstatico(url){
    return /\.(png|jpg|jpeg|svg|ico|webp|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener("fetch", (evento) => {

    const url = new URL(evento.request.url);

    if (evento.request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // Functions nunca passam por cache — sempre precisam da resposta real.
    if (url.pathname.startsWith("/.netlify/functions/")) {
        return;
    }

    if (ehArquivoEstatico(url)) {

        evento.respondWith(
            caches.match(evento.request).then((resposta) =>
                resposta ||
                fetch(evento.request).then((respostaRede) => {
                    const clone = respostaRede.clone();
                    caches.open(VERSAO_CACHE).then((cache) => cache.put(evento.request, clone));
                    return respostaRede;
                })
            )
        );

        return;

    }

    evento.respondWith(
        fetch(evento.request)
            .then((respostaRede) => {
                const clone = respostaRede.clone();
                caches.open(VERSAO_CACHE).then((cache) => cache.put(evento.request, clone));
                return respostaRede;
            })
            .catch(() => caches.match(evento.request))
    );

});
