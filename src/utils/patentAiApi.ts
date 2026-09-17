/**
 * patentAiApi.ts
 * Multi-AI (Gemini, Claude, GPT) streaming API utility for patent specification generation.
 * Calls real AI APIs from the browser using the user's API key.
 */

// --- System Prompt (shared across all models) ---
const SYSTEM_PROMPT = `당신은 대한민국 특허청(KIPO) 출원 경력 20년 이상의 전문 변리사입니다.
사용자가 제공하는 짧은 키워드나 아이디어 단편을 바탕으로, 아래 목차에 맞는 완벽하고 전문적인 특허 명세서를 한국어로 작성하십시오.

[중요 규칙]
- 반드시 아래 목차 순서를 지키고, 각 항목의 제목에 【 】 기호를 사용하십시오.
- 도면부호는 100번대부터 시작하여 (110), (120), (130) 순으로 부여하십시오.
- 청구항은 독립항 1개와 종속항 최소 3개를 포함하십시오.
- 반드시 【발명의 명칭】으로 바로 시작하십시오.
- 서론, 인사말, 설명문, 구분선(---) 등 불필요한 텍스트를 절대 삽입하지 마십시오.
- 명세서 본문만 출력하십시오.

[필수 목차 - 반드시 모든 항목을 빠짐없이 작성할 것]
1. 【발명의 명칭】
2. 【기술분야】
3. 【발명의 배경이 되는 기술】 (종래 기술의 문제점을 구체적으로 3가지 이상 서술)
4. 【발명의 내용】
   - 【해결하려는 과제】
   - 【과제의 해결 수단】 (구성 요소와 도면부호를 포함하여 구체적으로)
   - 【발명의 효과】 (최소 3가지 효과를 구체적으로)
5. 【도면의 간단한 설명】 (도 1, 도 2, 도 3 각각의 설명)
6. 【발명을 실시하기 위한 구체적인 내용】 (이 부분이 가장 길고 상세해야 함. 각 구성요소의 동작을 도면부호와 함께 상세히 서술)
7. 【부호의 설명】 (도면에 사용된 주요 부호 설명)
8. 【특허청구범위】 (독립항 1개 + 종속항 최소 3개. 각 청구항은 【청구항 N】으로 표기)
9. 【요약서】 (400자 내외)
10. 【도면 대용 Mermaid 코드】 (각 도면에 대해 Mermaid.js 다이어그램 코드를 작성. 예: graph TD, flowchart LR 등)`;

function buildUserPrompt(project: {
  title: string;
  problemPurpose: string;
  techField: string;
  referenceNumerals?: string;
  similarPatentNo?: string;
  differentiation?: string;
  keyComponents?: string;
  priorArt?: string;
  applicant?: string;
}): string {
  const parts = [
    `아래 정보를 바탕으로 KIPO 표준 특허 명세서를 작성하십시오.`,
    `【발명의 명칭】으로 바로 시작하십시오. 서론이나 설명문은 절대 포함하지 마십시오.`,
    ``,
    `[발명의 명칭] ${project.title || '(사용자 미입력)'}`,
    `[기술 분야] ${project.techField || '(사용자 미입력)'}`,
    `[해결하려는 과제 / 발명의 목적] ${project.problemPurpose || '(사용자 미입력)'}`,
  ];

  if (project.referenceNumerals && project.referenceNumerals.trim()) {
    parts.push(`[부호의 설명] ${project.referenceNumerals}`);
  }

  if (project.similarPatentNo && project.similarPatentNo.trim()) {
    parts.push(`[비교 대상 유사/선행 특허] ${project.similarPatentNo}`);
  }
  if (project.differentiation && project.differentiation.trim()) {
    parts.push(`[기존 유사 특허 대비 본 발명의 핵심 차별점 및 개선점] ${project.differentiation}`);
    parts.push(`-> 반드시 【발명의 배경이 되는 기술】에서 상기 비교 대상 특허의 한계점과 문제점을 지적하고, 【과제의 해결 수단】 및 【특허청구범위】에서 본 발명만의 독창적인 구성요소와 차별점을 명시하여 특허청 심사 시 거절이유(진보성 결여)를 사전에 완벽히 회피하십시오.`);
  }

  if (project.keyComponents && project.keyComponents.trim()) {
    parts.push(`[핵심 구성요소 및 도면부호 가안] ${project.keyComponents}`);
  }
  if (project.priorArt && project.priorArt.trim()) {
    parts.push(`[추가 선행기술 참고] ${project.priorArt}`);
  }
  if (project.applicant && project.applicant.trim()) {
    parts.push(`[출원인] ${project.applicant}`);
  }

  parts.push(``);
  parts.push(`위 키워드만으로도 충분히 살을 붙여서, 전문적이고 논리적이며 실제 특허청 제출이 가능한 수준의 완벽한 명세서를 작성하십시오.`);
  parts.push(`특히 【특허청구범위】를 반드시 포함하여 독립항 1개와 종속항 3개 이상을 작성하십시오.`);

  return parts.join('\n');
}

// --- Filter out non-text or unstable models (TTS, Audio, Image, Embeddings, Gemma, etc.) ---
function isTextGenerationModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  // Must be a gemini model
  if (!lower.startsWith('gemini-')) return false;
  // Exclude non-text models (audio, tts, image, embeddings, etc.)
  if (
    lower.includes('-tts') ||
    lower.includes('audio') ||
    lower.includes('-image') ||
    lower.includes('imagen') ||
    lower.includes('embed') ||
    lower.includes('realtime') ||
    lower.includes('robotics') ||
    lower.includes('gemma') ||
    lower.includes('learnlm')
  ) {
    return false;
  }
  return true;
}

// --- Gemini Live Models Resolver ---
export async function getLiveGeminiModels(apiKey: string): Promise<string[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return [];
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
      signal: controller.signal
    });
    if (res.ok) {
      const data = await res.json();
      const list = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''))
        .filter(isTextGenerationModel);
      if (list.length > 0) return list;
    }
  } catch {
    // network or timeout error
  } finally {
    clearTimeout(timeoutId);
  }
  return [];
}

function rankModel(name: string): number {
  let score = 0;
  const match = name.match(/(\d+\.\d+)/);
  if (match) score += parseFloat(match[1]) * 1000;
  
  const lower = name.toLowerCase();
  if (lower.includes('ultra') || lower.includes('opus')) score += 500;
  else if (lower.includes('pro') || lower.includes('sonnet')) score += 300;
  else if (lower.includes('flash') || lower.includes('haiku')) score += 100;
  else if (lower.includes('lite')) score += 50;

  if (lower.includes('latest')) score += 10;
  return score;
}

function translateApiError(msg: string): string {
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('high demand') || lowerMsg.includes('overloaded') || lowerMsg.includes('capacity') || lowerMsg.includes('unavailable')) {
    return '현재 AI 모델 서버에 접속자가 많아 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many requests') || lowerMsg.includes('quota')) {
    return 'API 요청 한도(크레딧)가 초과되었습니다. 사용량이나 결제 정보를 확인해 주세요.';
  }
  if (lowerMsg.includes('invalid api key') || lowerMsg.includes('unauthorized') || lowerMsg.includes('key not valid') || lowerMsg.includes('authentication')) {
    return 'API 키가 유효하지 않거나 인증에 실패했습니다. 올바른 키인지 확인해 주세요.';
  }
  if (lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
    return '요청하신 AI 모델을 찾을 수 없습니다. 지원되지 않는 모델이거나 오타가 있을 수 있습니다.';
  }
  if (lowerMsg.includes('timeout') || lowerMsg.includes('deadline')) {
    return 'AI 서버 응답 시간이 초과되었습니다. 일시적인 장애일 수 있으니 다시 시도해 주세요.';
  }
  return msg;
}

export async function getCandidateGeminiModels(apiKey: string, aiModel?: string): Promise<string[]> {
  const candidateModels: string[] = [];
  if (aiModel && aiModel.trim() !== '') {
    const trimmed = aiModel.trim();
    // Only push if it looks like a valid API model name (no spaces, no Korean, etc.)
    if (/^[a-zA-Z0-9.-]+$/.test(trimmed)) {
      candidateModels.push(trimmed);
    }
  }

  const live = await getLiveGeminiModels(apiKey);
  if (live.length > 0) {
    const sorted = [...live]
      .filter(isTextGenerationModel)
      .sort((a, b) => rankModel(b) - rankModel(a));
      
    // 너무 많은 모델을 순차적으로 시도(Fallback)하면 503 에러나 타임아웃 시 대기 시간이 누적되어 로딩이 길어지는 문제 해결.
    // 사용자가 선택한 모델 외에 가장 점수가 높은 최상위 1개의 모델만 추가 후보군으로 제한합니다. (최대 2개)
    const fallbackModel = sorted.find(m => !candidateModels.includes(m));
    if (fallbackModel) {
      candidateModels.push(fallbackModel);
    }
  } else {
    // Fallback
    const fallbacks = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    const fallbackModel = fallbacks.find(m => !candidateModels.includes(m));
    if (fallbackModel) {
      candidateModels.push(fallbackModel);
    }
  }

  return candidateModels;
}

export function resolveGeminiModel(aiModel?: string): string {
  return aiModel && aiModel.trim() !== '' ? aiModel.trim() : 'gemini-1.5-flash';
}

// --- Gemini Streaming ---
async function* streamGemini(
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  modelSelection?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const candidateModels = await getCandidateGeminiModels(apiKey, modelSelection);

  let res: Response | null = null;
  let lastErr = '';

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(project) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    };

    try {
      const controller = new AbortController();
      // Increase TTFT (Time To First Token) timeout to 60s because Gemini can be slow to start generating
      const timeoutId = setTimeout(() => controller.abort(new Error('TimeoutError')), 60000);
      
      const handleUserAbort = () => controller.abort(abortSignal?.reason || new Error('AbortError'));
      if (abortSignal) {
        abortSignal.addEventListener('abort', handleUserAbort);
        if (abortSignal.aborted) handleUserAbort();
      }

      const attemptRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (abortSignal) abortSignal.removeEventListener('abort', handleUserAbort);

      if (attemptRes.ok) {
        res = attemptRes;
        break;
      } else {
        const errText = await attemptRes.text().catch(() => '');
        let cleanMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error && parsed.error.message) {
            cleanMsg = translateApiError(parsed.error.message);
          }
        } catch { /* not json */ }
        
        lastErr = `(${attemptRes.status}) ${cleanMsg}`;
        if (attemptRes.status === 400 && (errText.includes('API_KEY_INVALID') || errText.includes('key not valid'))) {
          throw new Error('API 키가 올바르지 않습니다. (Google AI Studio에서 발급받은 API 키를 확인해 주세요)');
        }
        if (attemptRes.status === 429) {
          throw new Error('일일/분당 사용량 한도가 초과되었습니다. (잠시 후 다시 시도해 주세요)');
        }
        // If 404, 500, 502, 503 or modality/TTS mismatch, continue to next candidate model
        if (
          attemptRes.status === 404 ||
          attemptRes.status === 500 ||
          attemptRes.status === 502 ||
          attemptRes.status === 503 ||
          (attemptRes.status === 400 && (errText.includes('response modalities') || errText.includes('not supported')))
        ) {
          continue;
        }
        break;
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'AbortError') throw e; // Let user abort bubble up immediately
      if (e.message === 'TimeoutError') {
        lastErr = 'API 응답 지연 (60초 초과)';
      } else {
        if (e.message?.includes('API 키가 올바르지 않습니다')) throw e;
        lastErr = e.message;
      }
    }
  }

  if (!res || !res.ok) {
    throw new Error(lastErr || 'Gemini API 호출 실패');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch { /* skip malformed JSON */ }
      }
    }
  }
}

// --- Claude Streaming ---
async function* streamClaude(apiKey: string, project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string }, aiModel?: string, abortSignal?: AbortSignal): AsyncGenerator<string> {
  const url = 'https://api.anthropic.com/v1/messages';
  const body = {
    model: aiModel && aiModel.trim() !== '' ? aiModel.trim() : 'claude-3-5-sonnet-20240620',
    max_tokens: 16384,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(project) }],
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) {
        cleanMsg = translateApiError(parsed.error.message);
      }
    } catch { /* not json */ }
    throw new Error(cleanMsg || `Claude API 오류 (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch { /* skip */ }
      }
    }
  }
}

// --- GPT Streaming ---
async function* streamGPT(apiKey: string, project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string }, aiModel?: string): AsyncGenerator<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: aiModel && aiModel.trim() !== '' ? aiModel.trim() : 'gpt-4o',
    max_tokens: 16384,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(project) },
    ],
    temperature: 0.7,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) {
        cleanMsg = translateApiError(parsed.error.message);
      }
    } catch { /* not json */ }
    throw new Error(cleanMsg || `GPT API 오류 (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch { /* skip */ }
      }
    }
  }
}

// --- Completeness Checker ---
export interface SpecificationCompleteness {
  isComplete: boolean;
  hasTitle: boolean;
  hasTechField: boolean;
  hasBackground: boolean;
  hasProblemAndSolution: boolean;
  hasDetailedDescription: boolean;
  hasClaims: boolean;
  hasAbstract: boolean;
  hasDrawingsDescription: boolean;
  missingSections: string[];
}

export function checkSpecificationCompleteness(text: string): SpecificationCompleteness {
  const hasTitle = text.includes('【발명의 명칭】') || text.includes('[발명의 명칭]');
  const hasTechField = text.includes('【기술분야】') || text.includes('[기술분야]');
  const hasBackground = text.includes('【발명의 배경이 되는 기술】') || text.includes('【배경기술】');
  const hasProblemAndSolution = text.includes('【발명의 내용】') || text.includes('【해결하려는 과제】') || text.includes('【과제의 해결 수단】');
  const hasDetailedDescription = text.includes('【발명을 실시하기 위한 구체적인 내용】') || text.includes('【발명의 실시를 위한 구체적인 내용】');
  
  // 청구항은 【특허청구범위】 항목과 함께 최소 【청구항 1】이 반드시 존재해야 함
  const hasClaims = (text.includes('【특허청구범위】') || text.includes('[특허청구범위]')) &&
    (text.includes('【청구항 1】') || text.includes('【청구항1】') || text.includes('청구항 1.') || text.includes('청구항 1 :'));
    
  // 요약서는 【요약서】 항목이 있어야 함
  const hasAbstract = text.includes('【요약서】') || text.includes('[요약서]');
  const hasDrawingsDescription = text.includes('【도면의 간단한 설명】') || text.includes('[도면의 간단한 설명]');

  const missingSections: string[] = [];
  if (!hasTitle) missingSections.push('【발명의 명칭】');
  if (!hasTechField) missingSections.push('【기술분야】');
  if (!hasBackground) missingSections.push('【발명의 배경이 되는 기술】');
  if (!hasProblemAndSolution) missingSections.push('【발명의 내용】');
  if (!hasDetailedDescription) missingSections.push('【발명을 실시하기 위한 구체적인 내용】');
  if (!hasDrawingsDescription) missingSections.push('【도면의 간단한 설명】');
  if (!hasClaims) missingSections.push('【특허청구범위】(독립항/종속항)');
  if (!hasAbstract) missingSections.push('【요약서】');

  // 핵심 필수 항목: 제목, 구체적 내용, 청구범위, 요약서
  const isComplete = hasTitle && hasProblemAndSolution && hasDetailedDescription && hasClaims && hasAbstract;

  return {
    isComplete,
    hasTitle,
    hasTechField,
    hasBackground,
    hasProblemAndSolution,
    hasDetailedDescription,
    hasClaims,
    hasAbstract,
    hasDrawingsDescription,
    missingSections,
  };
}

function buildContinuationPrompt(
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  currentText: string,
  missingSections: string[],
): string {
  // 직전 텍스트의 마지막 1500자 추출하여 자연스러운 문맥 연결
  const lastContext = currentText.length > 1500 ? currentText.slice(-1500) : currentText;

  return `[긴급 보완 지시: KIPO 특허 명세서 연속 이어쓰기 요청]
당신은 대한민국 특허청(KIPO) 변리사입니다.
이전에 작성 중이던 [발명의 명칭: ${project.title || '본 발명'}]의 명세서가 AI 단일 응답 토큰 한도로 인해 도중에 중단되었습니다.
미완성 문서는 특허청에 제출할 수 없으므로, 완벽한 법정 규격을 갖춘 최종 문서가 될 때까지 이어서 작성해야 합니다.

[지금까지 작성된 명세서의 마지막 부분 (참조용 문맥)]:
...
${lastContext}
...

[현재 누락된 법정 필수 항목]:
${missingSections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

[작성 규칙]:
1. 이전에 이미 작성된 본문 내용을 처음부터 다시 쓰지 마십시오! (절대 중복 출력 금지)
2. 중단된 위치 바로 다음 문장 또는 다음 목차부터 자연스럽게 즉시 이어서 작성하십시오.
3. 특히 【특허청구범위】가 누락되었거나 도중에 끊겼다면 반드시 【청구항 1】(독립항)과 종속항(최소 3개 이상: 【청구항 2】, 【청구항 3】, 【청구항 4】)을 엄격한 특허청 법정 서식으로 완벽히 작성하십시오.
4. 청구항 작성 후 반드시 【요약서】(400자 내외)와 【도면 대용 Mermaid 코드】까지 작성하여 명세서를 완전히 마감하십시오.
5. 서론, 인사말, 안내문은 일절 출력하지 말고 명세서 이어쓰기 본문만 출력하십시오.`;
}

// --- Continuation Streaming for Gemini ---
async function* streamGeminiContinuation(
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  currentText: string,
  missingSections: string[],
  aiModel?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const candidateModels = await getCandidateGeminiModels(apiKey, aiModel);
  const prompt = buildContinuationPrompt(project, currentText, missingSections);
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 16384 },
  };

  let res: Response | null = null;
  let lastErr = '';

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      if (abortSignal) abortSignal.addEventListener('abort', () => controller.abort());

      const attemptRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (attemptRes.ok) {
        res = attemptRes;
        break;
      } else {
        const errText = await attemptRes.text().catch(() => '');
        let cleanMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error && parsed.error.message) {
            cleanMsg = translateApiError(parsed.error.message);
          }
        } catch {}
        lastErr = `(${attemptRes.status}) ${cleanMsg}`;
        if (
          attemptRes.status === 404 ||
          attemptRes.status === 500 ||
          attemptRes.status === 502 ||
          attemptRes.status === 503 ||
          (attemptRes.status === 400 && (errText.includes('response modalities') || errText.includes('not supported')))
        ) {
          continue;
        }
        break;
      }
    } catch (e: any) {
      lastErr = e.message;
    }
  }

  if (!res || !res.ok) {
    throw new Error(lastErr || 'Gemini API 연장 호출 실패');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch { /* skip */ }
      }
    }
  }
}

// --- Continuation Streaming for Claude ---
async function* streamClaudeContinuation(
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  currentText: string,
  missingSections: string[],
  aiModel?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const url = 'https://api.anthropic.com/v1/messages';
  const prompt = buildContinuationPrompt(project, currentText, missingSections);
  const body = {
    model: aiModel && aiModel.trim() !== '' ? aiModel.trim() : 'claude-3-5-sonnet-20240620',
    max_tokens: 16384,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) {
        cleanMsg = translateApiError(parsed.error.message);
      }
    } catch {}
    throw new Error(cleanMsg || `Claude 연장 스트림 오류 (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch { /* skip */ }
      }
    }
  }
}

// --- Continuation Streaming for GPT ---
async function* streamGPTContinuation(
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  currentText: string,
  missingSections: string[],
  aiModel?: string,
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = buildContinuationPrompt(project, currentText, missingSections);
  const body = {
    model: aiModel && aiModel.trim() !== '' ? aiModel.trim() : 'gpt-4o',
    max_tokens: 16384,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) {
        cleanMsg = translateApiError(parsed.error.message);
      }
    } catch {}
    throw new Error(cleanMsg || `GPT 연장 스트림 오류 (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트림을 열 수 없습니다.');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch { /* skip */ }
      }
    }
  }
}

// --- Smart Provider Detector ---
export function detectProviderByKeyOrModel(apiKey: string, aiModel?: string): 'Claude' | 'GPT' | 'Gemini' {
  const cleanKey = apiKey?.trim() || '';
  if (cleanKey.startsWith('sk-ant-')) return 'Claude';
  if (cleanKey.startsWith('AIza') || cleanKey.startsWith('AQ.')) return 'Gemini';
  if (cleanKey.startsWith('sk-') && !cleanKey.startsWith('sk-ant-')) return 'GPT';
  if (aiModel?.includes('Claude')) return 'Claude';
  if (aiModel?.includes('GPT')) return 'GPT';
  return 'Gemini';
}

// --- Public Unified Interface ---
export async function* streamPatentGeneration(
  aiModel: string,
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const provider = detectProviderByKeyOrModel(apiKey, aiModel);
  if (provider === 'Claude') {
    yield* streamClaude(apiKey, project, aiModel, abortSignal);
  } else if (provider === 'GPT') {
    yield* streamGPT(apiKey, project, aiModel, abortSignal);
  } else {
    // Default to Gemini (Flash/Live)
    yield* streamGemini(apiKey, project, aiModel, abortSignal);
  }
}

// --- Public Continuation Stream Interface ---
export async function* streamPatentContinuation(
  aiModel: string,
  apiKey: string,
  project: { title: string; problemPurpose: string; techField: string; referenceNumerals?: string; keyComponents?: string; priorArt?: string; applicant?: string },
  currentText: string,
  missingSections: string[],
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const provider = detectProviderByKeyOrModel(apiKey, aiModel);
  if (provider === 'Claude') {
    yield* streamClaudeContinuation(apiKey, project, currentText, missingSections, aiModel, abortSignal);
  } else if (provider === 'GPT') {
    yield* streamGPTContinuation(apiKey, project, currentText, missingSections, aiModel, abortSignal);
  } else {
    yield* streamGeminiContinuation(apiKey, project, currentText, missingSections, aiModel, abortSignal);
  }
}

// --- Similar Patents Auto-Search & Extraction API ---
export interface SimilarPatentCandidate {
  patentNumber: string;
  title: string;
  summary: string;
  limitations: string;
  differentiation: string;
  relevanceScore: number;
}

// --- Robust Patent Candidate Parser ---
function parsePatentCandidateList(rawText: string, data?: any): SimilarPatentCandidate[] | null {
  let contentText = rawText;
  if (!contentText && data) {
    contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  if (!contentText || typeof contentText !== 'string') return null;

  // Clean markdown code blocks
  const cleaned = contentText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Substring fallback [ ... ]
    const s = cleaned.indexOf('[');
    const e = cleaned.lastIndexOf(']');
    if (s !== -1 && e > s) {
      try {
        parsed = JSON.parse(cleaned.substring(s, e + 1));
      } catch { /* skip */ }
    }
    // Substring fallback { ... }
    if (!parsed) {
      const objS = cleaned.indexOf('{');
      const objE = cleaned.lastIndexOf('}');
      if (objS !== -1 && objE > objS) {
        try {
          parsed = JSON.parse(cleaned.substring(objS, objE + 1));
        } catch { /* skip */ }
      }
    }
  }

  // Find array within parsed result
  let arrayTarget: any[] | null = null;
  if (Array.isArray(parsed)) {
    arrayTarget = parsed;
  } else if (parsed && typeof parsed === 'object') {
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val) && val.length > 0) {
        arrayTarget = val;
        break;
      }
    }
  }

  if (!arrayTarget || arrayTarget.length === 0) return null;

  return arrayTarget.map((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      return {
        patentNumber: `10-2023-00${String(idx + 1).padStart(5, '0')}`,
        title: String(item || `유사 선행 특허 ${idx + 1}`),
        summary: '종래 특허의 주요 구성 요약',
        limitations: '종래 기술의 한계 및 문제점',
        differentiation: '본 발명만의 구성상 차별점 및 진보성 회피 전략',
        relevanceScore: 92 - idx * 4,
      };
    }

    return {
      patentNumber:
        item.patentNumber ||
        item.patent_number ||
        item.patentNo ||
        item['특허번호'] ||
        item['출원번호'] ||
        item['등록번호'] ||
        `10-2023-00${String(idx + 1).padStart(5, '0')}`,
      title:
        item.title ||
        item['명칭'] ||
        item['발명의명칭'] ||
        item['특허명'] ||
        `유사 선행 기술 ${idx + 1}`,
      summary:
        item.summary ||
        item['요약'] ||
        item['주요구성'] ||
        item.description ||
        '종래 기술의 핵심 구성 요약',
      limitations:
        item.limitations ||
        item['한계점'] ||
        item['문제점'] ||
        item.limitation ||
        '종래 기술의 결정적 한계 및 문제점',
      differentiation:
        item.differentiation ||
        item['차별점'] ||
        item['진보성'] ||
        item['차별화전략'] ||
        '본 발명만의 회피 및 차별화 전략',
      relevanceScore: Number(item.relevanceScore || item['유사도'] || item.score || (95 - idx * 4)),
    };
  });
}

// Fallback generator when API quota / billing blocks external calls
export function generateFallbackPatents(invention: { title: string; problemPurpose: string; techField: string }): SimilarPatentCandidate[] {
  const title = invention.title || '본 발명 대상 장치';
  const field = invention.techField || '관련 기술 분야';
  return [
    {
      patentNumber: '10-2022-0041285 (공개)',
      title: `${field} 적용 ${title.slice(0, 15)} 제어 시스템`,
      summary: '기존의 단일 센서 및 유선 인터페이스를 통해 데이터를 수집하고 중앙 처리 장치에서 단순 임계값 기반으로 제어하는 선행 기술',
      limitations: '다채널 복합 환경에서 신호 간섭 및 실시간 오차 보정이 미흡하며, 동적 환경 변화에 즉각 대응하지 못하는 한계 존재',
      differentiation: '본 발명은 지능형 분산 노드 및 다중 피드백 보정 루프를 적용하여 실시간 데이터 무결성을 보장하고 제어 오차를 극소화함',
      relevanceScore: 94,
    },
    {
      patentNumber: '등록 제10-2418520호',
      title: `지능형 ${title.slice(0, 12)} 데이터 모니터링 장치`,
      summary: '주기적으로 동작 파라미터를 측정하여 원격 서버로 송신하고 이상 상태를 검출하는 종래 모니터링 구조',
      limitations: '통신 부하 증가 시 지연 시간(Latency)이 급증하고 배터리 소모율이 높아 장시간 독립 운영에 취약함',
      differentiation: '본 발명은 엣지 컴퓨팅 기반 온디바이스 전처리 알고리즘을 탑재하여 통신 트래픽을 70% 이상 절감하고 초저전력 구동을 달성함',
      relevanceScore: 89,
    },
    {
      patentNumber: '10-2021-0158932 (공개)',
      title: `고신뢰성 ${field} 모듈레이션 회로 및 구동 방법`,
      summary: '아날로그 회로 보호를 위해 물리적 차단 릴레이 및 과전압 보호 소자를 병렬 배치한 종래의 회로 구성',
      limitations: '부품 실장 면적이 크고 고속 스위칭 주파수 환경에서 신호 감쇄 및 노이즈 유입에 취약함',
      differentiation: '본 발명은 능동형 디지털 필터링 및 소형화된 전원 관리 집적 회로(PMIC) 구조를 채택하여 실장 효율을 극대화함',
      relevanceScore: 85,
    },
  ];
}

export async function searchSimilarPatents(
  aiModel: string,
  apiKey: string,
  invention: { title: string; problemPurpose: string; techField: string },
  abortSignal?: AbortSignal
): Promise<SimilarPatentCandidate[]> {
  const cleanKey = apiKey?.trim() || '';
  if (!cleanKey || cleanKey.length < 5) {
    throw new Error('AI API 키가 입력되지 않았습니다. 1번 항목 [AI 모델 선택 및 API 키 입력]에서 유효한 API 키를 먼저 입력해 주세요.');
  }

  const cleanTitle = invention.title?.trim() || '';
  if (!cleanTitle) {
    throw new Error('2번 [발명의 명칭]을 먼저 입력해야 관련 유사 특허를 검색할 수 있습니다.');
  }

  const cleanProblem = invention.problemPurpose?.trim() || '해결하려는 과제 미입력';
  const cleanField = invention.techField?.trim() || '관련 기술 분야';

  const searchPrompt = `당신은 대한민국 특허청(KIPO) 20년 경력의 수석 특허 심사관입니다.
아래 사용자의 발명에 대하여, 키프리스(KIPRIS)에 등록되어 있을 법한 대표적인 종래 유사 특허 3건을 도출하고,
그 유사 특허의 한계점과 본 발명만의 차별화(진보성 확보) 전략을 JSON 배열 형식으로 작성하십시오.

[사용자 발명]
- 발명의 명칭: ${cleanTitle}
- 해결하려는 과제: ${cleanProblem}
- 기술 분야: ${cleanField}

반드시 마크다운이나 다른 설명 없이 오직 순수한 JSON 배열만 출력하십시오:
[
  {
    "patentNumber": "10-2023-0045812 (또는 등록 제10-2481029호)",
    "title": "유사 특허 명칭",
    "summary": "종래 특허의 주요 구성 요약 (1~2줄)",
    "limitations": "종래 특허가 가진 결정적 문제점이나 한계 (1~2줄)",
    "differentiation": "종래 특허 대비 본 발명만의 차별점 및 진보성 회피 전략 (1~2줄)",
    "relevanceScore": 96
  }
]`;

  // Smart Provider Detection from key prefix or dropdown
  let provider = 'Gemini';
  if (cleanKey.startsWith('sk-ant-')) {
    provider = 'Claude';
  } else if (cleanKey.startsWith('AIza') || cleanKey.startsWith('AQ.')) {
    provider = 'Gemini';
  } else if (cleanKey.startsWith('sk-') && !cleanKey.startsWith('sk-ant-')) {
    provider = 'GPT';
  } else if (aiModel.includes('Claude')) {
    provider = 'Claude';
  } else if (aiModel.includes('GPT')) {
    provider = 'GPT';
  }

  // Determine endpoint (use Vite local proxy when available to completely bypass CORS)
  const isBrowserLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  try {
    if (provider === 'Gemini') {
      const candidateModels = await getCandidateGeminiModels(cleanKey, aiModel);
      let lastError: Error | null = null;

      for (const model of candidateModels) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
          const proxyUrl = isBrowserLocal
            ? `/proxy/gemini/v1beta/models/${model}:generateContent?key=${cleanKey}`
            : directUrl;

          const requestBody = JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: searchPrompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
          });

          let res: Response;
          const timeoutController = new AbortController();
          // Similar patent generation needs more time to complete
          const timeoutId = setTimeout(() => timeoutController.abort(new Error('TimeoutError')), 60000);
          
          const handleUserAbort = () => timeoutController.abort(abortSignal?.reason || new Error('AbortError'));
          if (abortSignal) {
            abortSignal.addEventListener('abort', handleUserAbort);
            if (abortSignal.aborted) handleUserAbort();
          }

          try {
            res = await fetch(directUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: requestBody,
              signal: timeoutController.signal,
            });
          } catch (e: any) {
            if (e.name === 'AbortError' || e.message === 'AbortError') throw e;
            
            // CORS or network failure usually throws TypeError
            if (e.name === 'TypeError') {
              res = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody,
                signal: timeoutController.signal,
              });
            } else {
              throw e;
            }
          } finally {
            clearTimeout(timeoutId);
            if (abortSignal) {
              abortSignal.removeEventListener('abort', handleUserAbort);
            }
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            const errMsg = errData?.error?.message || `HTTP ${res.status}`;
            lastError = new Error(`Gemini API 오류 (${model}, HTTP ${res.status}): ${errMsg}`);
            if (res.status === 400 && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid'))) {
              throw new Error('Gemini API 키가 올바르지 않습니다. (Google AI Studio에서 발급받은 유효한 키를 확인해 주세요)');
            }
            if (res.status === 403) {
              throw new Error(`Gemini API 접근 권한 오류 (403): ${errMsg} (Google AI Studio 키 권한 또는 등록 상태 확인 필요)`);
            }
            if (res.status === 429) {
              throw new Error('Gemini API 일일/분당 사용량 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.');
            }
            if (
              res.status === 404 ||
              res.status === 500 ||
              res.status === 502 ||
              res.status === 503 ||
              (res.status === 400 && (errMsg.includes('response modalities') || errMsg.includes('not supported')))
            ) {
              // Try next candidate model
              continue;
            }
            throw lastError;
          }

          const data = await res.json();
          const list = parsePatentCandidateList('', data);
          if (list && list.length > 0) return list;

        } catch (err: any) {
          lastError = err;
          if (
            err.message?.includes('API 키가 올바르지 않습니다') ||
            err.message?.includes('접근 권한 오류') ||
            err.name === 'AbortError' ||
            err.message === 'AbortError'
          ) {
            throw err;
          }
          // On timeout or other errors, try next model
        }
      }

      if (lastError) throw lastError;
      throw new Error('Gemini 응답에서 유사 특허 목록을 추출하지 못했습니다. (Google AI 모델 응답 규격 불일치)');
    } else if (provider === 'Claude') {
      const endpoint = isBrowserLocal
        ? '/proxy/anthropic/v1/messages'
        : 'https://api.anthropic.com/v1/messages';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: searchPrompt }],
        }),
        signal: abortSignal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 401) {
          throw new Error('Anthropic Claude API 키가 올바르지 않습니다. (인증 실패 sk-ant-...)');
        }
        if (res.status === 429) {
          throw new Error('Claude API 크레딧이 부족하거나 사용량 한도가 초과되었습니다. (Anthropic 계정 크레딧 확인 필요)');
        }
        throw new Error(`Claude 호출 실패: ${errMsg}`);
      }

      const data = await res.json();
      const rawText = data?.content?.[0]?.text;
      if (rawText) {
        const match = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      throw new Error('Claude로부터 유효한 유사 특허 검색 결과를 수신하지 못했습니다.');

    } else if (provider === 'GPT') {
      const endpoint = isBrowserLocal
        ? '/proxy/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: searchPrompt }],
          response_format: { type: 'json_object' },
        }),
        signal: abortSignal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 401) {
          throw new Error('OpenAI API 키가 올바르지 않습니다. (인증 실패 sk-...)');
        }
        if (res.status === 429) {
          throw new Error('OpenAI API 잔액(Credit)이 부족하거나 사용량 한도가 초과되었습니다. (OpenAI Billing 확인 필요)');
        }
        throw new Error(`OpenAI 호출 실패: ${errMsg}`);
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed) ? parsed : parsed.patents || parsed.candidates || Object.values(parsed)[0];
        if (Array.isArray(list) && list.length > 0) return list;
      }
      throw new Error('OpenAI로부터 유효한 유사 특허 검색 결과를 수신하지 못했습니다.');
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('브라우저 보안(CORS) 또는 네트워크 연결 문제로 AI 서버에 연결할 수 없습니다. 프록시 및 인터넷 상태를 확인해 주세요.');
    }
    throw err;
  }

  throw new Error('지원되지 않는 AI 모델입니다.');
}

