# Sistema de Agentes de Marketplace

Este projeto é uma aplicação Next.js que gerencia produtos e utiliza agentes autônomos (Playwright) para monitorar preços em marketplaces.

## Funcionalidades

*   **Cadastro de Produtos**: Gerencie seus produtos com preço de custo, peso, etc.
*   **Monitoramento**: Dispare buscas automáticas em marketplaces (inicialmente Mercado Livre).
*   **Agentes Autônomos**: O sistema utiliza navegadores headless para buscar dados reais.
*   **Histórico**: Todos os resultados são salvos para análise.

## Como Rodar

1.  **Instalar Dependências**:
    ```bash
    npm install
    npx playwright install chromium
    ```

2.  **Configurar Banco de Dados**:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Rodar a Aplicação**:
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000`.

## Estrutura do Projeto

*   `src/app`: Páginas e Rotas (Next.js App Router).
*   `src/lib`: Lógica dos Agentes (Scraper).
*   `prisma`: Schema do Banco de Dados.

## Notas
*   O agente roda em background. Ao clicar em "Buscar", o processo é iniciado e você pode acompanhar o status na página de Monitoramento.
