-- ============================================================
-- CENTRAL BI - Migração: histórico de acessos aos dashboards
-- Rode isso uma vez no SQL Editor do Supabase (projeto já existente).
-- Guarda quem acessou qual dashboard e quando, com o nome/cargo
-- gravados no momento do acesso (não depende de join, sobrevive
-- mesmo se o usuário ou o dashboard forem removidos depois).
-- ============================================================

create table acessos_log (
    id bigserial primary key,
    usuario_id uuid references usuarios(id) on delete set null,
    usuario_nome text not null,
    dashboard_id text not null,
    dashboard_titulo text not null,
    criado_em timestamptz not null default now()
);

create index acessos_log_criado_em_idx on acessos_log (criado_em desc);

alter table acessos_log enable row level security;
-- Nenhuma policy criada de propósito: só a service_role (usada pelas
-- Netlify Functions) consegue ler/escrever, igual as outras tabelas.
