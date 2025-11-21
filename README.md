# BookClub — Frontend consumindo Supabase REST

Objetivo: frontend funcional, responsivo e esteticamente agradável que consome um backend já criado no Supabase via API REST. O tema é um sistema de autores e livros.

## Estrutura do projeto
- index.html — login
- register.html — cadastro
- dashboard.html — área autenticada com CRUD de autores e livros
- config.example.js — exemplo de configuração do Supabase
- js/ — scripts (config.js, auth.js, api.js, dashboard.js)
- images/ — ilustrações opcionais

## Requisitos no Supabase
Crie um projeto no Supabase e adicione duas tabelas mínimas: `authors` e `books`.

### Tabela authors
- id: uuid, primary key, default gen_random_uuid()
- name: text
- bio: text
- country: text
- birthdate: date

### Tabela books
- id: uuid, primary key, default gen_random_uuid()
- title: text
- summary: text
- genre: text
- published_year: integer
- author_id: uuid, foreign key references authors.id

### Script para criação de tabelas
```bash
-- Habilita função para gerar UUIDs (gen_random_uuid)
create extension if not exists "pgcrypto";

-- Tabela authors
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  country text,
  birthdate date,
  created_at timestamptz default now()
);

-- Tabela books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  genre text,
  published_year integer,
  author_id uuid references public.authors(id) on delete set null,
  created_at timestamptz default now()
);

-- Exemplos de dados (opcionais)
insert into public.authors (name, bio, country, birthdate)
values
  ('Clarice Lispector', 'Escritora brasileira, conhecida por prosa introspectiva.', 'Brasil', '1920-12-10'),
  ('Gabriel García Márquez', 'Romancista colombiano, Nobel de Literatura.', 'Colômbia', '1927-03-06');

insert into public.books (title, summary, genre, published_year, author_id)
select 'A Paixão Segundo G. H.', 'Romance existencial e introspectivo.', 'Ficção', 1964, a.id
from public.authors a where a.name ilike 'Clarice Lispector'
limit 1;

insert into public.books (title, summary, genre, published_year, author_id)
select 'Cem Anos de Solidão', 'Saga da família Buendía em Macondo.', 'Realismo Mágico', 1967, a.id
from public.authors a where a.name ilike 'Gabriel García Márquez'
limit 1;

```
Observação: ative/desative Row Level Security (RLS) conforme sua necessidade de desenvolvimento. Para produção, configure políticas RLS para proteger dados.

## Configuração
1. Copie `config.example.js` para `config.js`.
2. Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores do seu projeto Supabase.
3. Abra `index.html` em um servidor local (recomendado usar Live Server ou `npx serve`) ou diretamente no navegador durante desenvolvimento.

## Como funciona a autenticação
- As chamadas para `/auth/v1/signup` e `/auth/v1/token?grant_type=password` são usadas para criar conta e obter token.
- O token é salvo em `localStorage` como `sb_token` e usado como `Authorization: Bearer <token>` nas requisições REST subsequentes.

## Operações CRUD
- `js/api.js` fornece funções genéricas: fetchList, fetchOne, createRecord, updateRecord, deleteRecord.
- Todas as chamadas usam fetch assíncrono e atualizam o DOM sem recarregar a página.

## Boas práticas
- Não comite `config.js` com chaves reais. Use `config.example.js` no repositório.
- Trate erros e mensagens para o usuário, como já implementado nos scripts.

## Testes rápidos
1. Preencha `config.js`.
2. Abra `register.html` e crie um usuário.
3. Faça login em `index.html`.
4. No `dashboard.html` crie autores e livros, edite e exclua, verificando que as operações aparecem sem reload.

## Observações finais
- A interface usa Tailwind via CDN para acelerar o desenvolvimento e garantir responsividade.

- Ajuste estilos, paleta de cores e imagens em `dashboard.html`/CSS conforme preferência.
