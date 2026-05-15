import { invoke } from '@tauri-apps/api/core';
import type { 
  ModelParams, 
  ChatResponse, 
  Agent, 
  CreateAgentRequest,
  Crew,
  CreateCrewRequest,
  CrewExecutionResult,
  CrewStatus,
} from '../types';

// 模型服务
export const modelService = {
  // 调用模型
  async callModel(params: ModelParams): Promise<ChatResponse> {
    return invoke<ChatResponse>('call_model', { params });
  },

  // 获取Ollama模型列表
  async listOllamaModels(): Promise<string[]> {
    return invoke<string[]>('list_ollama_models');
  },
};

// Agent服务
export const agentService = {
  // 创建Agent
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    return invoke<Agent>('create_agent', { request });
  },

  // 获取所有Agent
  async listAgents(): Promise<Agent[]> {
    return invoke<Agent[]>('list_agents');
  },

  // 获取指定Agent
  async getAgent(id: string): Promise<Agent | null> {
    return invoke<Agent | null>('get_agent', { id });
  },

  // 删除Agent
  async deleteAgent(id: string): Promise<boolean> {
    return invoke<boolean>('delete_agent', { id });
  },
};

// Crew服务
export const crewService = {
  // 创建Crew
  async createCrew(request: CreateCrewRequest): Promise<Crew> {
    return invoke<Crew>('create_crew', { request });
  },

  // 执行Crew
  async executeCrew(crewId: string): Promise<CrewExecutionResult> {
    return invoke<CrewExecutionResult>('execute_crew', { crewId });
  },

  // 获取Crew状态
  async getCrewStatus(crewId: string): Promise<CrewStatus | null> {
    return invoke<CrewStatus | null>('get_crew_status', { crewId });
  },
};
