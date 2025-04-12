FROM clojure:temurin-17-tools-deps-bookworm AS builder

WORKDIR /app

# Copy dependencies
COPY deps.edn .
RUN clojure -P

# Copy source code
COPY . .

# Build uberjar
RUN clojure -T:build uber

# Create runtime image
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the uberjar from builder stage
COPY --from=builder /app/target/backend-*-standalone.jar app.jar

EXPOSE 3000

# Run the application
CMD ["java", "-jar", "app.jar"]
