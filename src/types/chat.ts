// 对话消息
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 对话会话
export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 聊天请求
export interface ChatRequest {
  agentId: string;
  modelName: string;
  messages: Message[];
  temperature?: number;
}

// 流式响应
export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  totalTokens?: number;
  error?: string;
}
