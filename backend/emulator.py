#!/usr/bin/env python3
"""
LetSens AIoT Smart Sanitation System
ESP32 Hardware Emulator & MQTT Telemetry Publisher
Universitas Komputer Indonesia (UNIKOM)

Simulasi hardware ESP32 + MQTT ke Broker EMQX / Mosquitto & REST Ingestion API.
Payload JSON yang dikirimkan 100% murni data telemetry hardware node ESP32.
Relasi ke kode bilik toilet dikelola otomatis oleh backend database berdasarkan kode_perangkat.
"""

import json
import time
import random
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Installing paho-mqtt module...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paho-mqtt"])
    import paho.mqtt.client as mqtt

# Configuration Defaults (bisa diubah sesuai preferensi hardware)
BROKER_HOST = "broker.emqx.io"
BROKER_PORT = 1883
TOPIC = "letsens/toilet/sensordata"
KODE_PERANGKAT = "ESP32-TK-01A"
INTERVAL = 15 # detik (dikirimkan setiap 15 detik)

def generate_telemetry():
    """
    Menghasilkan data sensor real-time dengan variasi fisik yang realistis:
    - Amonia (MQ-137): PPM fluktuatif (0.5 - 25.0 PPM)
    - Suhu (DHT22): 24.0°C - 32.0°C
    - Kelembaban (RH): 55.0% - 85.0%
    - PIR Okupansi: True/False berdasarkan keberadaan pengunjung
    - Cahaya (LDR): 150 - 650 Lux
    - Sinyal Wi-Fi (RSSI): -85 dBm s/d -45 dBm
    - Baterai (%): 100% perlahan berkurang
    - Sabun & Tisu (%): level sisa konsumabel
    """
    amonia_base = random.uniform(1.2, 8.5) if random.random() > 0.3 else random.uniform(12.0, 22.0)
    
    return {
        "kode_perangkat": KODE_PERANGKAT,
        "amonia": round(amonia_base, 2),
        "suhu": round(random.uniform(25.0, 31.5), 1),
        "rh": round(random.uniform(60.0, 80.0), 1),
        "PIR": random.choice([True, False]),
        "cahaya": round(random.uniform(200.0, 550.0), 1),
        "RSSI": random.randint(-75, -50),
        "Baterai": random.randint(85, 100),
        "soap_level_percent": random.randint(40, 95),
        "tissue_level_percent": random.randint(35, 90)
    }

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Connected to MQTT Broker: {BROKER_HOST}:{BROKER_PORT}")
        print(f"📡 Publishing telemetry to topic: {TOPIC}\n")
    else:
        print(f"❌ Connection failed with status code {rc}")

def run_emulator():
    client = mqtt.Client(client_id=f"Simulator-{KODE_PERANGKAT}")
    client.on_connect = on_connect

    try:
        client.connect(BROKER_HOST, BROKER_PORT, 60)
        client.loop_start()

        print("================================================================")
        print(f"🚀 ESP32 Hardware Emulator Started [{KODE_PERANGKAT}]")
        print(f"🌐 Topic Target: {TOPIC}")
        print(f"⏱️ Interval Stream: {INTERVAL} Detik")
        print("Tekan Ctrl+C untuk menghentikan simulator.")
        print("========================================================\n")

        while True:
            payload = generate_telemetry()
            json_payload = json.dumps(payload)
            client.publish(TOPIC, json_payload)
            
            print(f"[{time.strftime('%H:%M:%S')}] 📤 Telemetry Published to '{TOPIC}':")
            print(json.dumps(payload, indent=2))
            print("-" * 60)
            
            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Hardware Emulator stopped by user.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    run_emulator()
