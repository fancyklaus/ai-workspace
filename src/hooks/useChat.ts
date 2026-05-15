import { useState, useCallback, useRef, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { chatService } from '../services/tauriApi';
import type { Message } from '../types/chat';

interface StreamEvent {
  event_type: string;
  data: {
    chunk?: string;
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    error?: string;
  };
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModelRef = useRef<string>('qwen2.5:72b');
  const unlistenRef = useRef<(() => void) | null>(null);

  // 初始化对话
  useEffect(() => {
    const init = async () => {
      try {
        const id = await chatService.createConversation();
        setConversationId(id);
      } catch (err) {
        console.error('创建对话失败:', err);
      }
    };
    init();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  // 监听流式事件
  const setupListener = useCallback(() => {
    if (unlistenRef.current) {
      unlistenRef.current();
    }

    listen<StreamEvent>('chat-stream', (event) => {
      const { event_type, data } = event.payload;

      if (event_type === 'content' && data.chunk) {
        const chunk = data.chunk;
        // 添加内容片段
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.id.includes('temp')) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                content: lastMsg.content + chunk,
              },
            ];
          }
          // 创建新消息
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              role: 'assistant' as const,
              content: chunk,
              timestamp: Date.now(),
            },
          ];
        });
      } else if (event_type === 'done') {
        setIsLoading(false);
        // 更新消息ID（去掉temp前缀）
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.id.includes('temp')) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                id: `assistant-${Date.now()}`,
              },
            ];
          }
          return prev;
        });
      } else if (event_type === 'error') {
        setIsLoading(false);
        setError(data.error || '发生未知错误');
        // 添加错误消息
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `错误: ${data.error || '发生未知错误'}`,
            timestamp: Date.now(),
          },
        ]);
      }
    }).then((unlisten) => {
      unlistenRef.current = unlisten;
    });
  }, []);

  // 设置模型
  const setModel = useCallback((model: string) => {
    currentModelRef.current = model;
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // 添加用户消息
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 设置监听器
      await setupListener();

      try {
        // 准备消息历史
        const historyMessages = messages
          .filter((m) => !m.id.includes('temp') && !m.id.includes('error'))
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : m.role,
            content: m.content,
          }));

        // 添加当前用户消息
        historyMessages.push({
          role: 'user',
          content: content.trim(),
        });

        // 调用流式聊天 API
        await chatService.chatStream({
          conversationId,
          modelName: currentModelRef.current,
          messages: historyMessages,
          temperature: 0.7,
        });
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : '发送消息失败');
      }
    },
    [conversationId, isLoading, messages, setupListener]
  );

  // 清除对话
  const clearChat = useCallback(async () => {
    if (conversationId) {
      await chatService.clearConversation(conversationId);
    }
    setMessages([]);
    setError(null);

    // 创建新对话
    const newId = await chatService.createConversation();
    setConversationId(newId);
  }, [conversationId]);

  // 加载历史消息
  const loadHistory = useCallback(async (id: string) => {
    try {
      const history = await chatService.getConversationHistory(id);
      setMessages(
        history.map((m, i) => ({
          id: `history-${i}`,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          timestamp: Date.now() - (history.length - i) * 1000,
        }))
      );
      setConversationId(id);
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    setModel,
    loadHistory,
  };
}
