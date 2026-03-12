---
description: VIBE CODING 主入口。输入需求和约束，自动完成 brief → plan → implement → audit → 报告全流程。
---

# /vibe-product

## 触发方式

```
/vibe-product
需求：[一段话描述你要实现的功能]
约束：[有哪些不能动的地方，没有则写"无"]
task-id：[自定义一个 ID，如 feat-001]
```

## 执行流程

你是本次 task 的总协调人（主线程）。按以下顺序执行：

### Step 1：读取上下文（必须）
1. 读取 `PROJECT_STATE.md`
2. 读取 `CLAUDE.md` 宪法
3. 读取 `docs/decisions/` 下的相关 ADR
4. 如果项目是空的，先初始化（见 Step 0）

### Step 2：创建 Brief
在 `docs/briefs/[task-id].md` 创建 brief，格式：
```markdown
# Brief: [task-id]
**日期**：[今天日期]
**状态**：进行中

## 需求描述
[用户原话]

## 约束
[用户原话]

## 验收标准
（由 planner 填写）
```

### Step 3：调用 planner
- 触发 planner agent
- planner 输出：验收标准 + 实现计划 + 必要的 ADR
- **如果 planner 发现任何架构问题需要人工决策，立即停下并提示用户**

### Step 4：调用 implementer（在 worktree 沙箱里）
- 触发 implementer agent（isolation: worktree）
- implementer 按 planner 计划实现
- **如果 implementer 遇到计划外情况，立即停下并提示用户**

### Step 5：调用 auditor
- 触发 auditor agent
- auditor 输出完整交付报告
- 如果报告包含 ❌ 宪法违规，要求 implementer 修复，最多重试 2 次

### Step 6：交付报告
把 auditor 的完整报告呈现给用户，然后更新 brief 状态为"已完成"。

## 高风险中断规则

以下情况必须停下来等用户确认，不能自动继续：
- planner 发现需要超出变更预算的改动
- planner 发现需要新外部依赖
- implementer 遇到"已知地雷"
- auditor 发现宪法违规且 2 次重试后仍未修复
- 任何 hook 返回 HIGH_RISK 信号
