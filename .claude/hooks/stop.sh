#!/bin/bash
# Stop Hook — 收尾门禁
# 触发时机：Claude 准备结束 session 时
# 作用：检查交付完整性，不达标则 block 退出

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REPORT_REQUIRED=true
ERRORS=()

echo "=== Stop Hook: 收尾门禁检查 ==="

# ── 1. 检查 lint ──────────────────────────────────────────────
echo "[1/4] 检查 lint..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if ! npm run lint --silent 2>/dev/null; then
    ERRORS+=("FAIL: lint 未通过，不允许结束 session")
  else
    echo "  ✓ lint PASS"
  fi
else
  echo "  跳过（未检测到 package.json）"
fi

# ── 2. 检查测试（可选，项目暂未配置测试）─────────────────────
echo "[2/4] 检查测试..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
  # 检查 package.json 是否有 test script（且不是默认的 echo 占位）
  if grep -q '"test"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
    TEST_SCRIPT=$(node -e "const p=require('$PROJECT_ROOT/package.json');console.log(p.scripts?.test||'')" 2>/dev/null)
    if [ -n "$TEST_SCRIPT" ] && ! echo "$TEST_SCRIPT" | grep -q "no test specified"; then
      if ! npm run test --silent 2>/dev/null; then
        ERRORS+=("FAIL: 测试未通过，不允许结束 session")
      else
        echo "  ✓ test PASS"
      fi
    else
      echo "  跳过（测试暂未配置）"
    fi
  else
    echo "  跳过（测试暂未配置）"
  fi
else
  echo "  跳过（未检测到 package.json）"
fi

# ── 3. 检查交付报告 ───────────────────────────────────────────
echo "[3/4] 检查交付报告..."
STATE_FILE="$PROJECT_ROOT/PROJECT_STATE.md"
if [ -f "$STATE_FILE" ]; then
  # 检查是否在过去 1 小时内被修改
  if find "$STATE_FILE" -mmin -60 | grep -q .; then
    echo "  ✓ PROJECT_STATE.md 已在本次 session 更新"
  else
    ERRORS+=("FAIL: PROJECT_STATE.md 未在本次 session 更新，必须更新后才能结束")
  fi
else
  ERRORS+=("FAIL: PROJECT_STATE.md 不存在，请先创建")
fi

# ── 4. 检查技术债登记 ─────────────────────────────────────────
echo "[4/4] 检查技术债..."
DEBT_FILE="$PROJECT_ROOT/docs/debt-register.md"
if [ ! -f "$DEBT_FILE" ]; then
  echo "  提醒：debt-register.md 不存在，建议创建"
fi
echo "  ✓ 技术债检查完成"

# ── 结果 ─────────────────────────────────────────────────────
echo ""
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "=== ❌ 收尾门禁未通过，session 不允许结束 ==="
  for err in "${ERRORS[@]}"; do
    echo "  → $err"
  done
  echo ""
  echo "请修复上述问题后重新结束。"
  exit 1
else
  echo "=== ✅ 收尾门禁全部通过，session 可以结束 ==="
  exit 0
fi
