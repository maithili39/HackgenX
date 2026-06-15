# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Using legacy peer deps due to some react map dependencies
RUN npm ci --legacy-peer-deps

COPY . .

# Pass in env variables at build time if needed
ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_SOCKET_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Serve Stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
