import { useState, useCallback } from 'react';
import { crewService } from '../services/tauriApi';
import type { 
  Crew, 
  CreateCrewRequest, 
  CrewExecutionResult,
  Task,
  CreateTaskRequest,
} from '../types';

export function useCrew() {
  const [currentCrew, setCurrentCrew] = useState<Crew | null>(null);
  const [executionResult, setExecutionResult] = useState<CrewExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建Crew
  const createCrew = useCallback(async (request: CreateCrewRequest): Promise<Crew | null> => {
    setLoading(true);
    setError(null);
    try {
      const crew = await crewService.createCrew(request);
      setCurrentCrew(crew);
      return crew;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建Crew失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加Task到当前Crew
  const addTask = useCallback((task: CreateTaskRequest) => {
    if (!currentCrew) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...task,
      dependsOn: task.dependsOn || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    setCurrentCrew(prev => prev ? {
      ...prev,
      tasks: [...prev.tasks, newTask],
    } : null);
  }, [currentCrew]);

  // 移除Task
  const removeTask = useCallback((taskId: string) => {
    setCurrentCrew(prev => prev ? {
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    } : null);
  }, []);

  // 执行Crew
  const executeCrew = useCallback(async (crewId?: string): Promise<CrewExecutionResult | null> => {
    const targetId = crewId || currentCrew?.id;
    if (!targetId) {
      setError('没有可执行的Crew');
      return null;
    }

    setExecuting(true);
    setError(null);
    try {
      const result = await crewService.executeCrew(targetId);
      setExecutionResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行Crew失败');
      return null;
    } finally {
      setExecuting(false);
    }
  }, [currentCrew]);

  // 重置状态
  const reset = useCallback(() => {
    setCurrentCrew(null);
    setExecutionResult(null);
    setError(null);
  }, []);

  return {
    currentCrew,
    executionResult,
    loading,
    executing,
    error,
    createCrew,
    addTask,
    removeTask,
    executeCrew,
    reset,
    setCurrentCrew,
  };
}
