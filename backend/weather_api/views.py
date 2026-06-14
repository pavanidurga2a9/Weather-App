import os
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SearchHistory
from .serializers import SearchHistorySerializer
from django.conf import settings

@api_view(['GET'])
def get_weather(request, city):
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return Response({"error": "API Key not configured"}, status=500)
    
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            # Save to history
            SearchHistory.objects.create(city_name=data['name'])
            
            # Keep only last 5
            last_5_ids = list(SearchHistory.objects.order_by('-timestamp').values_list('id', flat=True)[:5])
            SearchHistory.objects.exclude(id__in=last_5_ids).delete()
            
            # Fetch 5-day forecast
            forecast_list = []
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric"
            try:
                f_response = requests.get(forecast_url)
                if f_response.status_code == 200:
                    f_data = f_response.json()
                    from datetime import datetime
                    for item in f_data.get('list', []):
                        dt_txt = item.get('dt_txt', '')
                        # Take the forecast at 12:00 PM for each day
                        if "12:00:00" in dt_txt:
                            date_str = dt_txt.split(' ')[0]
                            day_name = datetime.strptime(date_str, "%Y-%m-%d").strftime("%a")
                            forecast_list.append({
                                "day": day_name,
                                "temp": item['main']['temp'],
                                "description": item['weather'][0]['description'],
                                "icon": item['weather'][0]['icon']
                            })
            except Exception:
                pass # Fail silently and return empty list if forecast fails

            weather_data = {
                "current": {
                    "temp": data['main']['temp'],
                    "humidity": data['main']['humidity'],
                    "wind_speed": data['wind']['speed'],
                    "description": data['weather'][0]['description'],
                    "city": data['name'],
                    "icon": data['weather'][0]['icon']
                },
                "forecast": forecast_list
            }
            return Response(weather_data)
        else:
            return Response(data, status=response.status_code)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_history(request):
    history = SearchHistory.objects.all()[:5]
    serializer = SearchHistorySerializer(history, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
def delete_history_item(request, item_id):
    try:
        item = SearchHistory.objects.get(pk=item_id)
        item.delete()
        return Response({"status": "success", "message": "Search history item deleted"})
    except SearchHistory.DoesNotExist:
        return Response({"status": "error", "message": "Item not found"}, status=404)

@api_view(['DELETE'])
def clear_history(request):
    SearchHistory.objects.all().delete()
    return Response({"status": "success", "message": "Search history cleared"})

