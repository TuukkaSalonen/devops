FROM python:3.12-slim

WORKDIR /usr/src/service2

COPY requirements.txt .

RUN pip install -r requirements.txt

EXPOSE 8081

COPY . .

CMD [ "python", "server.py" ]