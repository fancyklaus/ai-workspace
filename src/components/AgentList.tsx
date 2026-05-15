import React, { useState } from 'react';
import type { Agent, CreateAgentRequest } from '../types';
import './AgentList.css';

interface Props {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  onCreateAgent: (request: CreateAgentRequest) => Promise<Agent | null>;
  onCreateFromPreset: (preset: 'coder' | 'reviewer' | 'documenter' | 'researcher') => Promise<Agent | null>;
  onDeleteAgent: (id: string) => Promise<boolean>;
}

const PRESETS: { key: 'coder' | 'reviewer' | 'documenter' | 'researcher'; label: string; icon: string }[] = [
  { key: 'coder', label: '代码助手', icon: '💻' },
  { key: 'reviewer', label: '代码审查员', icon: '🔍' },
  { key: 'documenter', label: '文档助手', icon: '📝' },
  { key: 'researcher', label: '研究助手', icon: '📚' },
];

export const AgentList: React.FC<Props> = ({
  agents,
  loading,
  error,
  onCreateAgent,
  onCreateFromPreset,
  onDeleteAgent,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    role: '',
    goal: '',
    backstory: '',
    modelName: 'qwen2.5:72b',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const agent = await onCreateAgent(formData);
    if (agent) {
      setShowForm(false);
      setFormData({
        name: '',
        role: '',
        goal: '',
        backstory: '',
        modelName: 'qwen2.5:72b',
      });
    }
  };

  const handlePreset = async (key: 'coder' | 'reviewer' | 'documenter' | 'researcher') => {
    await onCreateFromPreset(key);
  };

  return (
    <div className="agent-list">
      <div className="agent-header">
        <h2>🤖 Agent 管理</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 新建Agent'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="agent-form" onSubmit={handleSubmit}>
          <h3>创建新Agent</h3>
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：我的助手"
              required
            />
          </div>
          <div className="form-group">
            <label>角色</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              placeholder="例如：代码审查员"
              required
            />
          </div>
          <div className="form-group">
            <label>目标</label>
            <input
              type="text"
              value={formData.goal}
              onChange={e => setFormData({ ...formData, goal: e.target.value })}
              placeholder="例如：确保代码质量"
              required
            />
          </div>
          <div className="form-group">
            <label>背景故事</label>
            <textarea
              value={formData.backstory}
              onChange={e => setFormData({ ...formData, backstory: e.target.value })}
              placeholder="描述Agent的背景和能力..."
              rows={3}
              required
            />
          </div>
          <div className="form-group">
            <label>模型</label>
            <input
              type="text"
              value={formData.modelName}
              onChange={e => setFormData({ ...formData, modelName: e.target.value })}
              placeholder="例如：qwen2.5:72b"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '创建'}
          </button>
        </form>
      )}

      <div className="preset-section">
        <h3>快速创建模板</h3>
        <div className="preset-buttons">
          {PRESETS.map(p => (
            <button
              key={p.key}
              className="preset-btn"
              onClick={() => handlePreset(p.key)}
            >
              <span className="preset-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="agents-section">
        <h3>已创建的Agent ({agents.length})</h3>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="empty-state">还没有Agent，请创建一个</div>
        ) : (
          <div className="agents-grid">
            {agents.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-card-header">
                  <h4>{agent.name}</h4>
                  <button 
                    className="btn-delete"
                    onClick={() => onDeleteAgent(agent.id)}
                  >
                    ×
                  </button>
                </div>
                <div className="agent-info">
                  <p><strong>角色：</strong>{agent.role}</p>
                  <p><strong>目标：</strong>{agent.goal}</p>
                  <p><strong>模型：</strong>{agent.modelName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
