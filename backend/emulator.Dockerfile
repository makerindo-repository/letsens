FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir paho-mqtt

COPY emulator.py .

CMD ["python3", "emulator.py"]
