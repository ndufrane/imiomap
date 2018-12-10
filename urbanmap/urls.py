from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('parcels/spatial_search', views.get_parcels_light_by_geom, name='get_parcels_light_by_geom'),
    re_path('parcels/capakeys/(?P<capakeys>.*)', views.get_parcels_by_capakey, name='get_parcels_by_capakey'),
]