import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { InputArea } from './InputArea';
import type { Message } from '../types/chat';
import type { Agent } from '../types';
import './ChatPanel.css';

interface Props {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
  currentAgent: Agent | null;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export const ChatPanel: React.FC<Props> = ({
  messages,
  isLoading,
  error,
  onSend,
  onClear,
  currentAgent,
  currentModel,
  onModelChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const welcomeMessage = currentAgent
    ? `你好！我是 ${currentAgent.name}，${currentAgent.goal}`
    : '你好！我是 AI 助手，有什么可以帮您的？';

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>
            {currentAgent ? (
              <>
                <span className="agent-icon">{getAgentIcon(currentAgent.name)}</span>
                {currentAgent.name}
              </>
            ) : (
              '🤖 AI 助手'
            )}
          </h2>
          <span className="model-tag">{currentModel}</span>
        </div>
        <button className="clear-btn" onClick={onClear} title="清除对话">
          🗑️ 清除
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-state">
            <div className="welcome-icon">🤖</div>
            <h3>{welcomeMessage}</h3>
            <p>您可以尝试：</p>
            <ul>
              <li>帮我写一个快速排序算法</li>
              <li>解释什么是 closure</li>
              <li>帮我写一封邮件</li>
            </ul>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>正在思考...</span>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputArea
        onSend={onSend}
        isLoading={isLoading}
        currentModel={currentModel}
        onModelChange={onModelChange}
      />
    </div>
  );
};

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
