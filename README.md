# LinkedIn Viral Content SaaS

Plataforma SaaS que ajuda profissionais a criar conteúdo viral para LinkedIn através de um workflow guiado de 7 etapas com IA.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Visão Geral

Uma plataforma web que transforma qualquer profissional em criador de conteúdo para LinkedIn em 10-15 minutos por post. O sistema utiliza Claude AI para gerar conteúdo de alta qualidade com score mínimo de 9.

**Proposta de Valor:** Criação de conteúdo viral baseada em dados, com análise de 318.842 posts reais do LinkedIn.

**Idiomas Suportados:** Português (Brasil) e English (US)

## Funcionalidades Principais

- **Geração de Conteúdo com IA** - Utiliza Anthropic Claude API para gerar hooks, corpo do texto e CTAs
- **Workflow Guiado de 7 Etapas** - Processo passo a passo no Studio para criação de posts
- **Sistema de Scoring** - Posts são avaliados com predições de alcance (Top 1% e Top 5%)
- **Profile Studio** - Configure seu arquétipo de criador, anti-valores, tom de voz e regras de ouro
- **Gerenciamento de Conteúdo** - Dashboard para visualizar, gerenciar e excluir posts criados
- **Autenticação Segura** - Integração com Replit Auth para login seguro
- **Suporte a Temas** - Modo claro/escuro com esquema de cores inspirado no LinkedIn
- **Sistema Bilíngue** - Suporte completo para Português (Brasil) e English (US) com persistência de preferência

## Stack Tecnológico

### Frontend
- **Framework:** React com TypeScript
- **Roteamento:** Wouter
- **Gerenciamento de Estado:** TanStack React Query
- **Estilização:** Tailwind CSS + shadcn/ui
- **Build:** Vite com HMR

### Backend
- **Runtime:** Node.js com Express
- **Linguagem:** TypeScript com ESM modules
- **API:** Endpoints RESTful sob `/api/*`
- **Autenticação:** Replit Auth com OpenID Connect

### Banco de Dados
- **ORM:** Drizzle ORM com PostgreSQL
- **Tabelas Principais:**
  - `users` - Contas de usuário
  - `sessions` - Armazenamento de sessões
  - `contentProfiles` - Dados de onboarding
  - `posts` - Posts gerados com scores
  - `subscriptions` - Status de assinatura
  - `studioSessions` - Sessões de criação em andamento

### Integrações
- **Anthropic Claude API** - Geração de conteúdo
- **Google Analytics 4** - Analytics
- **Meta Pixel** - Tracking de conversões
- **Google Ads** - Tracking de campanhas

## Estrutura do Projeto

```
├── client/                 # Aplicação frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários e helpers
│   │   └── pages/          # Páginas da aplicação
├── server/                 # Servidor Express
│   ├── anthropic.ts        # Integração com Claude AI
│   ├── routes.ts           # Rotas da API
│   └── storage.ts          # Interface de armazenamento
├── shared/                 # Código compartilhado
│   └── schema.ts           # Schemas Drizzle e tipos
└── design_guidelines.md    # Guia de design do sistema
```

## Fluxo da Aplicação

1. **Landing Page (/)** - Página de marketing com preços
2. **Autenticação** - Fluxo OAuth do Replit
3. **Onboarding (/onboarding)** - Setup de perfil em 6 etapas
4. **Dashboard (/dashboard)** - Gerenciamento de posts
5. **Studio (/studio)** - Workflow de criação de conteúdo
6. **Configurações (/settings)** - Gerenciamento de perfil

## Workflow de Criação de Conteúdo

O Studio implementa uma interface estilo chat com 7 etapas:

1. **Briefing** - Seleção de template + input do tópico
2. **Estrutura de Copywriting** - Seleção da estrutura
3. **Tipo de Conteúdo** - Escolha do tipo
4. **Geração de Hook** - 3 opções com regeneração disponível
5. **Geração do Corpo** - Conteúdo principal
6. **Geração de CTA** - 3 opções com regeneração disponível
7. **Validação e Scoring** - Score mínimo de 9 para salvar

### Templates Disponíveis

- **Lição de Carreira** - Estrutura storytelling
- **Conquista Profissional** - Estrutura before-after-bridge
- **História de Fracasso** - Estrutura storytelling
- **Desmistificar Mito** - Estrutura PAS
- **Dica Prática** - Estrutura FAB
- **Opinião de Mercado** - Estrutura AIDA
- **Bastidores do Trabalho** - Estrutura HSO
- **Tema Livre** - Sem restrições

## Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL
- Conta na Anthropic (para API key)

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=postgresql://...

# Anthropic AI
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sua_api_key
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com

# Autenticação
SESSION_SECRET=seu_secret
ISSUER_URL=https://replit.com
REPL_ID=seu_repl_id

# Analytics (opcional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX
VITE_META_PIXEL_ID=XXXXXXXXXXXXXXXX
```

### Executando Localmente

```bash
# Instalar dependências
npm install

# Executar migrações do banco
npm run db:push

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run db:push      # Aplica schema ao banco de dados
npm run db:studio    # Abre Drizzle Studio para gerenciar DB
```

## Design System

### Estilo Visual
- **Abordagem:** Design neo-brutalist com estética flat
- **Componentes:** shadcn/ui (estilo New York)
- **Referências:** Linear, Notion, Claude.ai, Stripe
- **Princípios:** Credibilidade profissional, clareza sobre decoração

### Sistema de Tipografia

O projeto utiliza uma hierarquia de fontes moderna:

- **Satoshi** (via Fontshare CDN): Headings (H1-H6), texto de destaque, texto em fundos coloridos
- **Roboto** (via Google Fonts): Corpo do texto e conteúdo geral

**Classes CSS:**
- `.font-display` - Fonte Satoshi para títulos e destaques
- `.font-body` - Fonte Roboto para corpo de texto
- `.text-on-color` - Satoshi Bold para texto em fundos coloridos (botões, badges)

### Recursos da Landing Page

- **Indicador de progresso de scroll** - Barra de gradiente no topo
- **Animações staggered** - Fade-in progressivo nos elementos
- **Navbar otimizada** - CTA no desktop, menu mobile com animação suave
- **Cards interativos** - Efeito de elevação no hover
- **Timeline minimalista** - Design clean com linha gradiente
- **Carousel mobile** - Scroll horizontal com snap points
- **Suporte safe-area** - Compatível com iPhone notch

## Sistema de Analytics

O projeto inclui tracking completo com dados enriquecidos:

- **User ID** - UUID persistente para análise de cohort
- **Session ID** - UUID por sessão do browser
- **Geolocalização** - País, estado, cidade, timezone
- **Device** - Tipo, OS, browser, tamanho de tela
- **Fonte de Tráfego** - UTM parameters, atribuição first-touch

## Sistema de Internacionalização (i18n)

A aplicação suporta dois idiomas com detecção automática:

- **Português (Brasil)** - Quando o usuário seleciona PT-BR no onboarding
- **English (US)** - Padrão para qualquer outra seleção de idioma

### Funcionamento

1. O idioma é selecionado durante o onboarding (etapa 1)
2. A preferência é salva imediatamente no localStorage
3. Toda a interface é traduzida em tempo real
4. A preferência persiste entre sessões e reloads

### Estrutura de Arquivos

```
client/src/lib/i18n/
├── index.tsx      # LanguageContext e hooks (useTranslation, useLanguage)
├── en-US.json     # Traduções em inglês
└── pt-BR.json     # Traduções em português
```

### Uso nos Componentes

```tsx
import { useTranslation } from "@/lib/i18n";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("dashboard.title")}</h1>;
}
```

## Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

Desenvolvido com React, TypeScript e Claude AI
