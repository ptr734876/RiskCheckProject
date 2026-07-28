import requests
import json

POINTS = [
    ("Москва, улица Кржижановского, 8к1", 55.683194, 37.561895),
    ("Москва, улица Медынская, 5к1", 55.582150, 37.649520),
    ("Москва, улица Твардовского, 17к1", 55.794830, 37.396950),
    ("Москва, улица Новорязанская, 30", 55.771504, 37.667806),
    ("Санкт-Петербург, 13-я линия Васильевского острова, 30", 59.939640, 30.272093),
    ("Санкт-Петербург, улица Антонова-Овсеенко, 21", 59.909048, 30.473648),
    ("Санкт-Петербург, Константиновский проспект, 26", 59.972897, 30.267350),
    ("Санкт-Петербург, Морская набережная, 33", 59.958827, 30.218751),
    ("Екатеринбург, улица Куйбышева, 74", 56.829995, 60.633434),
    ("Екатеринбург, Заводская улица, 34", 56.833142, 60.551615),
]

for address, latitude, longitude in POINTS:
    print(f"\n{'='*60}")
    print(f"Address: {address}")
    print(f"Coordinates: {latitude}, {longitude}")
    print('-'*60)
    
    response = requests.post(
        "http://localhost:8000/parse",
        json={
            "latitude": latitude,
            "longitude": longitude
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"Error: Status code {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error detail: {error_data.get('detail', 'Unknown error')}")
        except:
            print(f"Response: {response.text}")