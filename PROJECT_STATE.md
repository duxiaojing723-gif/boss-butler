# Project State

> 每次 session 结束前由 Stop hook 强制更新。
> 新 session 开始，所有 agent 必须先读本文件。

---

## 项目基本信息

- **项目名**：boss-butler
- **阶段**：Alpha
- **最后更新**：2026-03-12
- **最后 task**：（初始化）

---

## 当前架构状态

### 架构概览

- **入口**：`server.js`（Express 服务器，生产环境同时托管 Vite 构建产物）
- **后端**：`/api/*.js` handlers，Express 路由
- **前端**：`/src/`（React + Vite + Tailwind），构建输出到 `/dist/`
- **LLM 模块**：`/api/_llm.js`（OpenAI GPT-4o 统一调用层）
- **数据库**：Supabase PostgreSQL（schema 见 `supabase-schema.sql`）
- **部署**：Docker → Zeabur（香港区域），用户在美国

### 已确认模块边界

- `api/`：后端 API handlers，每个文件对应一个功能端点
  - `_llm.js`：共享 LLM 调用模块，所有 AI 功能统一通过此模块
  - `ask.js`：问答功能
  - `parse.js`：解析功能
  - `transcribe.js`：语音转文字
  - `translate.js`：翻译功能
  - `voice.js`：语音合成
- `src/`：React 前端
  - `src/lib/`：前端共享逻辑
  - `src/pages/`：页面组件

### 技术债登记

（初始为空，发现时立即登记，详见 `docs/debt-register.md`）

### 已知地雷（禁止随意动的地方）

- `api/_llm.js`：所有 API handler 的共享依赖，修改前必须确认不影响所有调用方
- `server.js`：生产环境入口，修改需谨慎

---

## 上次 session 遗留

### 未完成事项

（初始为空）

### 待决策事项

（初始为空）

### 已知但未解决的风险

（初始为空）

---

## ADR 索引

（初始为空，每次新增 ADR 在此登记）
<!--
| ID | 标题 | 状态 | 日期 |
|----|------|------|------|
-->

---

## 依赖清单

| 包名 | 版本 | 用途 | 引入 task |
|------|------|------|---------|
| express | ^5.1.0 | 后端 HTTP 服务器 | 初始化 |
| openai | ^6.27.0 | OpenAI GPT-4o API 调用 | 初始化 |
| @supabase/supabase-js | ^2.99.0 | Supabase 数据库客户端 | 初始化 |
| react | ^19.2.0 | 前端 UI 框架 | 初始化 |
| react-dom | ^19.2.0 | React DOM 渲染 | 初始化 |
| react-router-dom | ^7.13.1 | 前端路由 | 初始化 |
