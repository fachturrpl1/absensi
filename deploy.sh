#!/bin/bash
set -euo pipefail

################################
# KONFIGURASI (Pindahkan ke atas agar bisa dipakai LOCK)
################################
BOT_TOKEN="8502393105:AAFYm1KHBD-NouXXUqgIjlousB1BzJTTtro"
CHAT_ID="5752910816"

PROJECT_NAME="Project Absensi Web"
PROJECT_PATH="/www/wwwroot/absensi"
SSH_KEY="/root/.ssh/id_ed25519_fachtur"
GIT_REMOTE="git@fachtur:fachturscompany/absensi.git"
BRANCH="main"
LOG_FILE="/tmp/deploy_absensi.log"
LOCK_FILE="/tmp/deploy_escl.lock"

################################
# LOCK (ANTI DEPLOY BARENGAN)
################################
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    # Sekarang variabel BOT_TOKEN sudah terbaca karena sudah didefinisikan di atas
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d "chat_id=$CHAT_ID&text=⚠️ <b>$PROJECT_NAME</b>:%0ADeploy diabaikan karena proses sebelumnya belum selesai.&parse_mode=html"
    exit 0
fi

# Trap untuk memastikan lock dilepas saat skrip selesai/error
trap "exec 9>&-; rm -f $LOCK_FILE" EXIT

################################
# TELEGRAM FUNCTION
################################
send_telegram() {
    set +e
    local status="$1"
    local time_now=$(TZ=Asia/Jakarta date +"%Y-%m-%d %H:%M:%S WIB")

    cd "$PROJECT_PATH" 2>/dev/null || true
    local commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
    local commit_author=$(git log -1 --pretty=%an 2>/dev/null || echo "System")
    local commit_msg=$(git log -1 --pretty=%s 2>/dev/null || echo "-")

    local text="<b>$status</b>%0A%0A"
    text+="<b>Project:</b> $PROJECT_NAME%0A"
    text+="<b>Waktu:</b> $time_now%0A"
    text+="<b>Author:</b> $commit_author%0A"
    text+="<b>Commit:</b> <code>$commit_hash</code>%0A"
    text+="<code>$commit_msg</code>"

    curl -s --max-time 10 -X POST \
        "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d "chat_id=$CHAT_ID&parse_mode=html&text=$text" >/dev/null 2>&1
    set -e
}

################################
# DEPLOY FUNCTION
################################
deploy() {
    echo "===== DEPLOY $(date) =====" >> "$LOG_FILE"
    cd "$PROJECT_PATH"
    chmod 600 "$SSH_KEY"
    export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o PasswordAuthentication=no"
    
    git config --global --add safe.directory "$PROJECT_PATH"
    git remote set-url origin "$GIT_REMOTE"
    
    echo "Pulling latest code..." >> "$LOG_FILE"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"

    echo "Installing dependencies..." >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1

    echo "Building Next.js..." >> "$LOG_FILE"
    npm run build >> "$LOG_FILE" 2>&1

    echo "Restarting Node App..." >> "$LOG_FILE"
    pkill -f "next start" || true
    nohup npm start >> "$LOG_FILE" 2>&1 &
}

################################
# RUN
################################
if deploy; then
    send_telegram "✅ DEPLOYMENT BERHASIL"
else
    send_telegram "❌ DEPLOYMENT GAGAL"
    exit 1
fi