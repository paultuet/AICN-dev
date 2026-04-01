# Stage 1: Build frontend
FROM node:18 AS frontend-builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy frontend files
COPY packages/frontend/package.json packages/frontend/
COPY packages/frontend/tsconfig.json packages/frontend/tsconfig.node.json packages/frontend/vite.config.mts packages/frontend/
COPY packages/frontend/tailwind.config.js packages/frontend/index.html packages/frontend/
COPY packages/backend/resources/templates/emails-mjml packages/backend/resources/templates/emails-mjml/
RUN mkdir -p packages/backend/resources/templates/emails-html

# Install frontend dependencies
WORKDIR /app/packages/frontend
RUN pnpm install

# Copy frontend source code
COPY packages/frontend/public ./public
COPY packages/frontend/src ./src

# Update the vite config to output API URLs correctly for production
RUN sed -i 's/target: .*/target: "http:\/\/0.0.0.0:1337",/' vite.config.mts

# Build frontend
RUN pnpm build

# Compile emails
RUN pnpm compile-emails

# Stage 2: Build backend
FROM clojure:latest AS backend-builder

WORKDIR /app

# Copy backend dependencies
COPY packages/backend/deps.edn packages/backend/build.clj ./

# Resolve dependencies
RUN clojure -P

# Create resources directory and public folder for static files
RUN mkdir -p resources/public
RUN mkdir -p resources/templates/emails-html

# Copy configuration files
COPY packages/backend/resources/config.edn resources/
# COPY packages/backend/resources/config.local.edn resources/
COPY packages/backend/resources/data/ resources/data/
COPY packages/backend/resources/migrations/ resources/migrations/
# COPY packages/backend/resources/templates/emails-html/ resources/templates/emails-html/

# Copy frontend build to backend resources
COPY --from=frontend-builder /app/packages/frontend/dist/ resources/public/
COPY --from=frontend-builder /app/packages/backend/resources/templates/emails-html/ resources/templates/emails-html/

# Copy backend source code
COPY packages/backend/src/ src/
COPY packages/backend/dev/ dev/

# Build uberjar
RUN clojure -T:build ci

# Stage 3: Runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the uberjar from the backend build stage
COPY --from=backend-builder /app/target/aicn.jar ./app.jar

# Default environment variables
ENV PORT=1337

# Expose the port
EXPOSE ${PORT}

# Make sure we're listening on the correct address
CMD echo "Starting application on 0.0.0.0:${PORT}" && \
    java -Djava.awt.headless=true \
         -Djava.net.preferIPv4Stack=true \
         -Djetty.host=0.0.0.0 \
         -Djetty.http.host=0.0.0.0 \
         -Djetty.port=${PORT} \
         -Djava.rmi.server.hostname=0.0.0.0 \
         -jar app.jar
