# CS2 Replica — Docker (somente o site do jogo)

Este diretório contém o setup Docker para rodar **apenas o site do jogo**
(`artifacts/3d-game`) — **sem** a API do workspace (`@workspace/api-server`) e
**sem** o banco Postgres.

## Por que a API não é necessária

O jogo é uma aplicação 100% client-side (React + React Three Fiber):

- Não há nenhuma chamada `fetch`/axios para o backend.
- Nenhum arquivo em `artifacts/3d-game/src` importa `@workspace/api-client-react`.
- Mapas, armas e inimigos são gerados por código (sem assets externos).
- A única dependência de rede externa é a fonte Inter do Google Fonts, que é
  opcional (o jogo usa a stack de fallback).

Ou seja, o build de produção é um site estático puro, servido por nginx.

## Uso rápido

```bash
./scripts/docker-game.sh up        # build + start  -> http://localhost:8080
./scripts/docker-game.sh logs -f   # logs
./scripts/docker-game.sh down      # stop
```

Sem usar o script, direto com o compose:

```bash
docker compose up -d --build
docker compose down
```

## Modos

| Modo | Compose | Porta | Descrição |
| --- | --- | --- | --- |
| Produção | `docker compose up -d --build` | 8080 | Build estático do Vite servido por nginx |
| Dev | `docker compose --profile dev up` | 5173 | Vite dev server com hot reload |

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `GAME_PORT` | `8080` | Porta no host para o site de produção |
| `GAME_DEV_PORT` | `5173` | Porta no host para o dev server |
| `GAME_BASE_PATH` | `/` | Sub-path onde o site é publicado (ex.: `/jogo/`) |

Exemplo:

```bash
GAME_PORT=3000 GAME_BASE_PATH=/jogo/ ./scripts/docker-game.sh up
```

## Como funciona

O `docker/Dockerfile` tem três estágios:

1. **`deps`** — `node:24-slim` + pnpm 10.34.7. Instala **somente** os pacotes
   do workspace que o jogo precisa:

   ```bash
   pnpm install --frozen-lockfile --filter "@workspace/3d-game..."
   ```

   O cache do store do pnpm é montado via `--mount=type=cache`, então rebuilds
   não re-baixam as dependências.

2. **`build`** — roda `pnpm --filter @workspace/3d-game run build` (Vite).
   O `vite.config.ts` do projeto exige as variáveis `PORT` e `BASE_PATH`, então
   elas são passadas como `ARG`/`ENV` no estágio. A saída fica em
   `artifacts/3d-game/dist/public`.

3. **`runtime`** — `nginx:1.27-alpine` serve a build estática com:
   - fallback de SPA (`/*` → `/index.html`);
   - cache `immutable` de 1 ano para `/assets/*` (arquivos com hash);
   - `no-store` para o `index.html`;
   - gzip e headers de segurança.

O `nginx:alpine` renderiza `docker/templates/default.conf.template` via
`envsubst` na inicialização, o que permite trocar o `BASE_PATH` sem rebuild.

## Modo dev (hot reload)

O serviço `game-dev` monta o código-fonte em bind mount e mantém o
`node_modules` em volumes nomeados (para não sobrescrever as dependências
instaladas na imagem):

```yaml
volumes:
  - ./artifacts/3d-game:/app/artifacts/3d-game
  - game-dev-root-modules:/app/node_modules
  - game-dev-pkg-modules:/app/artifacts/3d-game/node_modules
```

> **macOS/Windows:** o bind mount do Docker Desktop não propaga eventos de
> inotify, então o HMR pode não atualizar. Nesse caso, use o modo de produção
> com `./scripts/docker-game.sh restart`, ou rode o Vite diretamente na máquina.

## Comandos do `scripts/docker-game.sh`

| Comando | O que faz |
| --- | --- |
| `build` | Compila a imagem Docker do site do jogo |
| `up` | Compila e sobe o container (padrão) |
| `down` | Para e remove os containers |
| `restart` | Recompila e reinicia o container |
| `logs` | Mostra os logs (`-f` para seguir) |
| `status` | Mostra o estado dos containers |
| `shell` | Shell dentro do container em execução |
| `dev` | Sobe o dev server com hot reload |
| `dev-logs` | Mostra os logs do dev server (`-f` para seguir) |
| `dev-down` | Para o dev server |
| `clean` | Remove containers, volumes e imagens do projeto |
| `help` | Ajuda |

## Solução de problemas

- **Porta já em uso** — use `GAME_PORT=3000 ./scripts/docker-game.sh up`.
- **Build lento na primeira vez** — é o download das dependências; as
  próximas builds usam o cache do store do pnpm e das camadas do Docker.
- **Limpar tudo e recomeçar** — `./scripts/docker-game.sh clean`.
