# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline || true
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine AS runtime
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY --from=build --chown=spring:spring /build/target/task-service-*.jar app.jar
RUN mkdir -p /app/tmp && chown spring:spring /app/tmp

ENV JAVA_TOOL_OPTIONS="-Djava.io.tmpdir=/app/tmp" \
    SERVER_PORT=8081

USER spring
EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
  CMD wget -qO- http://localhost:8081/api/tasks >/dev/null || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]