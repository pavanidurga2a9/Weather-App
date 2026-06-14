import os
import requests
from dotenv import load_dotenv

print("--- DEBUGGING API KEY ---")
# Force reload from .env in current directory
load_dotenv(override=True)

api_key = os.getenv('OPENWEATHER_API_KEY')
print(f"API Key loaded? : {'YES' if api_key else 'NO'}")

if api_key:
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "****"
    print(f"Key value       : {masked_key}")
    
    city = "London"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    
    print(f"Testing URL     : https://api.openweathermap.org/data/2.5/weather?q={city}&appid=HIDDEN&units=metric")
    
    try:
        res = requests.get(url)
        print(f"HTTP Status     : {res.status_code}")
        print(f"Response Body   : {res.text}")
    except Exception as e:
        print(f"Request Failed  : {e}")
else:
    print("ERROR: variable OPENWEATHER_API_KEY is not set in .env")
