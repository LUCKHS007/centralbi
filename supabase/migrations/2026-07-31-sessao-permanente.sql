-- Sessões passam a ser permanentes (sem expirar sozinhas). Para conseguir
-- "deslogar todo mundo daquele usuário" ao trocar a senha ou desativar a
-- conta, cada usuário ganha um contador de versão de sessão: todo login
-- guarda o valor atual desse contador dentro do token, e cada requisição
-- confere se ainda bate com o valor mais recente no banco.
--
-- Rode isso no SQL Editor do Supabase uma única vez.

alter table usuarios
    add column if not exists sessao_versao integer not null default 1;

-- Sempre que você quiser derrubar manualmente a sessão de alguém sem
-- trocar a senha (ex: usuário demitido, computador perdido), rode:
-- update usuarios set sessao_versao = sessao_versao + 1 where usuario = 'nome.usuario';
