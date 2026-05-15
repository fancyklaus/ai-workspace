use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 模型提供商
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ModelProvider {
    Ollama,
    OpenAI,
    Claude,
    Qwen,
    Ernie,
}

impl Default for ModelProvider {
    fn default() -> Self {
        ModelProvider::Ollama
    }
}

impl std::fmt::Display for ModelProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ModelProvider::Ollama => write!(f, "ollama"),
            ModelProvider::OpenAI => write!(f, "openai"),
            ModelProvider::Claude => write!(f, "claude"),
            ModelProvider::Qwen => write!(f, "qwen"),
            ModelProvider::Ernie => write!(f, "ernie"),
        }
    }
}

/// Agent定义
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub role: String,           // 角色名称：如 "代码审查员"
    pub goal: String,           // 目标：如 "确保代码质量"
    pub backstory: String,      // 背景故事
    pub model_provider: ModelProvider,
    pub model_name: String,     // 如 "qwen2.5:72b"
    pub tools: Vec<String>,     // 可用工具列表
    pub verbose: bool,
    pub delegate_to_crew: bool, // 是否可以委托任务给其他Agent
    pub created_at: String,
    pub updated_at: String,
}

impl Agent {
    pub fn new(
        name: String,
        role: String,
        goal: String,
        backstory: String,
        model_name: String,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            role,
            goal,
            backstory,
            model_provider: ModelProvider::default(),
            model_name,
            tools: vec![],
            verbose: true,
            delegate_to_crew: true,
            created_at: now.clone(),
            updated_at: now,
        }
    }
}

/// Agent创建请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentRequest {
    pub name: String,
    pub role: String,
    pub goal: String,
    pub backstory: String,
    pub model_provider: Option<ModelProvider>,
    pub model_name: Option<String>,
    pub tools: Option<Vec<String>>,
    pub verbose: Option<bool>,
    pub delegate_to_crew: Option<bool>,
}

/// 预设Agent模板
pub struct AgentTemplates;

impl AgentTemplates {
    pub fn coder() -> Agent {
        Agent::new(
            "代码助手".to_string(),
            "代码助手".to_string(),
            "帮助用户编写高质量代码".to_string(),
            "你是一位经验丰富的全栈工程师，擅长解决各种编程问题。你的代码简洁、高效、可维护。".to_string(),
            "qwen2.5:72b".to_string(),
        )
    }

    pub fn reviewer() -> Agent {
        Agent::new(
            "代码审查员".to_string(),
            "代码审查员".to_string(),
            "发现代码中的问题和改进点".to_string(),
            "你是一位追求完美的代码审查专家。你总能发现代码中的潜在问题并提出建设性的改进建议。".to_string(),
            "qwen2.5:72b".to_string(),
        )
    }

    pub fn documenter() -> Agent {
        Agent::new(
            "文档助手".to_string(),
            "文档助手".to_string(),
            "生成清晰的文档和说明".to_string(),
            "你是一位技术文档专家，擅长将复杂的技术概念用简洁清晰的语言表达出来。".to_string(),
            "qwen2.5:72b".to_string(),
        )
    }

    pub fn researcher() -> Agent {
        Agent::new(
            "研究助手".to_string(),
            "研究助手".to_string(),
            "深入分析技术问题和最佳实践".to_string(),
            "你是一位专业的研究员，擅长深入分析问题，查找资料，总结最佳实践。".to_string(),
            "qwen2.5:72b".to_string(),
        )
    }
}
