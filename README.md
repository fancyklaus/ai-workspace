# AI Workspace - 多Agent协作平台

基于 CrewAI 理念的多Agent桌面应用，支持多种大语言模型的统一抽象与管理。

## 功能特性

- **Agent 管理**: 创建、编辑、删除 AI Agent，支持 4 种预设模板（Coder / Reviewer / Documenter / Researcher）
- **Crew 编排**: 将多个 Agent 组队，按顺序执行复杂任务
- **多模型支持**: 统一抽象 Ollama / OpenAI / Claude / 通义等模型
- **桌面集成**: 基于 Tauri + React 构建，原生性能

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **桌面**: Tauri 2 (Rust)
- **状态管理**: React Hooks (useAgents, useCrew)
- **后端通信**: Tauri IPC

## 快速开始

### 前端开发

```bash
cd ai-workspace
npm install
npm run dev
```

### 完整桌面应用

```bash
npm run tauri:dev
```

### 构建发布

```bash
npm run tauri:build
```

## 项目结构

```
ai-workspace/
├── src/
│   ├── components/     # React UI 组件
│   ├── hooks/          # 状态管理 Hooks
│   ├── services/       # API 服务层
│   ├── types/          # TypeScript 类型定义
│   ├── App.tsx         # 主应用
│   └── main.tsx        # 入口文件
├── src-tauri/
│   ├── src/
│   │   ├── models/     # Rust 数据模型
│   │   ├── agent.rs    # Agent 逻辑
│   │   ├── crew.rs     # Crew 编排逻辑
│   │   └── lib.rs      # 库入口
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## License

MIT
