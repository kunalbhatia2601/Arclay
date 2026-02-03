---
description: Deploy Arclay Next.js app to VPS with PM2 and Nginx
---

# Arclay VPS Deployment Workflow

This workflow guides you through deploying the Arclay Next.js ecommerce application to a VPS (Ubuntu/Debian).

---

## Prerequisites

Before starting, ensure you have:
- [ ] SSH access to your VPS
- [ ] A domain name (optional but recommended)
- [ ] VPS with at least 1GB RAM

---

## Part 1: Initial VPS Setup (One-time)

### Step 1.1: SSH into Your VPS

```bash
# SSH into your VPS as root
ssh root@YOUR_VPS_IP
```

> [!TIP]
> **Using root is fine** for personal projects or single-purpose VPS. If you prefer a dedicated user for security isolation, expand the section below.

<details>
<summary>Optional: Create a dedicated user instead of root</summary>

```bash
# Create a new user for Arclay
adduser arclay

# Add user to sudo group
usermod -aG sudo arclay

# Switch to the new user
su - arclay
```
If using a dedicated user, replace `/root/` with `/home/arclay/` in all paths below.
</details>

### Step 1.2: Install Required Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun (used by this project)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 globally for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 1.3: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Part 2: Deploy the Application

### Step 2.1: Clone the Repository

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/kunalbhatia2601/Arclay.git
cd Arclay
```

### Step 2.2: Setup Environment Variables

```bash
# Create production .env file
nano .env
```

Add your production environment variables:
```env
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name

JWT_SECRET=your_secure_jwt_secret_here

MONGODB_URI=your_mongodb_connection_string

NEXT_PUBLIC_SITE_DESCRIPTION=Gourmet Indian Food - Premium Pickles & Snacks
NEXT_PUBLIC_SITE_NAME=ESSVORA
```

> [!CAUTION]
> Never commit your production `.env` file to git! Make sure it's in `.gitignore`.

### Step 2.3: Install Dependencies and Build

```bash
# Install dependencies
bun install

# Build the production app
bun run build
```

### Step 2.4: Configure Custom Port (Since 3000 is Used)

> [!NOTE]
> Since ports 3000, 3001 are already in use, we'll use a different port (e.g., 3010) for Arclay.

Create a PM2 ecosystem file:

```bash
# Create ecosystem.config.js
nano ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [{
    name: 'arclay',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3010',
    cwd: '/root/apps/Arclay',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/root/logs/arclay-error.log',
    out_file: '/root/logs/arclay-out.log'
  }]
};
```

### Step 2.5: Create Log Directory and Start App

```bash
# Create logs directory
mkdir -p /root/logs

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot (no sudo needed for root)
pm2 startup
# Run the command it outputs (it will tell you the exact command)
```

---

## Part 3: Configure Nginx Reverse Proxy

### Step 3.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/arclay
```

Add the following (for arclay.kunalbhatia.dev):

```nginx
server {
    listen 80;
    server_name arclay.kunalbhatia.dev;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3010;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    client_max_body_size 10M;
}
```

### Step 3.2: Enable the Site

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/arclay /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Part 4: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will auto-configure Nginx for HTTPS
```

---

## Part 5: Deployment Commands (For Updates)

### Quick Update Script

Create a deployment script for easy updates:

```bash
nano /root/apps/Arclay/deploy.sh
```

Add:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Arclay..."

cd ~/apps/Arclay

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
bun install

echo "🔨 Building application..."
bun run build

echo "🔄 Restarting PM2 process..."
pm2 restart arclay

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x /root/apps/Arclay/deploy.sh
```

### To deploy updates:
// turbo-all
```bash
~/apps/Arclay/deploy.sh
```

---

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Check app status |
| `pm2 logs arclay` | View app logs |
| `pm2 restart arclay` | Restart app |
| `pm2 stop arclay` | Stop app |
| `pm2 monit` | Monitor app in terminal |
| `sudo systemctl status nginx` | Check Nginx status |
| `sudo nginx -t` | Test Nginx config |
| `sudo tail -f /var/log/nginx/error.log` | View Nginx errors |

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using a specific port
sudo lsof -i :3010

# Kill process on a port
sudo kill -9 $(sudo lsof -t -i:3010)
```

### App Not Starting
```bash
# Check PM2 logs
pm2 logs arclay --lines 100

# Check if build was successful
cd ~/apps/Arclay && ls -la .next
```

### Nginx 502 Bad Gateway
- Ensure PM2 app is running: `pm2 status`
- Check if port matches in Nginx config and PM2 config
- Check app logs: `pm2 logs arclay`

---

## Port Configuration Summary

| Service | Port | Notes |
|---------|------|-------|
| Arclay (Next.js) | 3010 | Internal port (not exposed) |
| Nginx HTTP | 80 | Public access |
| Nginx HTTPS | 443 | Public access (after SSL) |

> [!TIP]
> Your app runs on port 3010 internally, but users access it via port 80/443 through Nginx. This keeps ports 3000, 3001 free for your other apps!
