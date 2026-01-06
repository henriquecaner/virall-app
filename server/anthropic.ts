import Anthropic from "@anthropic-ai/sdk";
import type { ContentProfile, Post } from "@shared/schema";
import { buildContentLibraryContext } from "./contentLibrary";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_SECRET!,
});

const MODEL = "claude-opus-4-5-20251101";
const THINKING_BUDGET = 10000;

interface ProfileContext {
  industry: string;
  professionalDescription: string;
  targetAudience: string[];
  topics: string[];
  jobTitle: string;
  language: string;
  creatorArchetype?: string | null;
  antiValues?: string[];
  toneFormality?: number;
  toneHumor?: number;
  toneDepth?: number;
  toneEmotion?: number;
  goldenRules?: string | null;
}

function getArchetypeName(id: string | null | undefined): string {
  const archetypes: Record<string, string> = {
    builder: "O Construtor - Mão na massa, zero PowerPoint, só execução",
    thinker: "O Pensador - Frameworks, análise profunda, conectando os pontos",
    storyteller: "O Contador de Histórias - Narrativas autênticas, vulnerabilidade",
    educator: "O Educador - Ensina de verdade, sem vender, conteúdo denso",
    scientist: "O Cientista - Dados, experimentos, evidências, ceticismo saudável",
  };
  return id ? archetypes[id] || id : "";
}

function getAntiValueLabels(ids: string[] | undefined): string {
  const labels: Record<string, string> = {
    "self-promotion": "Auto-promoção excessiva",
    "empty-content": "Conteúdo vazio / hacks mágicos",
    "corporate-jargon": "Jargão corporativo",
    "stage-gurus": "Gurus de palco vendendo cursos",
    "no-data": "Falta de dados reais",
    "fake-humility": "Falsa humildade",
    "unrealistic-promises": "Promessas irrealistas",
  };
  return ids?.map(id => labels[id] || id).join(", ") || "";
}

function getToneDescription(value: number | undefined, leftLabel: string, rightLabel: string): string {
  const v = value ?? 5;
  if (v <= 3) return leftLabel;
  if (v >= 7) return rightLabel;
  return "Equilibrado";
}

function buildProfileContext(profile: ProfileContext): string {
  let context = `
PERFIL DO CRIADOR:
- Cargo: ${profile.jobTitle}
- Indústria: ${profile.industry}
- Descrição profissional: ${profile.professionalDescription}
- Público-alvo: ${profile.targetAudience.join(", ")}
- Tópicos de interesse: ${profile.topics.join(", ")}
- Idioma: ${profile.language === "pt-BR" ? "Português (Brasil)" : profile.language}
`;

  if (profile.creatorArchetype) {
    context += `
PERSONALIDADE DO CRIADOR:
- Arquétipo: ${getArchetypeName(profile.creatorArchetype)}`;
  }

  if (profile.antiValues && profile.antiValues.length > 0) {
    context += `
- O que EVITAR no conteúdo: ${getAntiValueLabels(profile.antiValues)}`;
  }

  const hasCustomTones = 
    profile.toneFormality !== undefined && profile.toneFormality !== 5 ||
    profile.toneHumor !== undefined && profile.toneHumor !== 5 ||
    profile.toneDepth !== undefined && profile.toneDepth !== 5 ||
    profile.toneEmotion !== undefined && profile.toneEmotion !== 5;

  if (hasCustomTones) {
    context += `
- Tom de Voz:
  - Formalidade: ${getToneDescription(profile.toneFormality, "Corporativo", "Casual")}
  - Humor: ${getToneDescription(profile.toneHumor, "Sério", "Irônico")}
  - Profundidade: ${getToneDescription(profile.toneDepth, "Acessível", "Técnico")}
  - Emoção: ${getToneDescription(profile.toneEmotion, "Racional", "Vulnerável")}`;
  }

  if (profile.goldenRules) {
    context += `
- Regras de Ouro (NUNCA quebrar): ${profile.goldenRules}`;
  }

  return context + "\n";
}

function extractTextFromResponse(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  throw new Error("No text content found in response");
}

const HOOK_STYLE_SETS = [
  ["pergunta provocativa", "dado estatístico surpreendente", "afirmação contraintuitiva"],
  ["história pessoal curta", "observação de mercado", "desafio direto ao leitor"],
  ["analogia inesperada", "confissão vulnerável", "previsão ousada"],
  ["problema identificado", "mito desmascarado", "lição aprendida na prática"],
  ["citação adaptada", "contradição do senso comum", "comando direto"],
];

function getRandomHookStyles(): string[] {
  const setIndex = Math.floor(Math.random() * HOOK_STYLE_SETS.length);
  return HOOK_STYLE_SETS[setIndex];
}

function buildAudienceFocusedHookGuidance(objective?: string, desiredFeeling?: string): string {
  let guidance = "";
  
  if (desiredFeeling) {
    const feelingMap: Record<string, string> = {
      "curiosidade": "Use mistério, perguntas abertas, ou revele algo parcialmente para criar urgência de saber mais",
      "inspiração": "Mostre possibilidade, transformação ou superação desde a primeira linha",
      "inspirar": "Mostre possibilidade, transformação ou superação desde a primeira linha",
      "urgência": "Crie senso de perda iminente, oportunidade limitada ou mudança inevitável",
      "urgente": "Crie senso de perda iminente, oportunidade limitada ou mudança inevitável",
      "identificação": "Descreva uma situação que o leitor vive mas raramente verbaliza",
      "identificar": "Descreva uma situação que o leitor vive mas raramente verbaliza",
      "reflexão": "Faça uma pergunta que force o leitor a pausar e pensar sobre sua própria situação",
      "refletir": "Faça uma pergunta que force o leitor a pausar e pensar sobre sua própria situação",
      "provocação": "Desafie uma crença comum ou faça uma afirmação controversa que exija resposta",
      "provocar": "Desafie uma crença comum ou faça uma afirmação controversa que exija resposta",
      "paixão": "Use linguagem intensa, visceral - mostre transformação dramática ou resultado excepcional",
      "paixao": "Use linguagem intensa, visceral - mostre transformação dramática ou resultado excepcional",
      "tesão": "Crie desejo irresistível de saber mais - prometa revelação impactante",
      "tesao": "Crie desejo irresistível de saber mais - prometa revelação impactante",
      "vontade": "Desperte a ação imediata - mostre o que está em jogo e o que podem conquistar",
      "confiança": "Apresente autoridade e credibilidade desde o início - use dados ou resultados concretos",
      "confianca": "Apresente autoridade e credibilidade desde o início - use dados ou resultados concretos",
      "medo": "Exponha o risco real que o leitor corre ao ignorar - seja específico sobre consequências",
      "ansiedade": "Reconheça a dor atual e prometa alívio - mostre que entende a situação",
      "esperança": "Mostre luz no fim do túnel - comece com possibilidade mesmo em cenário difícil",
      "esperanca": "Mostre luz no fim do túnel - comece com possibilidade mesmo em cenário difícil",
      "raiva": "Valide a frustração do leitor - aponte o culpado ou o problema sistêmico",
      "indignação": "Exponha uma injustiça ou absurdo que o leitor precisa conhecer",
      "indignacao": "Exponha uma injustiça ou absurdo que o leitor precisa conhecer",
      "surpresa": "Quebre expectativas com dado contraintuitivo ou revelação inesperada",
      "choque": "Comece com afirmação impactante que force releitura",
      "empatia": "Mostre vulnerabilidade ou situação compartilhada - conecte-se humanamente",
      "autoridade": "Apresente credencial, dado ou resultado que estabeleça expertise imediata",
    };
    
    const feelingLower = desiredFeeling.toLowerCase();
    for (const [key, value] of Object.entries(feelingMap)) {
      if (feelingLower.includes(key)) {
        guidance += `\nABORDAGEM PARA SENTIMENTO "${desiredFeeling.toUpperCase()}": ${value}`;
        break;
      }
    }
  }
  
  if (objective) {
    guidance += `\nFOCO NO PÚBLICO: O gancho deve falar DIRETAMENTE com "${objective}" - use linguagem, dores e aspirações específicas desse grupo.`;
  }
  
  return guidance;
}

export async function generateHooks(
  profile: ProfileContext,
  topic: string,
  structure: string,
  contentType: string,
  objective?: string,
  desiredFeeling?: string
): Promise<string[]> {
  const profileContext = buildProfileContext(profile);
  const variationSeed = Date.now() % 10000;
  const hookStyles = getRandomHookStyles();
  const audienceGuidance = buildAudienceFocusedHookGuidance(objective, desiredFeeling);

  const briefingContext = objective || desiredFeeling ? `
CONTEXTO DO BRIEFING (PRIORIDADE ALTA):
${objective ? `- Objetivo do post e público-alvo: ${objective}` : ""}
${desiredFeeling ? `- Sentimento desejado no leitor: ${desiredFeeling}` : ""}
${audienceGuidance}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}

${buildContentLibraryContext()}
${briefingContext}

Você é um especialista em copywriting para LinkedIn com foco em criar ganchos (hooks) virais.

[SEED DE VARIAÇÃO: ${variationSeed}] - Use este número como inspiração criativa para garantir originalidade.

Crie 3 ganchos DIFERENTES e IMPACTANTES para um post sobre "${topic}".

ESTRUTURA DE COPYWRITING: ${structure}
TIPO DE CONTEÚDO: ${contentType}

🎯 ESTILOS OBRIGATÓRIOS PARA CADA GANCHO:
- Gancho 1: Estilo "${hookStyles[0]}"
- Gancho 2: Estilo "${hookStyles[1]}"  
- Gancho 3: Estilo "${hookStyles[2]}"

REGRAS PARA OS GANCHOS:
1. Máximo 2 linhas (140 caracteres)
2. CADA gancho DEVE usar um estilo completamente diferente dos outros
3. Devem gerar curiosidade ou emoção forte específica ao sentimento desejado
4. PROIBIDO: "Você sabia que...", "X% das pessoas...", "O segredo que...", "Ninguém te conta...", "A verdade sobre..."
5. Use dados específicos quando possível, mas varie a forma de apresentá-los
6. Crie tensão ou quebra de padrão RELEVANTE para o público-alvo
7. Linguagem natural, não robótica - como uma conversa real com ${profile.targetAudience.join(" ou ")}
8. O gancho deve fazer o leitor ${desiredFeeling ? `sentir ${desiredFeeling}` : "parar o scroll"}
9. Adapte o VOCABULÁRIO e REFERÊNCIAS ao universo do público-alvo

FORMATO DE RESPOSTA:
Retorne APENAS os 3 ganchos, um por linha, numerados de 1 a 3.
Não inclua explicações.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  const hooks = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((hook) => hook.length > 0)
    .slice(0, 3);

  return hooks;
}

export async function generateBody(
  profile: ProfileContext,
  topic: string,
  structure: string,
  contentType: string,
  hook: string,
  objective?: string,
  desiredFeeling?: string
): Promise<string> {
  const profileContext = buildProfileContext(profile);
  const audienceGuidance = buildAudienceFocusedHookGuidance(objective, desiredFeeling);

  const briefingContext = objective || desiredFeeling ? `
CONTEXTO DO BRIEFING (PRIORIDADE ALTA):
${objective ? `- Objetivo do post e público-alvo: ${objective}` : ""}
${desiredFeeling ? `- Sentimento desejado no leitor: ${desiredFeeling}` : ""}
${audienceGuidance}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}
${briefingContext}

Você é um especialista em copywriting para LinkedIn.

GANCHO SELECIONADO:
"${hook}"

TÓPICO: ${topic}
ESTRUTURA: ${structure}
TIPO DE CONTEÚDO: ${contentType}

Escreva o CORPO do post (sem o gancho e sem CTA).

REGRAS:
1. Entre 800-1200 caracteres
2. Siga a estrutura ${structure}
3. Use quebras de linha para facilitar leitura
4. Inclua dados, exemplos ou histórias relevantes para ${profile.targetAudience.join(" e ")}
5. Mantenha o tom do perfil
6. Use linguagem e referências do universo do público-alvo
7. Seja específico e prático - evite generalidades
8. Use listas ou bullets quando apropriado
9. O conteúdo deve CONSTRUIR o sentimento "${desiredFeeling || "engajamento"}" progressivamente
10. Cada parágrafo deve manter o leitor querendo ler o próximo

FORMATO:
Retorne APENAS o corpo do post, sem gancho e sem CTA.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);
  return text.trim();
}

const CTA_STYLE_SETS = [
  ["pergunta reflexiva", "convite para ação específica", "provocação com escolha"],
  ["pedido de experiência pessoal", "desafio ao leitor", "convite para debate"],
  ["pergunta de opinião polarizada", "compartilhamento com propósito", "call direto para networking"],
];

function getRandomCTAStyles(): string[] {
  const setIndex = Math.floor(Math.random() * CTA_STYLE_SETS.length);
  return CTA_STYLE_SETS[setIndex];
}

export async function generateCTAs(
  profile: ProfileContext,
  body: string,
  hook: string,
  objective?: string,
  desiredFeeling?: string
): Promise<string[]> {
  const profileContext = buildProfileContext(profile);
  const variationSeed = Date.now() % 10000;
  const ctaStyles = getRandomCTAStyles();
  const audienceGuidance = buildAudienceFocusedHookGuidance(objective, desiredFeeling);

  const briefingContext = objective || desiredFeeling ? `
CONTEXTO DO BRIEFING (PRIORIDADE ALTA):
${objective ? `- Objetivo do post e público-alvo: ${objective}` : ""}
${desiredFeeling ? `- Sentimento desejado no leitor: ${desiredFeeling}` : ""}
${audienceGuidance}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}

${buildContentLibraryContext()}
${briefingContext}

[SEED DE VARIAÇÃO: ${variationSeed}]

Você é um especialista em CTAs (chamadas para ação) para LinkedIn.

POST ATUAL:
Gancho: "${hook}"

Corpo:
${body}

Crie 3 CTAs DIFERENTES para finalizar o post.

🎯 ESTILOS OBRIGATÓRIOS:
- CTA 1: Estilo "${ctaStyles[0]}"
- CTA 2: Estilo "${ctaStyles[1]}"
- CTA 3: Estilo "${ctaStyles[2]}"

REGRAS:
1. Máximo 2 linhas cada
2. PROIBIDO: "E você, o que acha?", "Deixe seu comentário", "Curta e compartilhe", "Me conta nos comentários"
3. Faça perguntas ESPECÍFICAS que exijam uma resposta pensada
4. Use linguagem do universo de ${profile.targetAudience.join(" e ")}
5. O CTA deve CONCLUIR a jornada emocional de "${desiredFeeling || "engajamento"}"
6. Conecte diretamente ao ponto central do post
7. Cada CTA deve propor uma ação ou reflexão DIFERENTE

FORMATO:
Retorne APENAS os 3 CTAs, um por linha, numerados de 1 a 3.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  const ctas = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((cta) => cta.length > 0)
    .slice(0, 3);

  return ctas;
}

interface ScoreResult {
  score: number;
  hookScore: number;
  structureScore: number;
  dataScore: number;
  ctaScore: number;
  algorithmScore: number;
  top1Probability: number;
  top5Probability: number;
  bestPostingDay: string;
  bestPostingTime: string;
  feedback: string;
}

export async function scorePost(
  hook: string,
  body: string,
  cta: string,
  structure: string,
  contentType: string
): Promise<ScoreResult> {
  const fullPost = `${hook}\n\n${body}\n\n${cta}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `Você é um especialista em análise de performance de posts no LinkedIn.

Analise o seguinte post e forneça uma avaliação detalhada:

POST:
${fullPost}

ESTRUTURA USADA: ${structure}
TIPO DE CONTEÚDO: ${contentType}

Avalie cada critério de 0 a 10:
1. HOOK (gancho): Capacidade de parar o scroll
2. ESTRUTURA: Uso correto da estrutura escolhida
3. DADOS: Presença de dados, exemplos ou histórias concretas
4. CTA: Eficácia da chamada para ação
5. ALGORITMO: Otimização para o algoritmo do LinkedIn (formatação, tamanho, engajamento)

FORMATO DE RESPOSTA (JSON):
{
  "hookScore": X,
  "structureScore": X,
  "dataScore": X,
  "ctaScore": X,
  "algorithmScore": X,
  "score": X (média ponderada),
  "top1Probability": X (porcentagem 0-100),
  "top5Probability": X (porcentagem 0-100),
  "bestPostingDay": "terça" ou similar,
  "bestPostingTime": "08:00" formato HH:MM,
  "feedback": "Uma frase com feedback principal"
}

Retorne APENAS o JSON, sem texto adicional.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const result = JSON.parse(jsonMatch[0]) as ScoreResult;

    const score = (
      result.hookScore * 0.25 +
      result.structureScore * 0.2 +
      result.dataScore * 0.2 +
      result.ctaScore * 0.15 +
      result.algorithmScore * 0.2
    );
    result.score = Math.round(score * 10) / 10;

    return result;
  } catch (error) {
    return {
      score: 7.0,
      hookScore: 7,
      structureScore: 7,
      dataScore: 7,
      ctaScore: 7,
      algorithmScore: 7,
      top1Probability: 15,
      top5Probability: 40,
      bestPostingDay: "terça",
      bestPostingTime: "08:00",
      feedback: "Avaliação automática não disponível",
    };
  }
}

export async function regenerateHook(
  profile: ProfileContext,
  topic: string,
  structure: string,
  contentType: string,
  previousHooks: string[],
  objective?: string,
  desiredFeeling?: string
): Promise<string[]> {
  const profileContext = buildProfileContext(profile);
  const variationSeed = Date.now() % 10000;
  const hookStyles = getRandomHookStyles();
  const audienceGuidance = buildAudienceFocusedHookGuidance(objective, desiredFeeling);

  const briefingContext = objective || desiredFeeling ? `
CONTEXTO DO BRIEFING (PRIORIDADE ALTA):
${objective ? `- Objetivo do post e público-alvo: ${objective}` : ""}
${desiredFeeling ? `- Sentimento desejado no leitor: ${desiredFeeling}` : ""}
${audienceGuidance}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}
${briefingContext}

[SEED DE VARIAÇÃO: ${variationSeed}] - Use para garantir originalidade.

Você é um especialista em copywriting para LinkedIn.

GANCHOS JÁ USADOS (PROIBIDO repetir estrutura ou padrão similar):
${previousHooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Crie 3 NOVOS ganchos RADICALMENTE DIFERENTES para um post sobre "${topic}".

ESTRUTURA: ${structure}
TIPO: ${contentType}

🎯 ESTILOS OBRIGATÓRIOS:
- Gancho 1: Estilo "${hookStyles[0]}"
- Gancho 2: Estilo "${hookStyles[1]}"  
- Gancho 3: Estilo "${hookStyles[2]}"

REGRAS:
1. Os novos ganchos devem fazer o leitor ${desiredFeeling ? `sentir ${desiredFeeling}` : "parar imediatamente"}
2. PROIBIDO usar estruturas similares aos ganchos anteriores
3. PROIBIDO: "Você sabia que...", "X% das pessoas...", "O segredo que...", "Ninguém te conta..."
4. Fale DIRETAMENTE com o público-alvo usando linguagem do universo deles
5. Máximo 140 caracteres cada

FORMATO:
Retorne APENAS os 3 novos ganchos, um por linha, numerados de 1 a 3.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  const hooks = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((hook) => hook.length > 0)
    .slice(0, 3);

  return hooks;
}

export async function regenerateCTA(
  profile: ProfileContext,
  body: string,
  hook: string,
  previousCTAs: string[],
  objective?: string,
  desiredFeeling?: string
): Promise<string[]> {
  const profileContext = buildProfileContext(profile);
  const variationSeed = Date.now() % 10000;
  const ctaStyles = getRandomCTAStyles();
  const audienceGuidance = buildAudienceFocusedHookGuidance(objective, desiredFeeling);

  const briefingContext = objective || desiredFeeling ? `
CONTEXTO DO BRIEFING (PRIORIDADE ALTA):
${objective ? `- Objetivo do post e público-alvo: ${objective}` : ""}
${desiredFeeling ? `- Sentimento desejado no leitor: ${desiredFeeling}` : ""}
${audienceGuidance}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: THINKING_BUDGET,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}
${briefingContext}

[SEED DE VARIAÇÃO: ${variationSeed}]

CTAs JÁ USADOS (PROIBIDO repetir estrutura similar):
${previousCTAs.map((c, i) => `${i + 1}. ${c}`).join("\n")}

POST:
Gancho: "${hook}"
Corpo: ${body}

Crie 3 NOVOS CTAs RADICALMENTE DIFERENTES.

🎯 ESTILOS OBRIGATÓRIOS:
- CTA 1: Estilo "${ctaStyles[0]}"
- CTA 2: Estilo "${ctaStyles[1]}"
- CTA 3: Estilo "${ctaStyles[2]}"

REGRAS:
1. PROIBIDO: Estruturas similares aos CTAs anteriores
2. PROIBIDO: "E você, o que acha?", "Deixe seu comentário", "Curta e compartilhe"
3. Use linguagem do universo de ${profile.targetAudience.join(" e ")}
4. O CTA deve CONCLUIR a jornada de "${desiredFeeling || "engajamento"}"
5. Máximo 2 linhas cada

FORMATO:
Retorne APENAS os 3 novos CTAs, um por linha, numerados de 1 a 3.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  const ctas = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((cta) => cta.length > 0)
    .slice(0, 3);

  return ctas;
}

// Template descriptions for AI guidance
const TEMPLATE_PROMPTS: Record<string, { name: string; instruction: string }> = {
  "lesson-career": {
    name: "Lição de Carreira",
    instruction: "Cada pauta deve ser sobre uma LIÇÃO DE CARREIRA - experiências profissionais que geraram aprendizado significativo. Foque em insights práticos, erros que ensinaram, ou momentos de virada na carreira."
  },
  "announce-achievement": {
    name: "Conquista Profissional",
    instruction: "Cada pauta deve ser sobre ANUNCIAR UMA CONQUISTA - resultados, metas batidas, promoções, projetos concluídos. Foque em vitórias que podem inspirar e mostrar credibilidade."
  },
  "failure-story": {
    name: "História de Fracasso",
    instruction: "Cada pauta deve ser sobre uma HISTÓRIA DE FRACASSO - erros, falhas, rejeições que ensinaram algo valioso. Foque na vulnerabilidade autêntica e no aprendizado extraído."
  },
  "demystify": {
    name: "Desmistificar Mito",
    instruction: "Cada pauta deve DESMISTIFICAR algo do mercado - quebrar crenças comuns, expor verdades incômodas, ou corrigir conceitos errados da indústria."
  },
  "practical-tip": {
    name: "Dica Prática",
    instruction: "Cada pauta deve ser uma DICA PRÁTICA acionável - algo que o leitor pode aplicar hoje no trabalho. Foque em técnicas, ferramentas, frameworks ou processos úteis."
  },
  "market-opinion": {
    name: "Opinião de Mercado",
    instruction: "Cada pauta deve ser uma OPINIÃO FORTE sobre o mercado - posicionamento sobre tendências, críticas construtivas, ou visões controversas sobre a indústria."
  },
  "behind-scenes": {
    name: "Bastidores",
    instruction: "Cada pauta deve mostrar BASTIDORES do trabalho - processos, rotinas, ferramentas usadas, desafios do dia a dia. Foque em humanizar a profissão."
  },
};

export async function generateTopicSuggestions(
  profile: ProfileContext & { templateId?: string }
): Promise<{ id: string; title: string; angle: string; why: string }[]> {
  const profileContext = buildProfileContext(profile);
  const profileCompleteness = calculateProfileCompleteness(profile);
  
  // Get template-specific instructions
  const template = profile.templateId ? TEMPLATE_PROMPTS[profile.templateId] : null;
  const templateInstruction = template 
    ? `\n\nTIPO DE CONTEÚDO: ${template.name}\n${template.instruction}\n`
    : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}

Você é um especialista em LinkedIn com base em análise de 318.842 posts virais.

TAREFA:
Gere 5 sugestões de PAUTAS (temas) para posts de LinkedIn baseadas no perfil acima.
Cada pauta deve ser específica, relevante para a audiência e ter potencial viral.
${templateInstruction}
REQUISITOS:
1. Cada pauta deve ter um TÍTULO provocativo (máximo 10 palavras)
2. Um ÂNGULO único de abordagem (como tratar o tema de forma diferente)
3. Um PORQUE funciona (1 linha explicando por que essa pauta tem potencial)

${profileCompleteness < 70 ? `
NOTA: O perfil está ${profileCompleteness}% completo. Com mais informações no Profile Studio, as sugestões seriam mais personalizadas e precisas.
` : ""}

FORMATO JSON (retorne APENAS o JSON, sem texto antes ou depois):
[
  {
    "title": "Título provocativo da pauta",
    "angle": "Ângulo único de abordagem",
    "why": "Por que funciona: explicação do potencial viral"
  }
]`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.map((item: any, index: number) => ({
      id: `suggestion-${Date.now()}-${index}`,
      title: item.title || "",
      angle: item.angle || "",
      why: item.why || "",
    }));
  } catch (error) {
    console.error("Error parsing topic suggestions:", error);
    return [];
  }
}

function calculateProfileCompleteness(profile: ProfileContext): number {
  let score = 0;
  const fields = [
    profile.industry,
    profile.professionalDescription,
    profile.targetAudience?.length > 0,
    profile.topics?.length > 0,
    profile.jobTitle,
    profile.creatorArchetype,
    profile.antiValues && profile.antiValues.length > 0,
    profile.goldenRules,
  ];
  
  fields.forEach(field => {
    if (field) score += 12.5;
  });
  
  return Math.round(score);
}

export type ContentType = "hook" | "body" | "cta";

export async function refineContent(
  profile: ProfileContext,
  contentType: ContentType,
  currentContent: string,
  userInstruction: string,
  context?: {
    topic?: string;
    hook?: string;
    body?: string;
  }
): Promise<string> {
  const profileContext = buildProfileContext(profile);

  const contentTypeLabels: Record<ContentType, string> = {
    hook: "gancho (hook)",
    body: "corpo do post",
    cta: "chamada para ação (CTA)",
  };

  const contextInfo = context ? `
CONTEXTO DO POST:
${context.topic ? `- Tópico: ${context.topic}` : ""}
${context.hook ? `- Gancho atual: ${context.hook}` : ""}
${context.body ? `- Corpo do post: ${context.body}` : ""}
` : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    messages: [
      {
        role: "user",
        content: `${profileContext}
${contextInfo}

Você é um especialista em copywriting para LinkedIn.

TAREFA: Refinar o ${contentTypeLabels[contentType]} abaixo seguindo a instrução do usuário.

CONTEÚDO ATUAL:
"${currentContent}"

INSTRUÇÃO DO USUÁRIO:
"${userInstruction}"

REGRAS:
1. Mantenha a essência e mensagem principal do conteúdo original
2. Aplique a instrução do usuário de forma precisa
3. Mantenha o tom e estilo do perfil do criador
4. Preserve o comprimento similar (não estenda demais nem encurte muito, a menos que solicitado)
5. Se a instrução pedir algo que prejudique a qualidade, faça o melhor ajuste possível

FORMATO:
Retorne APENAS o conteúdo refinado, sem explicações ou comentários adicionais.`,
      },
    ],
  });

  const text = extractTextFromResponse(message.content);
  return text.trim();
}
