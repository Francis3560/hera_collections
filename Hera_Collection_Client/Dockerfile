# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
# We pass build args for environment variables that Vite needs at build time
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_GOOGLE_CLIENT_ID=22795732656-36ee1vmrg2pdmuimiil8netufbav85op.apps.googleusercontent.com

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy build files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed for SPA routing
# Create a simple config on the fly
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
