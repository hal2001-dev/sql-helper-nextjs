import OpenAI from 'openai';
import { checkTokenUsage, incrementTokenUsage } from './redis';

export type TaskType = 'format' | 'explain' | 'orm' | 'debug' | 'rewrite';

export function selectOpenAIModel(task: TaskType, complexity: 'simple' | 'complex' = 'simple') {
  const GPT3 = 'gpt-3.5-turbo';
  const GPT4 = 'gpt-4-0125-preview';
  
  switch (task) {
    case 'format':
      return GPT3;
    case 'explain':
    case 'orm':
      return complexity === 'complex' ? GPT4 : GPT3;
    case 'debug':
    case 'rewrite':
      return GPT4;
    default:
      return GPT3;
  }
}

export const systemPrompts = {
  format: (dialect: string) => `You are a SQL formatting expert for ${dialect}. Format the given SQL query to be more readable and follow ${dialect} best practices. Only return the formatted SQL without any explanations.`,
  explain: '입력된 SQL을 한국어로 쉽게 설명해 주세요.',
  orm: 'SQL 쿼리를 Prisma ORM 코드로 변환해 주세요.',
  debug: 'SQL 문법 오류와 에러 메시지를 분석하고 수정 방법을 제안해 주세요.',
  rewrite: '동일한 결과를 내는 더 나은 SQL로 재작성해 주세요.'
};

export async function callOpenAI(
  task: TaskType,
  content: string,
  options: {
    dialect?: string;
    complexity?: 'simple' | 'complex';
    userId?: string;  // 이메일 주소
  } = {}
) {
  // 토큰 사용량 체크
  if (options.userId) {
    const { canUse, currentUsage, remaining } = await checkTokenUsage(options.userId);
    if (!canUse) {
      throw new Error(`오늘의 AI 사용량(10,000 tokens)을 초과했습니다. 현재 사용량: ${currentUsage} tokens`);
    }
    console.log(`[토큰 사용량] 현재: ${currentUsage}, 남은량: ${remaining}`);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const model = selectOpenAIModel(task, options.complexity);
  const systemPrompt = task === 'format' && options.dialect
    ? systemPrompts.format(options.dialect)
    : systemPrompts[task];

  console.log(`[AI 호출] 작업: ${task}, 모델: ${model}`);
  console.log(`[시스템 프롬프트] ${systemPrompt}`);
  console.log(`[사용자 입력] ${content}`);

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: typeof systemPrompt === 'function' ? systemPrompt(options.dialect || '') : systemPrompt
      },
      {
        role: "user",
        content
      }
    ],
    temperature: 0.3,
  });

  const tokens = completion.usage?.total_tokens || 0;
  console.log(`[토큰 사용량] ${tokens} tokens`);
  console.log(`[AI 응답] ${completion.choices[0].message.content}`);

  // 토큰 사용량 기록
  if (options.userId && tokens > 0) {
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    await incrementTokenUsage(options.userId, promptTokens, completionTokens);
  }

  return completion;
} 