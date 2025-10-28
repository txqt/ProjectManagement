# -------------------
# Build stage
# -------------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies (including devDependencies)
RUN npm install -g pnpm@latest && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
RUN pnpm run build

# -------------------
# Production stage with Nginx
# -------------------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy optimized nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]