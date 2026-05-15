import { ModelProvider } from './model';

// Agent定义
export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  modelProvider: ModelProvider;
  modelName: string;
  tools: string[];
  verbose: boolean;
  delegateToCrew: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建Agent请求
export interface CreateAgentRequest {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  modelProvider?: ModelProvider;
  modelName?: string;
  tools?: string[];
  verbose?: boolean;
  delegateToCrew?: boolean;
}

// 预设Agent模板
export const PRESET_AGENTS: Record<string, Partial<CreateAgentRequest>> = {
  coder: {
    name: '代码助手',
    role: '代码助手',
    goal: '帮助用户编写高质量代码',
    backstory: '你是一位经验丰富的全栈工程师，擅长解决各种编程问题。你的代码简洁、高效、可维护。',
  },
  reviewer: {
    name: '代码审查员',
    role: '代码审查员',
    goal: '发现代码中的问题和改进点',
    backstory: '你是一位追求完美的代码审查专家。你总能发现代码中的潜在问题并提出建设性的改进建议。',
  },
  documenter: {
    name: '文档助手',
    role: '文档助手',
    goal: '生成清晰的文档和说明',
    backstory: '你是一位技术文档专家，擅长将复杂的技术概念用简洁清晰的语言表达出来。',
  },
  researcher: {
    name: '研究助手',
    role: '研究助手',
    goal: '深入分析技术问题和最佳实践',
    backstory: '你是一位专业的研究员，擅长深入分析问题，查找资料，总结最佳实践。',
  },
};
