# 🚔 Operação Lei Seca - DETRAN-MT

Este repositório contém a aplicação de cadastro e painel analítico para a **Operação Lei Seca** do DETRAN-MT. A aplicação foi estruturada para ser implantada de forma serverless no **Cloudflare Pages** utilizando o banco de dados relacional **Cloudflare D1**.

---

## 🏗️ Estrutura do Projeto

O projeto segue o padrão do Cloudflare Pages com Functions:

```
├── public/                 # Contém o frontend estático (HTML, CSS, JS)
│   └── index.html          # Interface principal do app (Wizard de cadastro e Painel Admin)
├── functions/              # Backend serverless (Cloudflare Pages Functions)
│   └── api/
│       ├── login.js        # Autenticação de administradores
│       ├── agentes.js      # Listagem, cadastro e aprovação de agentes/policiais
│       ├── infracoes.js    # Ativação/desativação e listagem de infrações
│       ├── consulta.js     # Integração para consulta de CPF e Placa do veículo
│       ├── abordagens.js   # Registro de novas abordagens e listagem para estatísticas
│       ├── dashboard.js    # KPIs e agregação de dados para os gráficos
│       └── export.js       # Exportação dos dados consolidados em CSV para Excel
├── schema.sql              # Estrutura do banco de dados D1 (SQLite compilado do Cloudflare)
├── wrangler.toml           # Arquivo de configuração do Cloudflare Pages e banco D1
└── README.md               # Este arquivo de documentação
```

---

## ⚡ Desenvolvimento Local (Simulação)

Para testar a aplicação localmente na sua máquina utilizando o emulador do Cloudflare (Wrangler):

1. **Instalar dependências (se necessário):**
   Não há dependências externas complexas além do próprio Wrangler:
   ```bash
   npm install wrangler --save-dev
   ```

2. **Inicializar o banco de dados localmente:**
   Execute a migração do arquivo `schema.sql` para o banco de dados simulado local:
   ```bash
   npx wrangler d1 execute leiseca_db --local --file=./schema.sql
   ```

3. **Rodar o servidor local de desenvolvimento:**
   Inicie o servidor de desenvolvimento apontando a pasta do frontend e conectando a D1:
   ```bash
   npx wrangler pages dev ./public --d1 DB
   ```
   A aplicação estará disponível em `http://localhost:8788`.

---

## 🌐 Publicação no Cloudflare (Produção)

Siga os passos abaixo para publicar o sistema em ambiente de produção:

### Passo 1: Autenticar no Cloudflare Wrangler
No terminal, execute o comando abaixo para fazer login na sua conta do Cloudflare:
```bash
npx wrangler login
```
*Uma janela do navegador se abrirá solicitando autorização.*

### Passo 2: Criar o Banco de Dados D1 na Nuvem
Crie o banco de dados real na nuvem do Cloudflare executando:
```bash
npx wrangler d1 create leiseca_db
```
O terminal exibirá informações semelhantes a estas:
```toml
[[d1_databases]]
binding = "DB"
database_name = "leiseca_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Passo 3: Configurar o `wrangler.toml`
Abra o arquivo [wrangler.toml](file:///c:/Users/vitorio.neto/Documents/Vit%C3%B3rio%20PC/Francisco/wrangler.toml) e substitua a linha `database_id = "CHANGE_ME_AFTER_CREATING_DATABASE"` pelo valor do `database_id` gerado no Passo 2.

### Passo 4: Executar as Migrações na Nuvem (Produção)
Crie as tabelas e insira os dados iniciais (incluindo o usuário admin) no banco de dados de produção da nuvem:
```bash
npx wrangler d1 execute leiseca_db --remote --file=./schema.sql
```

### Passo 5: Publicar no Cloudflare Pages
Envie os arquivos de frontend e backend para a nuvem do Cloudflare para publicação instantânea:
```bash
npx wrangler pages deploy ./public
```
*O console retornará a URL pública da sua aplicação.*

---

## 🔒 Credenciais de Administrador (Primeiro Acesso)

- **Usuário:** `francisco.xavier`
- **Senha:** `abc123`

*Após o login inicial no Painel Master (ícone de cadeado), você pode cadastrar e aprovar novos policiais/agentes de trânsito pela aba **Gestão**.*

---

## 🔍 Consulta de CPF e Placa
Os endpoints `/api/consulta` estão prontos para simular as buscas. 
- Se o CPF ou Placa já existir no banco D1 local, ele retornará os dados históricos.
- Se for um CPF/Placa novo, ele gerará dados de teste realistas automaticamente e salvará no banco de dados, enriquecendo o cache.
- **Para integração real:** O arquivo `functions/api/consulta.js` centraliza essas buscas. Basta substituir o trecho gerador de dados por uma chamada `fetch()` direcionada à API de preferência do órgão (Detran, Sinesp ou Serpro).
