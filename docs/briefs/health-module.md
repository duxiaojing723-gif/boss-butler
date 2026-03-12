# Brief: health-module

**日期**：2026-03-12
**状态**：进行中

---

## 需求描述

在"单单的小助理"中新增"健康助理"模块，让用户用最少操作记录运动消耗和饮食摄入。包括：拍照识别食物热量（GPT-4o Vision）、选择运动类型+时长自动估算卡路里、健康首页汇总今日摄入/消耗/净值。

---

## 约束

- 不引入新外部依赖（复用现有 base64-in-JSON 模式）
- 照片客户端压缩到 ~200KB，不需要 multer/Supabase Storage
- MET 公式硬编码，不调用 LLM
- GPT-4o Vision `detail: 'low'` 控制成本

---

## 不做什么（本次范围外）

- Apple Health 自动同步（Web 无法访问 HealthKit）
- 历史趋势图表
- 营养目标设定
- 多用户支持

---

## 验收标准

- [ ] Supabase 建表 SQL 可执行（exercises, meals）
- [ ] `/api/analyze-food` 接收 base64 图片，返回食物营养数据
- [ ] `/api/estimate-exercise` 接收运动类型+时长，返回 calories_burned
- [ ] 健康首页显示今日摘要（摄入/消耗/净值）+ 今日记录列表
- [ ] 记运动页：选类型、输时长、实时估算、保存到 Supabase
- [ ] 拍一餐页：拍照/选图、压缩、AI 分析、可编辑、保存到 Supabase
- [ ] 底部导航新增"健康" tab
- [ ] `npx vite build` 无报错

---

## 实现计划

**Task 1 — 数据库 + API（4 文件）**：
- `supabase-schema.sql`：新增 exercises + meals 表
- `api/analyze-food.js`：食物识别 endpoint
- `api/estimate-exercise.js`：运动热量 endpoint
- `server.js`：apiModules 添加 2 条路由

**Task 2 — 前端核心 + 导航（4 文件）**：
- `src/lib/health.js`：健康模块共享逻辑
- `src/components/Icons.jsx`：新增 4 个图标
- `src/App.jsx`：路由 + 导航 tab
- `src/pages/Health.jsx`：健康首页

**Task 3 — 运动记录页（1-2 文件）**：
- `src/pages/LogExercise.jsx`

**Task 4 — 拍照记餐页（1-2 文件）**：
- `src/pages/LogMeal.jsx`

**测试要求**：
- 手动验证（测试框架暂未配置）

---

## 交付报告

> 由 auditor 填写
