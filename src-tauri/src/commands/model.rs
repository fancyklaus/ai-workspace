use crate::models::{ChatMessage, ChatResponse, ModelParams, OllamaListResponse, TokenUsage};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 全局模型客户端池
static MODEL_CLIENTS: std::sync::OnceLock<Arc<RwLock<ModelClients>>> = std::sync::OnceLock::new();

fn get_clients() -> Arc<RwLock<ModelClients>> {
    MODEL_CLIENTS
        .get_or_init(|| Arc::new(RwLock::new(ModelClients::new())))
        .clone()
}

/// 模型客户端管理
struct ModelClients {
    ollama_client: Option<reqwest::Client>,
}

impl ModelClients {
    fn new() -> Self {
        Self {
            ollama_client: Some(reqwest::Client::new()),
        }
    }
}

/// 调用模型
#[tauri::command]
pub async fn call_model(params: ModelParams) -> Result<ChatResponse, String> {
    tracing::info!("调用模型: {}", params.model_name);
    
    let model_name = params.model_name.clone();
    
    // 简单路由：根据模型名称判断提供商
    let response = if model_name.contains(':') {
        // Ollama模型格式通常是 name:tag
        call_ollama(&params).await
    } else {
        Err("不支持的模型格式".to_string())
    };

    match response {
        Ok(resp) => {
            tracing::info!("模型调用成功");
            Ok(resp)
        }
        Err(e) => {
            tracing::error!("模型调用失败: {}", e);
            Err(e)
        }
    }
}

/// 调用Ollama
async fn call_ollama(params: &ModelParams) -> Result<ChatResponse, String> {
    let clients = get_clients().read().await;
    let client = clients.ollama_client.as_ref().ok_or("Ollama客户端未初始化")?;

    let endpoint = "http://localhost:11434/api/chat";

    // 转换消息格式
    let ollama_messages: Vec<serde_json::Value> = params
        .messages
        .iter()
        .map(|m| {
            json!({
                "role": match m.role {
                    crate::models::MessageRole::System => "system",
                    crate::models::MessageRole::User => "user",
                    crate::models::MessageRole::Assistant => "assistant",
                },
                "content": m.content,
            })
        })
        .collect();

    let body = json!({
        "model": params.model_name,
        "messages": ollama_messages,
        "stream": false,
        "options": {
            "temperature": params.temperature.unwrap_or(0.7),
        }
    });

    let resp = client
        .post(endpoint)
        .json(&body)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama返回错误: {}", resp.status()));
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = json["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();

    Ok(ChatResponse {
        content,
        model: params.model_name.clone(),
        usage: TokenUsage {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
        },
        finish_reason: json["done"]
            .as_bool()
            .unwrap_or(true)
            .then_some("stop")
            .unwrap_or("length")
            .to_string(),
    })
}

/// 获取Ollama可用模型列表
#[tauri::command]
pub async fn list_ollama_models() -> Result<Vec<String>, String> {
    let clients = get_clients().read().await;
    let client = clients.ollama_client.as_ref().ok_or("Ollama客户端未初始化")?;

    let resp = client
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama返回错误: {}", resp.status()));
    }

    let json: OllamaListResponse = resp
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    Ok(json.models.into_iter().map(|m| m.name).collect())
}
