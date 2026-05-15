import React, { useState, useRef, useEffect } from 'react';
import { modelService } from '../services/tauriApi';
import './InputArea.css';

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export const InputArea: React.FC<Props> = ({
  onSend,
  isLoading,
  currentModel,
  onModelChange,
}) => {
  const [input, setInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const list = await modelService.listOllamaModels();
        setModels(list);
      } catch (err) {
        console.error('加载模型列表失败:', err);
        // 使用默认模型
        setModels(['qwen2.5:72b', 'llama3', 'mistral']);
      }
    };
    loadModels();
  }, []);

  // 点击外部关闭模型选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectRef.current && !modelSelectRef.current.contains(event.target as Node)) {
        setShowModelSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-area">
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            disabled={isLoading}
            rows={1}
          />
          <div className="input-actions">
            <div className="model-select" ref={modelSelectRef}>
              <button
                type="button"
                className="model-btn"
                onClick={() => setShowModelSelect(!showModelSelect)}
              >
                {currentModel}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showModelSelect && (
                <div className="model-dropdown">
                  {models.map((model) => (
                    <button
                      key={model}
                      type="button"
                      className={`model-option ${model === currentModel ? 'active' : ''}`}
                      onClick={() => {
                        onModelChange(model);
                        setShowModelSelect(false);
                      }}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="send-btn"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
