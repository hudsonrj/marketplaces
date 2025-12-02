# 🛒 Sistema de Monitoramento de Marketplaces com Agentes IA

Este é um sistema avançado de **Inteligência de Preços e Monitoramento de Marketplaces** desenvolvido com **Next.js 16**, **Playwright** e **Inteligência Artificial**. A aplicação permite cadastrar produtos e utilizar agentes autônomos para varrer grandes e-commerces (Mercado Livre, Amazon, Shopee), coletar dados de preços em tempo real e analisar as ofertas utilizando LLMs (Large Language Models) para garantir a correspondência exata dos produtos.

## 🚀 Funcionalidades Principais

### 1. Gestão de Produtos
*   **CRUD Completo**: Cadastro, edição e remoção de produtos para monitoramento.
*   **Status Ativo/Inativo**: Controle quais produtos devem ser monitorados pelos agentes.
*   **Visão Geral**: Tabela com indicadores rápidos como "Melhor Preço Recente" e contagem de buscas realizadas.

### 2. Marketplaces Suportados
O sistema suporta nativamente os maiores e-commerces do Brasil:
*   🟡 **Mercado Livre**: Busca inteligente com ordenação por menor preço, extração de frete, vendedor e localização.
*   ⚫ **Amazon**: Coleta robusta com detecção de CAPTCHA e extração de detalhes de entrega e parcelamento.
*   🟠 **Shopee**: Navegação capaz de lidar com popups e carregamento dinâmico de produtos.

### 3. Inteligência Artificial (AI Core) & Enriquecimento de Dados
A "cérebro" da aplicação utiliza modelos de linguagem (LLMs) para transformar dados brutos e não estruturados da web em informações precisas e acionáveis.

#### 🧠 Como a IA Refina os Dados
O processo de enriquecimento ocorre em etapas para cada oferta encontrada:

1.  **Análise Semântica (Match Analysis)**:
    *   O scraper envia o título bruto (ex: "Iphone 13 128gb vitrine") e o preço.
    *   A IA compara com o produto alvo (ex: "iPhone 13 128GB Novo") e gera um **Match Score (0-100)**.
    *   **Raciocínio**: A IA fornece uma explicação textual do porquê aquele produto é ou não uma correspondência (ex: "Score 20: O produto encontrado é usado/vitrine, enquanto o alvo é novo").

2.  **Normalização e Extração**:
    *   **Nomes**: Transforma títulos longos de SEO (ex: "Smartphone Apple iPhone 13 128gb Tela 6.1 Câmera Dupla...") em nomes canônicos limpos (ex: "iPhone 13 128GB").
    *   **Geolocalização**: Extrai Cidade e Estado de strings de localização sujas (ex: "Enviado de Vila Mariana, SP" -> City: "São Paulo", State: "SP").

3.  **Descoberta de Novos Produtos**:
    *   Se o agente encontra um produto que é válido mas diferente do alvo (ex: um "iPhone 14" enquanto buscava o "13"), a IA o identifica como um **Candidato a Novo Produto**.
    *   **Verificação de Duplicidade**: Antes de cadastrar, uma segunda camada de IA compara semanticamente este candidato com *todos* os produtos já existentes no banco, evitando duplicatas (ex: reconhece que "Galaxy S23" é o mesmo que "Samsung S23 5G").

### 4. Agentes Autônomos (Scrapers)
Os agentes não são simples scripts de requisição HTTP; são navegadores completos controlados via código.

*   **Navegação Humanizada**: Simulam comportamento humano com rolagens de página (scroll), movimentos de mouse e tempos de espera aleatórios para evitar detecção por sistemas anti-bot.
*   **Resiliência**:
    *   **Shopee**: Lida com popups de marketing e carregamento infinito (infinite scroll).
    *   **Amazon**: Detecta CAPTCHAs e tenta contornar ou alertar.
    *   **Mercado Livre**: Navega por filtros de "Menor Preço" e ignora anúncios patrocinados irrelevantes.
*   **Isolamento**: Cada Job roda em um contexto de navegador isolado (incognito), garantindo que cookies ou sessões anteriores não interfiram nos preços exibidos.

### 5. Analytics e Dados
*   **Dashboard de Evolução**: Gráficos interativos (Recharts) mostrando o histórico de preços (Mínimo e Médio) ao longo do tempo.
*   **DuckDB Integration**: Utiliza DuckDB para processamento analítico de alta performance dos dados históricos.
*   **Histórico de Jobs**: Registro completo de todas as buscas realizadas, com status e resultados detalhados.

## 🛠️ Stack Tecnológica

*   **Frontend**: Next.js 16 (App Router), React 19, Lucide Icons.
*   **Backend**: Server Actions, Prisma ORM.
*   **Banco de Dados**: SQLite (Dados operacionais) + DuckDB (Analytics).
*   **Automação**: Playwright (Chromium Headless/Headful).
*   **AI/LLM**: OpenAI SDK (Integrado com múltiplos providers).
*   **Estilização**: CSS Moderno com design Glassmorphism.

## 📦 Instalação e Configuração

### Pré-requisitos
*   Node.js 18+
*   NPM ou Yarn

### Passo a Passo

1.  **Clone o repositório e instale as dependências**:
    ```bash
    npm install
    ```

2.  **Instale os navegadores do Playwright**:
    ```bash
    npx playwright install chromium
    ```

3.  **Configure o Banco de Dados**:
    ```bash
    npx prisma migrate dev --name init
    ```

4.  **Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz (opcional se for configurar a IA pela interface, mas recomendado para chaves padrão):
    ```env
    DATABASE_URL="file:./dev.db"
    OPENAI_API_KEY="sua-chave-aqui"
    ```

5.  **Inicie o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000` no seu navegador.

## 🖥️ Estrutura do Projeto

*   `src/app`: Rotas e páginas da aplicação (Next.js App Router).
    *   `/products`: Listagem e gestão de produtos.
    *   `/products/[id]/analytics`: Dashboard de análise de preços.
    *   `/settings`: Configuração de provedores de IA.
*   `src/lib`: Núcleo da lógica de negócios.
    *   `scraper.ts`: Lógica dos agentes de coleta (Playwright).
    *   `ai.ts`: Integração com LLMs para análise de dados.
    *   `duckdb.ts`: Consultas analíticas otimizadas.
*   `prisma`: Schema do banco de dados e migrações.

## 📝 Notas de Uso

*   **Execução dos Agentes**: Ao iniciar uma busca ("Job"), o sistema pode abrir uma janela do navegador (se configurado como `headless: false` para debug) ou rodar em segundo plano.
*   **Custos de IA**: O sistema consome tokens da API configurada (OpenAI/Groq) para cada produto analisado. Recomenda-se o uso de modelos eficientes como `gpt-4o-mini` ou `llama-3-70b` via Groq para menor custo e alta velocidade.
