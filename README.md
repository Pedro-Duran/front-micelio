# Puredo — Blog com visualização em grafo

Blog pessoal onde posts são nós e referências entre eles são arestas, formando um grafo navegável inspirado no Obsidian e no Quartz.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, React Router 7, react-force-graph |
| Editor | @uiw/react-md-editor + react-markdown |
| Gráficos | Recharts |
| Backend | Spring Boot + Spring Security + JWT (jjwt 0.12.3) |
| Banco | JPA/Hibernate |

## Funcionalidades

- **Grafo por subject** — página inicial agrupa posts por categoria em grafos independentes
- **Página de post** (`/post/:id`) — conteúdo em Markdown com painel lateral mostrando o grafo local (vizinhos 1 hop)
- **Wikilinks** — escrever `[[título]]` no conteúdo cria automaticamente um post stub e o linka ao grafo
- **Nós stub** — posts criados por wikilink aparecem visualmente apagados no grafo até receberem conteúdo
- **Timeline** — painel lateral animado que reconstrói o grafo local em ordem cronológica com download em WebM
- **Analytics** — eventos `VIEW` (duração mínima 10s) e `CLICK_NODE` salvos no backend; dashboard em `/dashboard`
- **Autenticação JWT** — login/cadastro em `/login`; rotas de escrita protegidas; token persistido no localStorage

## Pré-requisitos

- Node.js 18+
- Java 17+
- Backend rodando em `http://localhost:8080`

## Instalação e execução

```bash
npm install
npm start
```

O app abre em `http://localhost:3000`. O proxy CRA já redireciona `/api/*` para `localhost:8080`.

## Rotas

| Rota | Descrição | Protegida |
|---|---|---|
| `/` | Grafos por subject | — |
| `/post/:id` | Leitura do post + grafo local | — |
| `/novoPost` | Formulário de criação | ✅ |
| `/login` | Login e cadastro | — |
| `/dashboard` | Analytics | — |

## Estrutura de pastas relevante

```
src/
├── components/
│   ├── Cabecalho/       # navbar com estado de auth
│   ├── Dashboard/       # gráficos de analytics (recharts)
│   ├── Login/           # login + cadastro com toggle
│   ├── PostPage/        # leitura, edição, grafo local, timeline
│   ├── Timeline/        # animação standalone (rota /timeline)
│   └── newPost/         # formulário de criação com MDEditor
├── context/
│   └── AuthContext.js   # token + username globais via React Context
└── utils/
    ├── analytics.js     # registerEvent com filtro de duração mínima
    └── api.js           # authFetch — injeta Authorization header
```

## Endpoints principais

```
POST /api/auth/login              # retorna JWT
POST /api/users/createUser        # cadastro
GET  /api/posts/verPosts          # lista todos os posts
POST /api/posts/createPost        # cria post (aceita wikilinks[])
PUT  /api/posts/updatePost        # edita post
DELETE /api/posts/deletePost?id=  # remove post
GET  /api/events/summary          # agregado de analytics
POST /api/events/register         # registra evento de sessão
GET  /api/events/referrers        # top referrers (em desenvolvimento)
```
