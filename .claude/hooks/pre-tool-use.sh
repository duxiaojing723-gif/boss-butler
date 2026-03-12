#!/bin/bash
# PreToolUse Hook — 入口门禁
# 触发时机：Claude 准备调用工具前
# 作用：拦截危险命令，检查 brief 存在

# Claude Code 通过环境变量传入工具信息
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# ── 1. 危险 Bash 命令拦截 ──────────────────────────────────────
if [ "$TOOL_NAME" = "Bash" ]; then
  CMD="$TOOL_INPUT"

  # 硬拦截（直接 block，不问人）
  HARD_BLOCK_PATTERNS=(
    "rm -rf"
    "DROP TABLE"
    "DROP DATABASE"
    "git push --force"
    "git reset --hard"
    "chmod 777"
    "sudo rm"
  )

  for pattern in "${HARD_BLOCK_PATTERNS[@]}"; do
    if echo "$CMD" | grep -qi "$pattern"; then
      echo "BLOCK: 危险命令被拦截 → $pattern"
      echo "命令内容：$CMD"
      echo "如需执行，请在确认后手动运行，不允许通过 Claude 执行。"
      exit 1
    fi
  done

  # 软拦截（需要确认的高风险命令）
  SOFT_BLOCK_PATTERNS=(
    "npm install"
    "pip install"
    "git push"
    "deploy"
    "migrate"
    "ALTER TABLE"
  )

  for pattern in "${SOFT_BLOCK_PATTERNS[@]}"; do
    if echo "$CMD" | grep -qi "$pattern"; then
      echo "HIGH_RISK: 检测到高风险命令 → $pattern"
      echo "命令内容：$CMD"
      echo "此为高风险动作，已暂停。请人工确认是否继续。"
      # 返回特殊退出码触发 PermissionRequest
      exit 2
    fi
  done
fi

# ── 2. 写操作检查：是否有 brief ───────────────────────────────
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  # 检查是否有 active brief（过去 24 小时内创建的）
  BRIEF_DIR="$PROJECT_ROOT/docs/briefs"
  if [ -d "$BRIEF_DIR" ]; then
    RECENT_BRIEF=$(find "$BRIEF_DIR" -name "*.md" -mtime -1 2>/dev/null | head -1)
    if [ -z "$RECENT_BRIEF" ]; then
      echo "BLOCK: 没有找到有效的 task brief"
      echo "请先创建 /docs/briefs/[task-id].md 再开始编码"
      echo "Brief 模板位于 /docs/briefs/_template.md"
      exit 1
    fi
  fi
fi

# ── 3. 禁止修改宪法和 agent 配置（需走专用 skill）─────────────
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE_PATH="$TOOL_INPUT"
  if echo "$FILE_PATH" | grep -q "\.claude/"; then
    echo "BLOCK: 不允许直接修改 .claude/ 目录"
    echo "修改宪法请使用 /amend-constitution"
    echo "修改 agent 配置请使用专用流程"
    exit 1
  fi
  if echo "$FILE_PATH" | grep -q "CLAUDE\.md"; then
    echo "BLOCK: 不允许直接修改 CLAUDE.md"
    echo "请使用 /amend-constitution skill"
    exit 1
  fi
fi

exit 0
