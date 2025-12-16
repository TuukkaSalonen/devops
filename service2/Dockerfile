FROM python:3.12-slim

WORKDIR /app

COPY build/ ./build/

COPY server.py .

ENV PYTHONPATH=/app/build

EXPOSE 8081

CMD [ "python", "server.py" ]