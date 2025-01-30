# 构建阶段
FROM node:22-alpine AS builder

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 生产阶段
FROM node:22-alpine

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制必要的文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
