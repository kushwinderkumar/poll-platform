# ─────────────────────────────────────────────────────────────
#  Stage 1 – deps
#  Install ALL dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile


# ─────────────────────────────────────────────────────────────
#  Stage 2 – builder
#  Build the Vite/React app into static files
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars are baked into the bundle by Vite
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_SOCKET_URL=http://localhost:5000
ARG VITE_HOST_IP=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_HOST_IP=$VITE_HOST_IP

RUN npm run build


# ─────────────────────────────────────────────────────────────
#  Stage 3 – development
#  Vite dev server with HMR (used by docker-compose dev target)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ─────────────────────────────────────────────────────────────
#  Stage 4 – production
#  Serve compiled static files with Nginx (tiny, fast, secure)
# ─────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]
