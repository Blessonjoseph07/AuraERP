# Stage 1: Build React Application
FROM node:18-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve compiled HTML/JS/CSS assets via Nginx
FROM nginx:alpine

# Remove default server config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom reverse proxy config and static assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
