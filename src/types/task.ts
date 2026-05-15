// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Task定义
export interface Task {
  id: string;
  description: string;
  expectedOutput: string;
  agentId?: string;
  dependsOn: string[];
  status: TaskStatus;
  result?: string;
  createdAt: string;
  completedAt?: string;
}

// 创建Task请求
export interface CreateTaskRequest {
  description: string;
  expectedOutput: string;
  agentId?: string;
  dependsOn?: string[];
}

// 执行流程类型
export type ProcessType = 'sequential' | 'hierarchical';

// Crew状态
export type CrewStatus = 'idle' | 'running' | 'completed' | 'failed';

// Crew定义
export interface Crew {
  id: string;
  name: string;
  agentIds: string[];
  tasks: Task[];
  process: ProcessType;
  verbose: boolean;
  memoryEnabled: boolean;
  status: CrewStatus;
  createdAt: string;
  completedAt?: string;
}

// 创建Crew请求
export interface CreateCrewRequest {
  name: string;
  agentIds: string[];
  process: ProcessType;
  tasks?: CreateTaskRequest[];
  memoryEnabled?: boolean;
}

// 任务执行结果
export interface TaskResult {
  taskId: string;
  agentId: string;
  status: TaskStatus;
  output?: string;
  error?: string;
}

// Crew执行结果
export interface CrewExecutionResult {
  crewId: string;
  status: CrewStatus;
  taskResults: TaskResult[];
  finalOutput?: string;
  error?: string;
}
