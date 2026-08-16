-- ============================================================
-- CENTRAL BI - Migração: verificação em duas etapas (TOTP)
-- Rode isso uma vez no SQL Editor do Supabase (projeto já existente).
-- Guarda o segredo TOTP e se a verificação em duas etapas está ativa.
-- Coluna genérica (qualquer usuário poderia ativar no futuro), mas
-- hoje só a tela de perfil do admin.net oferece a opção.
-- ============================================================

alter table usuarios add column totp_secret text;
alter table usuarios add column totp_ativo boolean not null default false;
