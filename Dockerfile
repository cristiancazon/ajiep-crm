# Stage 1: Build the React application
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Set building arguments
ARG VITE_DIRECTUS_URL=https://xer.pascalito.com.ar
ENV VITE_DIRECTUS_URL=$VITE_DIRECTUS_URL

# Build the app
RUN npm run build

# Stage 2: Serve the build with Nginx
FROM nginx:stable-alpine

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx-container.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
