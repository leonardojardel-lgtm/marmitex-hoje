# Guia de Deploy (Publicação)

Este projeto utiliza **Node.js** com **SQLite** (`better-sqlite3`). Devido ao uso de um banco de dados SQLite nativo (arquivo local), a hospedagem tem requisitos específicos.

## ⚠️ Nota sobre Cloudflare
A **Cloudflare (Workers/Pages)** roda em um ambiente "Edge" que **não suporta** nativamente o banco de dados `better-sqlite3` nem a gravação no sistema de arquivos local da forma que este app faz.
Para rodar na Cloudflare, seria necessário reescrever a camada de banco de dados para usar **Cloudflare D1**.

## ✅ Recomendação: Render ou Railway
Para hospedar este código **exatamente como está**, recomendamos serviços que suportam Node.js completo e persistência de disco, como **Render** ou **Railway**.

### Opção 1: Render.com (Gratuito/Barato)
1. Crie um repositório no GitHub/GitLab com este código.
2. Crie uma conta no [Render.com](https://render.com).
3. Clique em **New +** -> **Web Service**.
4. Conecte seu repositório.
5. Configurações:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. **Importante (Banco de Dados):**
   - No plano gratuito do Render, o disco é efêmero (os dados somem se o servidor reiniciar).
   - Para persistir os dados (alunos, cardápios), você precisa adicionar um **Disk** (pago) no Render e configurar o caminho do banco para ele, ou migrar para um banco externo (como PostgreSQL no Neon.tech ou Supabase).

### Opção 2: Rodar Localmente
Você pode baixar os arquivos e rodar na escola ou no seu computador.

1. Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior).
2. Crie uma pasta e coloque os arquivos do projeto.
3. Abra o terminal na pasta e rode:
   ```bash
   npm install
   npm run build
   npm start
   ```
4. O sistema estará acessível em `http://localhost:3000`.

## Arquivos Essenciais para Copiar
Se você for copiar manualmente, certifique-se de levar:
- `/package.json`
- `/tsconfig.json`
- `/vite.config.ts`
- `/index.html`
- `/server.ts`
- `/server/` (toda a pasta)
- `/src/` (toda a pasta)
- `/public/` (se houver)

## Variáveis de Ambiente
No servidor de produção, configure as variáveis (se necessário):
- `NODE_ENV`: production
- `PORT`: 3000 (ou a porta que o provedor exigir)
