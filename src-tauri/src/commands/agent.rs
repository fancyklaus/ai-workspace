use crate::models::{Agent, AgentTemplates, CreateAgentRequest};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 全局Agent存储
static AGENTS: std::sync::OnceLock<Arc<RwLock<HashMap<String, Agent>>>> = std::sync::OnceLock::new();

fn get_agents() -> Arc<RwLock<HashMap<String, Agent>>> {
    AGENTS
        .get_or_init(|| {
            let agents = HashMap::new();
            Arc::new(RwLock::new(agents))
        })
        .clone()
}

/// 创建Agent
#[tauri::command]
pub async fn create_agent(request: CreateAgentRequest) -> Result<Agent, String> {
    tracing::info!("创建Agent: {}", request.name);

    let mut agent = Agent::new(
        request.name,
        request.role,
        request.goal,
        request.backstory,
        request.model_name.unwrap_or_else(|| "qwen2.5:72b".to_string()),
    );

    if let Some(provider) = request.model_provider {
        agent.model_provider = provider;
    }
    if let Some(tools) = request.tools {
        agent.tools = tools;
    }
    if let Some(verbose) = request.verbose {
        agent.verbose = verbose;
    }
    if let Some(delegate) = request.delegate_to_crew {
        agent.delegate_to_crew = delegate;
    }

    let id = agent.id.clone();
    let agents = get_agents();
    agents.write().await.insert(id, agent.clone());

    tracing::info!("Agent创建成功: {}", agent.id);
    Ok(agent)
}

/// 获取所有Agent
#[tauri::command]
pub async fn list_agents() -> Result<Vec<Agent>, String> {
    let agents = get_agents().read().await;
    Ok(agents.values().cloned().collect())
}

/// 获取指定Agent
#[tauri::command]
pub async fn get_agent(id: String) -> Result<Option<Agent>, String> {
    let agents = get_agents().read().await;
    Ok(agents.get(&id).cloned())
}

/// 删除Agent
#[tauri::command]
pub async fn delete_agent(id: String) -> Result<bool, String> {
    let agents = get_agents();
    let removed = agents.write().await.remove(&id).is_some();
    Ok(removed)
}
