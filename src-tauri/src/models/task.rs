use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 任务状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

impl Default for TaskStatus {
    fn default() -> Self {
        TaskStatus::Pending
    }
}

/// Task定义
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub description: String,     // 任务描述
    pub expected_output: String, // 期望输出
    pub agent_id: Option<String>, // 指定执行Agent（可选）
    pub depends_on: Vec<String>,  // 依赖的Task ID列表
    pub status: TaskStatus,
    pub result: Option<String>,   // 执行结果
    pub created_at: String,
    pub completed_at: Option<String>,
}

impl Task {
    pub fn new(description: String, expected_output: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            description,
            expected_output,
            agent_id: None,
            depends_on: vec![],
            status: TaskStatus::default(),
            result: None,
            created_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
        }
    }

    pub fn with_agent(mut self, agent_id: String) -> Self {
        self.agent_id = Some(agent_id);
        self
    }

    pub fn with_dependencies(mut self, depends_on: Vec<String>) -> Self {
        self.depends_on = depends_on;
        self
    }
}

/// 创建任务请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub description: String,
    pub expected_output: String,
    pub agent_id: Option<String>,
    pub depends_on: Option<Vec<String>>,
}
