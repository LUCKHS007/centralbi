-- Adiciona a coluna de tema por usuário (projeto já existente no Supabase).
-- Rode isso no SQL Editor do Supabase uma única vez.

alter table usuarios
    add column if not exists tema text not null default 'claro';
