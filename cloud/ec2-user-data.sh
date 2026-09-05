#!/bin/bash
# ==============================================================================
# PulseIQ AWS EC2 Automated Provisioning and Deployment Script
# Compatible with Amazon Linux 2023, Amazon Linux 2, Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo " Starting PulseIQ Cloud Deployment on AWS EC2"
echo " Date: $(date)"
echo "=================================================="

# 1. Detect OS and install Docker + Git
if command -v dnf &> /dev/null; then
    echo "[1/5] Detected Amazon Linux / RHEL / Fedora (dnf)"
    dnf update -y
    dnf install -y docker git curl
elif command -v apt-get &> /dev/null; then
    echo "[1/5] Detected Ubuntu / Debian (apt)"
    apt-get update -y
    apt-get install -y docker.io docker-compose-v2 git curl
fi

# 2. Enable and Start Docker Service
echo "[2/5] Starting and enabling Docker daemon..."
systemctl enable --now docker
if id "ec2-user" &>/dev/null; then
    usermod -aG docker ec2-user
elif id "ubuntu" &>/dev/null; then
    usermod -aG docker ubuntu
fi

# 3. Ensure Docker Compose is installed
if ! docker compose version &>/dev/null; then
    echo "[3/5] Installing Docker Compose CLI plugin..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# 4. Create deployment workspace
APP_DIR="/opt/pulseiq"
echo "[4/5] Setting up deployment directory at ${APP_DIR}..."
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

# 5. Launch containers via Docker Compose
echo "[5/5] Launching PulseIQ Full-Stack Containers..."
if [ -f "docker-compose.yml" ]; then
    docker compose up -d --build
    echo "=================================================="
    echo " PulseIQ Cloud Deployment Complete!"
    echo " Frontend URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo 'localhost')"
    echo " Backend API:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo 'localhost'):8000/docs"
    echo "=================================================="
else
    echo "Notice: Place repository files in ${APP_DIR} and run 'docker compose up -d' to start."
fi
