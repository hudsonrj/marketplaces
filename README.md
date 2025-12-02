# 🛒 Sistema de Monitoramento de Marketplaces com Agentes IA

Este é um sistema avançado de **Inteligência de Preços e Monitoramento de Marketplaces** desenvolvido com **Next.js 16**, **Playwright** e **Inteligência Artificial**. A aplicação permite cadastrar produtos e utilizar agentes autônomos para varrer grandes e-commerces (Mercado Livre, Amazon, Shopee), coletar dados de preços em tempo real e analisar as ofertas utilizando LLMs (Large Language Models) para garantir a correspondência exata dos produtos.

## 🚀 Funcionalidades Principais

### 1. Gestão de Produtos
*   **CRUD Completo**: Cadastro, edição e remoção de produtos para monitoramento.
*   **Status Ativo/Inativo**: Controle quais produtos devem ser monitorados pelos agentes.
*   **Visão Geral**: Tabela com indicadores rápidos como "Melhor Preço Recente" e contagem de buscas realizadas.

### 2. Agentes de Coleta (Scrapers)
O sistema utiliza o **Playwright** para navegar como um usuário real, superando barreiras comuns de automação.
*   **Multi-Marketplace**:
    *   🟡 **Mercado Livre**: Busca inteligente com ordenação por menor preço, extração de frete, vendedor e localização.
    *   ⚫ **Amazon**: Coleta robusta com detecção de CAPTCHA e extração de detalhes de entrega e parcelamento.
    *   🟠 **Shopee**: Navegação capaz de lidar com popups e carregamento dinâmico de produtos.
*   **Anti-Bot & Stealth**: Implementação de técnicas para evitar bloqueios, como User-Agents rotativos, delays humanizados e rolagem de página natural.

### 3. Inteligência Artificial (AI Core)
A "cérebro" da aplicação utiliza modelos de linguagem (OpenAI GPT-4o, Groq Llama 3, etc.) para processar os dados brutos.
*   **Análise de Correspondência (Match Analysis)**: Cada oferta coletada é analisada pela IA para determinar se corresponde exatamente ao produto alvo.
    *   Gera um **Score de Confiança (0-100)**.
    *   Normaliza nomes de produtos.
    *   Extrai dados geográficos (Cidade/Estado) de textos não estruturados.
*   **Detecção de Duplicidade**: Ao encontrar novos produtos potenciais, a IA verifica semanticamente se eles já existem no banco de dados para evitar cadastros repetidos.
*   **Provedores Configuráveis**: Suporte para **OpenAI**, **Groq**, **OpenRouter** e **DeepSeek**, configuráveis via interface.

### 4. Analytics e Dados
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
