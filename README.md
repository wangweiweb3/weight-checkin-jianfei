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

## 说明
- 当前数据默认保存在浏览器 `localStorage`
- 换设备不会自动同步
- 如果后续要做云同步，建议轻量方案：Cloudflare D1 / KV 或 SQLite/Turso
