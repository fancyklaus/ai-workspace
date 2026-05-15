use crate::models::{ChatMessage, MessageRole};
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::RwLock;
use uuid::Uuid;

/// 对话历史存储（内存中）
pub struct ChatState {
    pub conversations: HashMap<String, Vec<ChatMessage>>,
}

impl Default for ChatState {
    fn default() -> Self {
        Self {
            conversations: HashMap::new(),
        }
    }
}

/// 聊天请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRequest {
    pub conversation_id: String,
    pub model_name: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
}

/// 流式聊天事件
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamEvent {
    pub event_type: String,
    pub data: serde_json::Value,
}

/// 发送流式消息给前端
#[tauri::command]
pub async fn chat_stream(
    app: tauri::AppHandle,
    state: State<'_, Arc<RwLock<ChatState>>>,
    request: ChatRequest,
) -> Result<String, String> {
    let conversation_id = request.conversation_id.clone();
    let model_name = request.model_name.clone();

    // 保存用户消息到历史
    {
        let mut state = state.write().await;
        let messages = state
            .conversations
            .entry(conversation_id.clone())
            .or_insert_with(Vec::new);
        // 添加用户消息
        if let Some(last_msg) = request.messages.last() {
            if last_msg.role == MessageRole::User {
                messages.push(last_msg.clone());
            }
        }
    }

    // 调用 Ollama 流式 API
    let client = reqwest::Client::new();
    let endpoint = "http://localhost:11434/api/chat";

    let ollama_messages: Vec<serde_json::Value> = request
        .messages
        .iter()
        .map(|m| {
            serde_json::json!({
                "role": match m.role {
                    MessageRole::System => "system",
                    MessageRole::User => "user",
                    MessageRole::Assistant => "assistant",
                },
                "content": m.content,
            })
        })
        .collect();

    let body = serde_json::json!({
        "model": request.model_name,
        "messages": ollama_messages,
        "stream": true,
        "options": {
            "temperature": request.temperature.unwrap_or(0.7),
        }
    });

    let resp = client
        .post(endpoint)
        .json(&body)
        .timeout(std::time::Duration::from_secs(300))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama返回错误: {}", resp.status()));
    }

    let mut stream = resp.bytes_stream();
    let mut full_content = String::new();

    // 处理流式响应
    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                    // 解析 Ollama 的流式响应
                    for line in text.lines() {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                            if let Some(content) = json["message"]["content"].as_str() {
                                if !content.is_empty() {
                                    full_content.push_str(content);

                                    // 发送内容片段给前端
                                    let event = StreamEvent {
                                        event_type: "content".to_string(),
                                        data: serde_json::json!({ "chunk": content }),
                                    };
                                    let _ = app.emit("chat-stream", event);
                                }
                            }

                            // 检查是否完成
                            if json["done"].as_bool().unwrap_or(false) {
                                let total_tokens = json["eval_count"].as_u64().unwrap_or(0) as u32;
                                let prompt_tokens = json["prompt_eval_count"].as_u64().unwrap_or(0) as u32;

                                // 发送完成事件
                                let done_event = StreamEvent {
                                    event_type: "done".to_string(),
                                    data: serde_json::json!({
                                        "totalTokens": total_tokens + prompt_tokens,
                                        "promptTokens": prompt_tokens,
                                        "completionTokens": total_tokens,
                                    }),
                                };
                                let _ = app.emit("chat-stream", done_event);
                            }
                        }
                    }
                }
            }
            Err(e) => {
                // 发送错误事件
                let error_event = StreamEvent {
                    event_type: "error".to_string(),
                    data: serde_json::json!({ "error": e.to_string() }),
                };
                let _ = app.emit("chat-stream", error_event);
                return Err(format!("读取流失败: {}", e));
            }
        }
    }

    // 保存助手回复到历史
    {
        let mut state = state.write().await;
        if let Some(messages) = state.conversations.get_mut(&conversation_id) {
            messages.push(ChatMessage {
                role: MessageRole::Assistant,
                content: full_content.clone(),
            });
        }
    }

    Ok(full_content)
}

/// 获取对话历史
#[tauri::command]
pub async fn get_conversation_history(
    state: State<'_, Arc<RwLock<ChatState>>>,
    conversation_id: String,
) -> Result<Vec<ChatMessage>, String> {
    let state = state.read().await;
    Ok(state
        .conversations
        .get(&conversation_id)
        .cloned()
        .unwrap_or_default())
}

/// 创建新对话
#[tauri::command]
pub async fn create_conversation() -> Result<String, String> {
    Ok(Uuid::new_v4().to_string())
}

/// 清除对话历史
#[tauri::command]
pub async fn clear_conversation(
    state: State<'_, Arc<RwLock<ChatState>>>,
    conversation_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    state.conversations.remove(&conversation_id);
    Ok(())
}
