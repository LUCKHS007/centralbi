-- ============================================================
-- CENTRAL BI - Schema + Seed do Supabase
-- Rode este arquivo inteiro no SQL Editor do Supabase (projeto novo).
-- RLS fica ligado e SEM policies: só a service_role (usada pelas
-- Netlify Functions) consegue ler/escrever. O front-end nunca
-- acessa o Supabase diretamente.
-- ============================================================

create table usuarios (
    id uuid primary key default gen_random_uuid(),
    usuario text unique not null,
    senha_hash text not null,
    nome text not null,
    cargo text not null,
    ativo boolean not null default true
);

create table dashboards (
    id text primary key,
    titulo text not null,
    categoria text not null,
    descricao text,
    icone text,
    link text not null,
    permissao text
);

create table links_externos (
    id text primary key,
    titulo text not null,
    descricao text,
    icone text,
    url text,
    permissao text
);

create table permissoes_cargo (
    cargo text not null,
    permissao text not null,
    primary key (cargo, permissao)
);

alter table usuarios enable row level security;
alter table dashboards enable row level security;
alter table links_externos enable row level security;
alter table permissoes_cargo enable row level security;
-- Nenhuma policy criada de propósito: só a service_role (bypassa RLS)
-- consegue acessar essas tabelas.

-- ============================================================
-- Seed: dashboards (de bi.js)
-- ============================================================
insert into dashboards (id, titulo, categoria, descricao, icone, link, permissao) values
('vendas', 'Vendas', 'Comercial', 'Indicadores de Vendas', 'fa-industry', 'https://app.powerbi.com/links/u47GHQ2puZ?ctid=fc117d7c-71f2-4cc0-966a-64f3fe98e179&pbi_source=linkShare', null),
('vendas-encarregados', 'Vendas Encarr.', 'Comercial', 'Indicadores de Vendas para Encarregados', 'fa-chart-line', 'https://app.powerbi.com/view?r=eyJrIjoiMzA4Mjc4NTktMWQyZS00NTkzLWFhZWUtMWM4ZjVmOWU0MDE1IiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('dashboard-geral', 'Dashboard Geral', 'Comercial', 'Indicadores Gerais', 'fa-coins', 'https://app.powerbi.com/view?r=eyJrIjoiNzg1OGNkNjYtYTAzZC00YjQ2LWI2MGQtZTQ0YTI0OTNjNTIwIiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('manutencoes', 'Manutenções', 'Manutenção', 'Controle de Manutenções', 'fa-screwdriver-wrench', 'https://app.powerbi.com/view?r=eyJrIjoiYTU1ZGI3ZjktMDFiYy00OGQ0LWEwNTktOThlMDMyNmQ2MTRkIiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('atestados', 'Atestados', 'RH', 'Indicadores de RH', 'fa-users', 'https://app.powerbi.com/view?r=eyJrIjoiNzA5NmFiNDItNDVlYS00ZTM5LWFkMmEtNDFjNTI3NDg0ZjNmIiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('explosivos', 'Explosivos', 'Produção', 'Processo de Explosivos', 'fa-mountain', 'https://app.powerbi.com/view?r=eyJrIjoiNDU0MGYzMTEtMzhlYS00NTYzLWEzNjQtOGMwMTFmM2E0NDc3IiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('maq-eletricas', 'Maquinas Elétricas', 'Manutenção', 'Informações sobre as máquinas elétricas', 'fa fa-recycle', 'https://app.powerbi.com/view?r=eyJrIjoiYTNjYmMyZjEtMzZjNi00ZjQxLTk5MzUtZTFjODM3MTMyOTE1IiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', null),
('oficina', 'Oficina', 'Manutenção', 'Controle de Oficina', 'fa fa-wrench', 'https://app.powerbi.com/view?r=eyJrIjoiNDRlMDE0YWYtMzI0NS00OTZiLWFkOGQtYTgzMmFmYWNlNGMwIiwidCI6ImZjMTE3ZDdjLTcxZjItNGNjMC05NjZhLTY0ZjNmZTk4ZTE3OSJ9', 'Oficina');

-- ============================================================
-- Seed: links externos (de links.js)
-- ============================================================
insert into links_externos (id, titulo, descricao, icone, url, permissao) values
('gtfrota', 'GtFrota', 'Relatório de abastecimento (GTFROTA)', 'fa-gas-pump', '', null),
('fluig', 'Fluig', 'Abrir chamado com a TI ou lançar atestado (Fluig)', 'fa-headset', '', null),
('miro', 'Miro', 'Quadro colaborativo', 'fa-diagram-project', 'https://miro.com/welcomeonboard/ZG8yUFk2Q2c2TWFUWUt2WWpHTHpKNWVNOUZsQlh0UHZSVXhZZFcrQnZDVGdmakhvem1SMG1ES3VRb3oyTHVxdklpeFRUemlwc0hzMSs1cTNNK3Z4MVBZVDFFWWtOVk1KZ21HNTJQWUFkMkFNK3k1a0dMRURiVTRIcUdRVEJyd3lhWWluRVAxeXRuUUgwWDl3Mk1qRGVRPT0hdjE=?share_link_id=781713221351', null);

-- ============================================================
-- Seed: permissões por cargo (de permissoes.js)
-- "*" = acesso total (equivalente a ACESSO_TOTAL)
-- ============================================================
insert into permissoes_cargo (cargo, permissao) values
('Diretor', '*'),
('Administrador', '*'),
('Gerente', '*'),
('Encarregado_Geral', '*'),
('Controle', '*'),
('Compras', '#'),
('Recepcao', 'atestados'),
('Encarregado_Rocha', 'vendas-encarregados'),
('Encarregado_Rocha', 'maq-eletricas'),
('Encarregado_Rocha', 'Manutenção'),
('Encarregado_Setor', 'vendas-encarregados'),
('Encarregado_Setor', 'Oficina'),
('Encarregado_Setor', 'Manutenção'),
('Mecânico', 'Oficina'),
('Mecânico', 'Manutenção'),
('Operador', 'Produção'),
('Vendedor', 'vendas');

-- ============================================================
-- Seed: usuários (de usuarios.js, com senha_hash em bcrypt)
-- Gerado por scripts/gerar-seed.js - as senhas em texto claro
-- foram impressas no terminal na hora da geração, não estão em
-- nenhum arquivo do repositório. Troque-as no primeiro acesso.
-- ============================================================
insert into usuarios (usuario, senha_hash, nome, cargo, ativo) values
('admin.net', '$2a$10$tVTWQ3LW2GJukc9nXJrAke8dsXxU/GPNANxxwnb8iQLYuokI6MLY6', 'Administrador', 'Administrador', true),
('andre.sargon', '$2a$10$4Dv47L4OMyMO8vnLiFvtYeATdnWWUzuTKXGk0uy5xy12Yrje/2e5i', 'André Saraiva', 'Diretor', true),
('joao.sargon', '$2a$10$My9DbqrVgr6d8Nu6wuthmuq4SxxKbU2y5CxFmCEy2Z/dYY0fu4kXW', 'João Araújo', 'Gerente', true),
('ronaldo.sargon', '$2a$10$d0Ijoo8UhMmCfLVdEd2RSOUbQLZZ1c44acQEDQaddZGUZWpS.Gdb.', 'Ronaldo', 'Encarregado_Geral', true),
('ana.sargon', '$2a$10$lCJcq9JaRjoEA/JO.t756u6EEUETe.3SdI5G07ZczTQSqR/g5sqve', 'Ana Stabile', 'Recepcao', true),
('renan.sargon', '$2a$10$HLGz57iL3hZ9Iwv7ddjhTuuhWNMagzJreAN1oK8czTiDcsgZmKcAe', 'Renan Pedro', 'Controle', true),
('katriel.sargon', '$2a$10$ZXe5xsVT/16llNj7J.34suZNgUFxP7NxgQFdRuAm/lUDgkeo28E66', 'Katriel Machado', 'Controle', true),
('lucas.sargon', '$2a$10$TSrqIgsfVfc./k8l.80CN..fHgukpqwK0iepEYLkucAOYUVDDIQou', 'Lucas Ferreira', 'Controle', true),
('carlos.sargon', '$2a$10$LoBVKgDOEOF9jHTZFtwCT.P4H0ijYbsJi2x0UrIhAPo8xtqdGCttC', 'Carlos Mec.', 'Encarregado_Setor', true),
('elison.sargon', '$2a$10$kRA.Hp2V7qMFMNkB.YSS6eJ6H8ySTC9MkePNw9fNQCg1xtSntUx1i', 'Elison Ensac.', 'Encarregado_Setor', true),
('luis.sargon', '$2a$10$77uOSJyKPZffhskUg7vuq.gMHGJyLeorXQplDZ2MsjpvWxqoBj7xG', 'Luis Brit.', 'Encarregado_Setor', true),
('ricardo.sargon', '$2a$10$khkPubEkbxhihpJES3YFeO/4v4dGYFpa7DvmHV.9vJOP995UG3xMO', 'Ricardo Eletr.', 'Encarregado_Setor', true),
('jadson.sargon', '$2a$10$7shSH2WtZbwskc2/EbYnhe2sXXF8X8m0SP92aszXt0SB31po8L8eG', 'Jadson Roch.', 'Encarregado_Setor', true),
('matheus.sargon', '$2a$10$07kucSYoSJJymG.oh59t8uqhuuQeqTuNf2oOTBuRl4NIKVGORNwI2', 'Matheus Mec.', 'Mecânico', true),
('julia', '$2a$10$JFmwIDCyHFGFu7mGyY2K6exOs04wykd59j2pIgqpmZAupKqhOId6O', 'Julia Lima', 'Operador', true);
