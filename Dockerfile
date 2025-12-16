FROM alpine/java:21-jre 

WORKDIR /app

COPY build/ ./build/

COPY lib/json.jar ./lib/

RUN apk add --no-cache curl

CMD ["java", "-cp", "build:lib/json.jar", "Server"]

EXPOSE 8119