# 工程宪法

> 本文件是本项目最高规则。所有 agent、skill、人类都必须遵守。
> 修改本文件须走 /amend-constitution 流程，不允许在实现任务中顺手修改。

---

## 核心原则

1. **Brief 先行**：没有 `/docs/briefs/[task-id].md` 不允许写任何代码
2. **ADR 先行**：新模块 / 新外部依赖 / 新公开接口，必须先在 `/docs/decisions/` 创建决策记录
3. **模块边界**：API handler 不直接操作数据库，统一通过 Supabase client 封装层
4. **变更预算**：单次 task 最多修改 5 个文件，最多新增 1 个模块，不允许引入新外部依赖（需独立审批）
5. **质量门槛**：每次变更 lint 必须通过才算完成（测试暂未配置，后续补充）

---

## 禁止事项（任何情况下不允许）

- 在 API handler 里直接写 SQL 或绕过 Supabase client
- 把业务逻辑写进前端组件（应抽到 src/lib/）
- 硬编码配置（统一走 env / config 文件）
- 在共享模块（api/_llm.js, src/lib/）塞临时逻辑
- 无关重构（修 bug 时不允许顺手改其他代码风格）
- 在实现任务过程中修改 CLAUDE.md 或 agent 定义

---

## 高风险动作（必须停下来等待人工确认）

- 删除或重命名 Supabase 数据库表 / 字段
- 修改认证 / 授权逻辑
- 修改生产环境配置（Dockerfile, 环境变量）
- 新增公开 API endpoint
- 引入新的外部依赖（npm install）
- 执行 git push 或任何部署命令
- 修改 .claude/ 目录下任何文件

---

## 技术栈锁定

> 修改此节须走 /amend-constitution 流程

- **语言**：JavaScript（ES Module，不引入 TypeScript）
- **运行时**：Node.js
- **后端**：Express (server.js 入口，/api/*.js handlers)
- **前端**：React + Vite + Tailwind CSS
- **数据库**：Supabase PostgreSQL
- **LLM**：OpenAI GPT-4o（通过 api/_llm.js 统一调用）
- **测试**：暂未配置，后续补充
- **Lint**：ESLint
- **部署**：Docker → Zeabur（香港区域）

---

## 交付格式

每次 task 结束，auditor 必须输出以下报告，Stop hook 检查报告存在后才允许结束：

```
## 变更摘要
- 修改文件列表（每行一个，标注改了什么）

## 测试结果
- lint: PASS / FAIL
- test: 暂未配置

## 剩余风险
- （列出已知但未解决的问题）

## 待你决策
- （需要人工判断的事项，没有则写"无"）

## PROJECT_STATE 已更新
- （确认 PROJECT_STATE.md 已更新）
```

---

## 宪法版本

- v1.0 — 初始版本（2026-03-12）
- 变更历史见 `/docs/decisions/constitution-changes.md`
