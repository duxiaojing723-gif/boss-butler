#!/bin/bash
# ConfigChange Hook — 宪法变更审计
# 触发时机：.claude/ 目录或 CLAUDE.md 被修改时
# 作用：强制记录变更，防止悄悄改宪法

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# 检测是否在修改受保护文件
PROTECTED_FILES=("CLAUDE.md" ".claude/settings.json" ".claude/agents/" ".claude/hooks/")

IS_PROTECTED=false
for pattern in "${PROTECTED_FILES[@]}"; do
  if echo "$TOOL_INPUT" | grep -q "$pattern"; then
    IS_PROTECTED=true
    break
  fi
done

if [ "$IS_PROTECTED" = true ]; then
  if [ "${AMEND_CONSTITUTION_AUTHORIZED:-}" != "true" ]; then
    echo "AUDIT: 检测到对受保护文件的修改"
    echo "文件：$TOOL_INPUT"
    echo ""
    echo "如果这是通过 /amend-constitution 发起的，这是正常流程。"
    echo "如果不是，请停止并使用 /amend-constitution skill。"
    echo ""
    AUDIT_LOG="$PROJECT_ROOT/docs/decisions/constitution-changes.md"
    if [ -f "$AUDIT_LOG" ]; then
      echo "" >> "$AUDIT_LOG"
      echo "## 未授权修改尝试 — $(date '+%Y-%m-%d %H:%M')" >> "$AUDIT_LOG"
      echo "**文件**：$TOOL_INPUT" >> "$AUDIT_LOG"
      echo "**状态**：已记录，需人工确认" >> "$AUDIT_LOG"
    fi
    exit 2
  fi
fi

exit 0
