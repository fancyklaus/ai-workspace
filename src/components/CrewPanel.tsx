import React, { useState } from 'react';
import type { Agent, CreateTaskRequest, ProcessType, Task } from '../types';
import './CrewPanel.css';

interface Props {
  agents: Agent[];
  onCreateCrew: (name: string, agentIds: string[], process: ProcessType, tasks: CreateTaskRequest[]) => Promise<void>;
  onExecuteCrew: () => Promise<void>;
  crewName: string;
  setCrewName: (name: string) => void;
  selectedAgents: string[];
  setSelectedAgents: (ids: string[]) => void;
  process: ProcessType;
  setProcess: (p: ProcessType) => void;
  tasks: CreateTaskRequest[];
  addTask: (task: CreateTaskRequest) => void;
  removeTask: (index: number) => void;
  executionResult: any;
  executing: boolean;
}

export const CrewPanel: React.FC<Props> = ({
  agents,
  onCreateCrew,
  onExecuteCrew,
  crewName,
  setCrewName,
  selectedAgents,
  setSelectedAgents,
  process,
  setProcess,
  tasks,
  addTask,
  removeTask,
  executionResult,
  executing,
}) => {
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    description: '',
    expectedOutput: '',
  });

  const handleAddTask = () => {
    if (newTask.description && newTask.expectedOutput) {
      addTask(newTask);
      setNewTask({ description: '', expectedOutput: '' });
    }
  };

  const handleAgentToggle = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const handleExecute = async () => {
    if (crewName && selectedAgents.length > 0 && tasks.length > 0) {
      await onCreateCrew(crewName, selectedAgents, process, tasks);
      await onExecuteCrew();
    }
  };

  return (
    <div className="crew-panel">
      <div className="crew-header">
        <h2>🚀 Crew 编排</h2>
      </div>

      <div className="crew-section">
        <h3>Crew 基本信息</h3>
        <div className="form-group">
          <label>Crew名称</label>
          <input
            type="text"
            value={crewName}
            onChange={e => setCrewName(e.target.value)}
            placeholder="例如：代码审查流程"
          />
        </div>
        <div className="form-group">
          <label>执行流程</label>
          <select value={process} onChange={e => setProcess(e.target.value as ProcessType)}>
            <option value="sequential">顺序执行 (Sequential)</option>
            <option value="hierarchical" disabled>层级执行 (Hierarchical) - 暂未实现</option>
          </select>
        </div>
      </div>

      <div className="crew-section">
        <h3>选择Agent ({selectedAgents.length})</h3>
        {agents.length === 0 ? (
          <p className="empty-hint">请先创建Agent</p>
        ) : (
          <div className="agent-selector">
            {agents.map(agent => (
              <label key={agent.id} className={`agent-option ${selectedAgents.includes(agent.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent.id)}
                  onChange={() => handleAgentToggle(agent.id)}
                />
                <span>{agent.name}</span>
                <small>{agent.role}</small>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="crew-section">
        <h3>添加任务 ({tasks.length})</h3>
        <div className="task-form">
          <input
            type="text"
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="任务描述"
          />
          <input
            type="text"
            value={newTask.expectedOutput}
            onChange={e => setNewTask({ ...newTask, expectedOutput: e.target.value })}
            placeholder="期望输出"
          />
          <button className="btn btn-secondary" onClick={handleAddTask}>+ 添加</button>
        </div>

        {tasks.length > 0 && (
          <div className="task-list">
            {tasks.map((task, index) => (
              <div key={index} className="task-item">
                <span className="task-index">{index + 1}</span>
                <div className="task-content">
                  <p className="task-desc">{task.description}</p>
                  <p className="task-output">期望: {task.expectedOutput}</p>
                </div>
                <button className="btn-delete" onClick={() => removeTask(index)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        className="btn btn-primary btn-execute"
        onClick={handleExecute}
        disabled={executing || !crewName || selectedAgents.length === 0 || tasks.length === 0}
      >
        {executing ? '⏳ 执行中...' : '▶️ 执行 Crew'}
      </button>

      {executionResult && (
        <div className="execution-result">
          <h3>执行结果</h3>
          <div className={`result-status ${executionResult.status}`}>
            状态: {executionResult.status}
          </div>
          {executionResult.finalOutput && (
            <div className="result-output">
              <h4>最终输出</h4>
              <pre>{executionResult.finalOutput}</pre>
            </div>
          )}
          {executionResult.taskResults && (
            <div className="task-results">
              <h4>任务结果</h4>
              {executionResult.taskResults.map((r: any, i: number) => (
                <div key={i} className={`task-result ${r.status}`}>
                  <span>任务 {i + 1}</span>
                  <span>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
