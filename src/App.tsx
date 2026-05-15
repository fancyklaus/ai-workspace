import React, { useState } from 'react';
import { AgentList } from './components/AgentList';
import { CrewPanel } from './components/CrewPanel';
import { ChatPanel } from './components/ChatPanel';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { crewService } from './services/tauriApi';
import type { CreateTaskRequest, ProcessType } from './types';
import './App.css';

type Tab = 'chat' | 'agents' | 'crew';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const {
    agents,
    loading: agentsLoading,
    error: agentsError,
    loadAgents,
    createAgent,
    createFromPreset,
    deleteAgent,
  } = useAgents();

  const {
    messages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage,
    clearChat,
    setModel,
  } = useChat();

  // 当前选中的 Agent
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const currentAgent = agents.find((a) => a.id === currentAgentId) || null;

  // Crew状态
  const [crewName, setCrewName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [process, setProcess] = useState<ProcessType>('sequential');
  const [tasks, setTasks] = useState<CreateTaskRequest[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleCreateCrew = async (
    name: string,
    agentIds: string[],
    proc: ProcessType,
    taskList: CreateTaskRequest[]
  ) => {
    try {
      await crewService.createCrew({
        name,
        agentIds,
        process: proc,
        tasks: taskList,
        memoryEnabled: true,
      });
    } catch (err) {
      console.error('创建Crew失败:', err);
    }
  };

  const handleExecuteCrew = async () => {
    setExecuting(true);
    setExecutionResult(null);
    try {
      // 先创建Crew
      const crew = await crewService.createCrew({
        name: crewName,
        agentIds: selectedAgents,
        process,
        tasks,
        memoryEnabled: true,
      });
      // 执行Crew
      const result = await crewService.executeCrew(crew.id);
      setExecutionResult(result);
    } catch (err) {
      setExecutionResult({
        status: 'failed',
        error: err instanceof Error ? err.message : '执行失败',
      });
    } finally {
      setExecuting(false);
    }
  };

  const addTask = (task: CreateTaskRequest) => {
    setTasks([...tasks, task]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 AI Workspace</h1>
        <p className="subtitle">多Agent协作平台 - 基于CrewAI理念</p>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 对话
        </button>
        <button
          className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          🤖 Agent管理
        </button>
        <button
          className={`tab-btn ${activeTab === 'crew' ? 'active' : ''}`}
          onClick={() => setActiveTab('crew')}
        >
          🚀 Crew编排
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'chat' ? (
          <>
            {/* Agent 选择侧边栏 */}
            <div className="chat-sidebar">
              <div className="sidebar-header">
                <h3>选择 Agent</h3>
              </div>
              <div className="agent-list">
                {agents.length === 0 ? (
                  <div className="no-agents">
                    <p>还没有 Agent</p>
                    <button onClick={() => setActiveTab('agents')}>
                      去创建
                    </button>
                  </div>
                ) : (
                  agents.map((agent) => (
                    <button
                      key={agent.id}
                      className={`agent-item ${currentAgentId === agent.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentAgentId(agent.id);
                        setModel(agent.modelName);
                      }}
                    >
                      <span className="agent-icon">{getAgentIcon(agent.name)}</span>
                      <span className="agent-name">{agent.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            {/* 聊天主区域 */}
            <div className="chat-main">
              <ChatPanel
                messages={messages}
                isLoading={chatLoading}
                error={chatError}
                onSend={sendMessage}
                onClear={clearChat}
                currentAgent={currentAgent}
                currentModel={currentAgent?.modelName || 'qwen2.5:72b'}
                onModelChange={setModel}
              />
            </div>
          </>
        ) : activeTab === 'agents' ? (
          <AgentList
            agents={agents}
            loading={agentsLoading}
            error={agentsError}
            onCreateAgent={createAgent}
            onCreateFromPreset={createFromPreset}
            onDeleteAgent={deleteAgent}
          />
        ) : (
          <CrewPanel
            agents={agents}
            onCreateCrew={handleCreateCrew}
            onExecuteCrew={handleExecuteCrew}
            crewName={crewName}
            setCrewName={setCrewName}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
            process={process}
            setProcess={setProcess}
            tasks={tasks}
            addTask={addTask}
            removeTask={removeTask}
            executionResult={executionResult}
            executing={executing}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>AI Workspace v0.5 MVP | 多模型支持 | 多Agent协作</p>
      </footer>
    </div>
  );
}

function getAgentIcon(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('代码') || lowerName.includes('coder') || lowerName.includes('code')) {
    return '💻';
  }
  if (lowerName.includes('审查') || lowerName.includes('review')) {
    return '🔍';
  }
  if (lowerName.includes('文档') || lowerName.includes('document')) {
    return '📝';
  }
  if (lowerName.includes('研究') || lowerName.includes('research')) {
    return '📚';
  }
  return '🤖';
}

export default App;
