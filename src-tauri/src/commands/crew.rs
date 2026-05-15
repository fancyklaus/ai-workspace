use crate::commands::model::call_model;
use crate::models::{
    ChatMessage, Crew, CrewExecutionResult, CrewStatus, CreateCrewRequest, MessageRole, ModelParams,
    Task, TaskResult, TaskStatus,
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 全局Crew存储
static CREWS: std::sync::OnceLock<Arc<RwLock<HashMap<String, Crew>>>> = std::sync::OnceLock::new();

fn get_crews() -> Arc<RwLock<HashMap<String, Crew>>> {
    CREWS
        .get_or_init(|| {
            let crews = HashMap::new();
            Arc::new(RwLock::new(crews))
        })
        .clone()
}

/// 创建Crew
#[tauri::command]
pub async fn create_crew(request: CreateCrewRequest) -> Result<Crew, String> {
    tracing::info!("创建Crew: {}", request.name);

    let mut crew = Crew::new(request.name, request.agent_ids, request.process);

    if let Some(tasks) = request.tasks {
        crew.tasks = tasks
            .into_iter()
            .map(|t| {
                let mut task = Task::new(t.description, t.expected_output);
                if let Some(agent_id) = t.agent_id {
                    task = task.with_agent(agent_id);
                }
                if let Some(deps) = t.depends_on {
                    task = task.with_dependencies(deps);
                }
                task
            })
            .collect();
    }

    if let Some(memory) = request.memory_enabled {
        crew.memory_enabled = memory;
    }

    let id = crew.id.clone();
    let crews = get_crews();
    crews.write().await.insert(id, crew.clone());

    tracing::info!("Crew创建成功: {}", crew.id);
    Ok(crew)
}

/// 执行Crew
#[tauri::command]
pub async fn execute_crew(crew_id: String) -> Result<CrewExecutionResult, String> {
    tracing::info!("执行Crew: {}", crew_id);

    let crews = get_crews().read().await;
    let crew = crews
        .get(&crew_id)
        .ok_or("Crew不存在")?
        .clone();
    drop(crews);

    // 更新状态为运行中
    {
        let crews = get_crews().write().await;
        if let Some(c) = crews.get_mut(&crew_id) {
            c.status = CrewStatus::Running;
        }
    }

    let mut task_results = Vec::new();
    let mut final_output = String::new();
    let mut crew_context = String::new(); // 用于Agent间共享上下文

    // 根据执行模式处理任务
    match crew.process {
        crate::models::ProcessType::Sequential => {
            // 顺序执行
            for (idx, task) in crew.tasks.iter().enumerate() {
                tracing::info!("执行任务 {}: {}", idx + 1, task.description);
                
                // 确定执行Agent
                let agent_id = task.agent_id.clone()
                    .or_else(|| crew.agent_ids.first().cloned())
                    .ok_or("没有可用的Agent")?;

                // 构建Prompt
                let prompt = build_task_prompt(&crew, task, &crew_context);
                
                let messages = vec![
                    ChatMessage {
                        role: MessageRole::System,
                        content: "你是一个专业的AI助手。请根据任务要求完成任务。".to_string(),
                    },
                    ChatMessage {
                        role: MessageRole::User,
                        content: prompt,
                    },
                ];

                let params = ModelParams {
                    model_name: "qwen2.5:72b".to_string(), // TODO: 从Agent配置获取
                    messages,
                    temperature: Some(0.7),
                    max_tokens: Some(4096),
                    stream: Some(false),
                };

                match call_model(params).await {
                    Ok(response) => {
                        let result = TaskResult {
                            task_id: task.id.clone(),
                            agent_id,
                            status: TaskStatus::Completed,
                            output: Some(response.content.clone()),
                            error: None,
                        };
                        crew_context.push_str(&format!("\n\n任务 {} 结果: {}", idx + 1, response.content));
                        final_output = response.content;
                        task_results.push(result);
                    }
                    Err(e) => {
                        let result = TaskResult {
                            task_id: task.id.clone(),
                            agent_id,
                            status: TaskStatus::Failed,
                            output: None,
                            error: Some(e.clone()),
                        };
                        task_results.push(result);
                        
                        // 更新Crew状态为失败
                        let crews = get_crews().write().await;
                        if let Some(c) = crews.get_mut(&crew_id) {
                            c.status = CrewStatus::Failed;
                        }
                        
                        return Err(e);
                    }
                }
            }
        }
        crate::models::ProcessType::Hierarchical => {
            // 层级执行 - Manager自动分配
            // TODO: 实现层级执行逻辑
            return Err("层级执行暂未实现".to_string());
        }
    }

    // 更新Crew状态为完成
    {
        let crews = get_crews().write().await;
        if let Some(c) = crews.get_mut(&crew_id) {
            c.status = CrewStatus::Completed;
            c.completed_at = Some(chrono::Utc::now().to_rfc3339());
        }
    }

    tracing::info!("Crew执行完成: {}", crew_id);
    Ok(CrewExecutionResult {
        crew_id,
        status: CrewStatus::Completed,
        task_results,
        final_output: Some(final_output),
        error: None,
    })
}

/// 构建任务Prompt
fn build_task_prompt(crew: &Crew, task: &Task, context: &str) -> String {
    let mut prompt = String::new();
    
    // 添加上下文（如果有）
    if !context.is_empty() {
        prompt.push_str("【之前的任务结果】\n");
        prompt.push_str(context);
        prompt.push_str("\n\n");
    }
    
    // 添加任务信息
    prompt.push_str("【当前任务】\n");
    prompt.push_str(&task.description);
    prompt.push_str("\n\n【期望输出】\n");
    prompt.push_str(&task.expected_output);
    
    prompt
}

/// 获取Crew状态
#[tauri::command]
pub async fn get_crew_status(crew_id: String) -> Result<Option<CrewStatus>, String> {
    let crews = get_crews().read().await;
    Ok(crews.get(&crew_id).map(|c| c.status.clone()))
}
