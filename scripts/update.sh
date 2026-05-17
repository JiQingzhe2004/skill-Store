#!/usr/bin/env bash
# 从 git 拉取最新代码并完成部署更新
#
# 用法:
#   ./scripts/update.sh                # 拉 origin/main 并更新
#   BRANCH=dev ./scripts/update.sh     # 指定分支
#   REMOTE=upstream ./scripts/update.sh # 指定远端
#
# 智能跳过:
#   - 依赖文件没变就不跑 pnpm install
#   - prisma schema/migrations 没变就不跑 migrate deploy
#
# 失败自动回滚到原 commit + 重新构建 + 重启服务

set -euo pipefail

cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "${GREEN}✔${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err()  { echo -e "${RED}✘${NC} $*" >&2; }

need() { command -v "$1" >/dev/null 2>&1 || { err "缺少命令: $1"; exit 1; }; }
need git
need pnpm
need pm2

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { err "当前目录不是 git 仓库"; exit 1; }

BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/setup/status}"
PM2_APPS=("skill-store-api" "skill-store-web")

if [ -n "$(git status --porcelain)" ]; then
  warn "检测到本地未提交修改:"
  git status --short
  read -r -p "继续更新?(y/N) " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { err "已取消"; exit 1; }
fi

OLD_COMMIT=$(git rev-parse HEAD)
log "当前版本: $(git rev-parse --short HEAD)"

log "fetch $REMOTE/$BRANCH ..."
git fetch "$REMOTE" "$BRANCH"
NEW_COMMIT=$(git rev-parse "$REMOTE/$BRANCH")

if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
  ok "已是最新版本,无需更新"
  exit 0
fi

CHANGED=$(git diff --name-only "$OLD_COMMIT" "$NEW_COMMIT")
NEED_INSTALL=false
NEED_MIGRATE=false
echo "$CHANGED" | grep -qE '(^|/)(pnpm-lock\.yaml|package\.json)$' && NEED_INSTALL=true
echo "$CHANGED" | grep -qE '^apps/api/prisma/(migrations/|schema\.prisma)' && NEED_MIGRATE=true

log "本次变更 $(echo "$CHANGED" | wc -l | tr -d ' ') 个文件"
$NEED_INSTALL && log " · 依赖有变化 → 将运行 pnpm install"
$NEED_MIGRATE && log " · Prisma 有变化 → 将运行 migrate deploy"

ROLLED_BACK=false
rollback() {
  $ROLLED_BACK && return
  ROLLED_BACK=true
  err "更新失败,回滚到 $OLD_COMMIT"
  git reset --hard "$OLD_COMMIT" || true
  pnpm build || true
  pm2 restart "${PM2_APPS[@]}" || true
  exit 1
}
trap rollback ERR

log "git pull --ff-only ..."
git pull --ff-only "$REMOTE" "$BRANCH"
ok "代码已更新到 $(git rev-parse --short HEAD)"

if $NEED_INSTALL; then
  log "pnpm install --frozen-lockfile ..."
  pnpm install --frozen-lockfile
  ok "依赖安装完成"
fi

log "prisma generate ..."
pnpm prisma:generate >/dev/null
ok "Prisma Client 已生成"

if $NEED_MIGRATE; then
  log "prisma migrate deploy ..."
  pnpm prisma:migrate:deploy
  ok "数据库迁移完成"
fi

log "pnpm build ..."
pnpm build
ok "构建完成"

log "pm2 restart ${PM2_APPS[*]} ..."
pm2 restart "${PM2_APPS[@]}" --update-env
pm2 save >/dev/null 2>&1 || true
ok "服务已重启"

trap - ERR

log "健康检查: $HEALTH_URL"
HEALTHY=false
for i in $(seq 1 20); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  sleep 1
done
if $HEALTHY; then
  ok "API 已就绪"
else
  warn "健康检查未通过,可能仍在启动,请用 \`pm2 logs\` 查看"
fi

echo
ok "更新完成: ${OLD_COMMIT:0:7} → $(git rev-parse --short HEAD)"
log "查看状态: pm2 status"
log "查看日志: pm2 logs"
