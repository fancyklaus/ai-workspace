use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Manager;
use crate::commands::chat::ChatState;

mod commands;
mod models;

pub use commands::*;
pub use models::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(RwLock::new(ChatState::default())))
        .setup(|app| {
            tracing::info!("✅ AI Workspace 初始化完成");

            // 获取主窗口
            let window = app.get_webview_window("main").unwrap();
            window.set_title("AI Workspace - 多Agent协作平台").ok();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 模型相关命令
            commands::model::call_model,
            commands::model::list_ollama_models,
            // Agent相关命令
            commands::agent::create_agent,
            commands::agent::list_agents,
            commands::agent::get_agent,
            commands::agent::delete_agent,
            // Crew相关命令
            commands::crew::create_crew,
            commands::crew::execute_crew,
            commands::crew::get_crew_status,
            // 聊天相关命令
            commands::chat::chat_stream,
            commands::chat::get_conversation_history,
            commands::chat::create_conversation,
            commands::chat::clear_conversation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
