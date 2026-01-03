# Web4All

![UNINTER](https://logodownload.org/wp-content/uploads/2020/02/uninter-logo-2.png)

Ciencia da Computacao (UNINTER) - Atividades Extensionistas II - Trabalho Final

Desenvolver uma plataforma web acessível para inclusão digital de pessoas com deficiência.

## Stacks
- React + TypeScript
- Vite
- React Router
- Supabase (Auth + Database)
- Docker + Nginx

## Funcionalidades
- Login e cadastro com perfis de aluno e professor
- Agenda de atividades com status, filtros, checklist e lembretes
- Vínculo de alunos para professores e atribuição de atividades
- Acessibilidade: ajuste de fonte, alto contraste, reduzir animações, leitor de tela, lupa de conteúdo, destaque de links, espaçamento de letras/linhas, filtros para daltonismo
- Comandos de voz para navegação, atividades e configurações de acessibilidade (funciona apenas em navegadores Chromium, como Chrome e Edge; não funciona em Firefox, Mozilla e Safari)
- Navegação por teclado com setas e Tab

## Acesso de teste (produção)
- Professor: email `web4allteacher@gmail.com`, senha `admin`
- Aluno: email `web4allstudent@gmail.com`, senha `admin`

## Rodar localmente
1. `cd web4all`
2. `cp .env-example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
3. `npm install`
4. `npm run dev`

Opcional com Docker:
```
docker compose up --build
```
