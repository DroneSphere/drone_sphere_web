FROM node:22-alpine AS base

# 构建阶段
FROM base AS builder

# 添加元数据标签
LABEL org.opencontainers.image.source="https://github.com/dronesphere/drone_sphere_web"
LABEL org.opencontainers.image.description="DroneSphere Web Application"
LABEL org.opencontainers.image.licenses="MIT"

# 获取git commit id
ARG GIT_COMMIT=unspecified
LABEL org.opencontainers.image.revision=$GIT_COMMIT

# 安装pnpm并设置工作目录
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    mkdir -p /app
WORKDIR /app

# 复制依赖文件并安装
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源代码并构建
COPY . .
RUN pnpm build && \
    pnpm cache clean && \
    rm -rf node_modules

# 生产阶段
FROM base

RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 仅复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next

# 复制.lock
COPY --from=builder /app/pnpm-lock.yaml ./

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile && \
    pnpm cache clean

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
