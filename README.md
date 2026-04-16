# 减重打卡应用

这是一个基于 React + Vite 的手机优先减重打卡应用。

## 本地启动

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm install
npm run build
```

构建完成后，静态文件会输出到 `dist/` 目录。

## 推到 GitHub

```bash
git init
git add .
git commit -m "init weight checkin app"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 部署方式

### 方式 1：Cloudflare Pages
- 连接 GitHub 仓库
- Build command: `npm run build`
- Output directory: `dist`

### 方式 2：GitHub Pages（推荐）

本项目已配置好 GitHub Actions 自动部署：

1. **创建 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "init weight checkin app"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

3. **自动部署**
   - 每次 push 到 main 分支会自动触发部署
   - 也可在 Actions 页面手动触发
   - 部署完成后访问 `https://YOUR_USERNAME.github.io/weight-checkin/`

4. **本地预览生产构建**
   ```bash
   npm run build
   npm run preview
   ```

## 云端同步（Cloudflare D1）

本项目已集成 Cloudflare D1 数据库支持，实现多设备数据同步：

### 配置 D1 数据库

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **创建 D1 数据库**
   ```bash
   wrangler d1 create weight-checkin-db
   ```
   复制返回的 database_id

4. **更新 wrangler.toml**
   将 `database_id` 替换为你创建的数据库 ID

5. **初始化数据库表**
   ```bash
   wrangler d1 execute weight-checkin-db --file=schema.sql
   ```

6. **本地开发测试**
   ```bash
   wrangler pages dev
   ```

### 部署到 Cloudflare Pages

1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 连接 GitHub 仓库
3. 构建设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 绑定 D1 数据库：
   - 进入项目 Settings → Functions → D1 database bindings
   - Variable name: `DB`
   - 选择你创建的 database

### 使用云端同步

- 在设置页设置相同的 **用户ID** 可在多设备同步数据
- 数据会自动同步到云端
- 支持手动"从云端加载"和"同步到云端"

## 说明
- 本地数据保存在浏览器 `localStorage`
- 开启云端同步后数据会同时保存到 Cloudflare D1
- 换设备时只需输入相同的用户ID即可恢复数据
