from django.urls import path
from . import views
from . import view_controller

urlpatterns = [
    path('', view_controller.index, name='index'),
    path('api/weather/<str:city>/', views.get_weather, name='get_weather'),
    path('api/history/', views.get_history, name='get_history'),
    path('api/history/<int:item_id>/', views.delete_history_item, name='delete_history_item'),
    path('api/history/clear/', views.clear_history, name='clear_history'),
]
