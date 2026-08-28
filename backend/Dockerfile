# ---- Build stage ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Cache the Maven wrapper and dependencies before copying sources
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Railway's builder requires an explicit cache id: s/<service id>-<target path>
RUN --mount=type=cache,id=s/7d775dee-606b-41b5-a4ab-5f8dd7183b08-/root/.m2,target=/root/.m2 ./mvnw -q -B dependency:go-offline

COPY src ./src
RUN --mount=type=cache,id=s/7d775dee-606b-41b5-a4ab-5f8dd7183b08-/root/.m2,target=/root/.m2 ./mvnw -q -B -DskipTests package

# ---- Runtime stage ----
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
