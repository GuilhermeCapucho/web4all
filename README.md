# Web4All

![UNINTER](https://logodownload.org/wp-content/uploads/2020/02/uninter-logo-2.png)

Ciencia da Computacao (UNINTER) - Atividades Extensionistas II - Trabalho Final

Desenvolver uma plataforma web acessivel para inclusao digital de pessoas com deficiencia.

## Stacks
- React + TypeScript
- Vite
- React Router
- Supabase (Auth + Database)
- Docker + Nginx

## Funcionalidades
- Login e cadastro com perfis de aluno e professor
- Agenda de atividades com status, filtros, checklist e lembretes
- Vinculo de alunos para professores e atribuicao de atividades
- Acessibilidade: ajuste de fonte, alto contraste, reduzir animacoes, leitor de tela, lupa de conteudo, destaque de links, espacamento de letras/linhas, filtros para daltonismo
- Comandos de voz para navegacao, atividades e configuracoes de acessibilidade
- Navegacao por teclado com setas

## Acesso de teste (producao)
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
