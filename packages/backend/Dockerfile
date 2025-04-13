FROM clojure:latest AS build

WORKDIR /app

# Copy dependencies first for better caching
COPY deps.edn build.clj ./
RUN clojure -P

# Copy source code
COPY src/ src/
COPY resources/ resources/
COPY dev/ dev/

# Build uberjar
RUN clojure -T:build ci

# Create runtime image
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the uberjar from the build stage
COPY --from=build /app/target/aicn.jar ./app.jar

# Define environment variables with default values
ENV PORT=1337 \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_NAME=aicn_db \
    SSL_MODE=disable \
    VIRTUAL_HOST=api.example.com \
    VIRTUAL_PORT=1337 \
    LETSENCRYPT_HOST=api.example.com

# Expose the port
EXPOSE ${PORT}

# Start the application
CMD ["java", "-jar", "app.jar"]
