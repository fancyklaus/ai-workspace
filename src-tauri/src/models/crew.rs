use serde::{Deserialize, Serialize};
use uuid::Uuid;
use super::task::Task;

/// 执行流程类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessType {
    Sequential,    // 顺序执行
    Hierarchical, // 层级执行（Manager自动分配）
}

/// Crew定义 - Agent团队编排
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Crew {
    pub id: String,
    pub name: String,
    pub agent_ids: Vec<String>,    // Agent ID列表
    pub tasks: Vec<Task>,
    pub process: ProcessType,
    pub verbose: bool,
    pub memory_enabled: bool,      // Agent间共享记忆
    pub status: CrewStatus,
    pub created_at: String,
    pub completed_at: Option<String>,
}

impl Crew {
    pub fn new(name: String, agent_ids: Vec<String>, process: ProcessType) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            agent_ids,
            tasks: vec![],
            process,
            verbose: true,
            memory_enabled: true,
            status: CrewStatus::Idle,
            created_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
        }
    }

    pub fn with_tasks(mut self, tasks: Vec<Task>) -> Self {
        self.tasks = tasks;
        self
    }
}

/// Crew执行状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CrewStatus {
    Idle,
    Running,
    Completed,
    Failed,
}

impl Default for CrewStatus {
    fn default() -> Self {
        CrewStatus::Idle
    }
}

/// 创建Crew请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCrewRequest {
    pub name: String,
    pub agent_ids: Vec<String>,
    pub process: ProcessType,
    pub tasks: Option<Vec<super::task::CreateTaskRequest>>,
    pub memory_enabled: Option<bool>,
}

/// Crew执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrewExecutionResult {
    pub crew_id: String,
    pub status: CrewStatus,
    pub task_results: Vec<TaskResult>,
    pub final_output: Option<String>,
    pub error: Option<String>,
}

/// 单个任务执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskResult {
    pub task_id: String,
    pub agent_id: String,
    pub status: super::task::TaskStatus,
    pub output: Option<String>,
    pub error: Option<String>,
}
