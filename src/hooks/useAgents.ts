import { useState, useEffect, useCallback } from 'react';
import { agentService } from '../services/tauriApi';
import type { Agent, CreateAgentRequest, PRESET_AGENTS } from '../types';

// 获取预设Agent模板
const PRESETS = {
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

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载所有Agent
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await agentService.listAgents();
      setAgents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载Agent失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建Agent
  const createAgent = useCallback(async (request: CreateAgentRequest): Promise<Agent | null> => {
    setError(null);
    try {
      const agent = await agentService.createAgent(request);
      setAgents(prev => [...prev, agent]);
      return agent;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建Agent失败');
      return null;
    }
  }, []);

  // 从模板创建Agent
  const createFromPreset = useCallback(async (preset: keyof typeof PRESETS): Promise<Agent | null> => {
    return createAgent({
      ...PRESETS[preset],
      modelName: 'qwen2.5:72b',
      verbose: true,
    });
  }, [createAgent]);

  // 删除Agent
  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const success = await agentService.deleteAgent(id);
      if (success) {
        setAgents(prev => prev.filter(a => a.id !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除Agent失败');
      return false;
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return {
    agents,
    loading,
    error,
    loadAgents,
    createAgent,
    createFromPreset,
    deleteAgent,
  };
}
