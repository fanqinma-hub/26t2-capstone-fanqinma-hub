/**
 * scoring.types.ts
 *
 * TypeScript types for Role 5 (Voice Input, STT & Tier Scoring Lead).
 * Defines the contract for speech attempt recording and scoring outcomes.
 *
 * Owner: Role 5
 */

export interface SpeechAttempt {
  /** 完整的用户语音原文，必须保留 */
  transcript: string;
  /** 去除标点和杂音后的文本 */
  normalizedTranscript: string;
  /** 检测到的大小形容词数组 */
  detectedSizeWords: string[];
  /** 评级档位 */
  tier: 1 | 2 | 3;
  /** 具体状态枚举 */
  status: 'noun_only' | 'adjective_used' | 'rich_description';
  /** 发生时刻的时间戳 (epoch ms) */
  timestamp: number;
  /** 关联当前活动的 ID */
  promptId: string;
  /** STT 识别置信度占位符 */
  confidence: number;
  /** 是否在录音前使用了考拉的求助提示 */
  scaffoldUsed: boolean;
}
