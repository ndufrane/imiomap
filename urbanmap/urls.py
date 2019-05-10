from django.urls import path, re_path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('parcels/spatial_search', views.get_parcels_light_by_geom, name='get_parcels_light_by_geom'),
    path('parcels/capakey_spatial_search', views.get_parcels_capakeys_by_geom, name='get_parcels_capakey_light_by_geom'),
    re_path('parcels/capakeys/(?P<capakeys>.*)', views.get_parcels_by_capakey, name='get_parcels_by_capakey'),
    re_path('parcelsinfo/capakeys/(?P<capakeys>.*)', views.get_parcels_infos_by_capakey, name='get_parcels_infos_by_capakey'),
    path('parcels/owner_search', views.get_parcels_by_owner, name='get_parcels_by_owner'),
    path('identify_parcel/<str:x>/<str:y>', views.identify_parcel, name='identify'),
    path('identify_owners/<str:x>/<str:y>', views.identify_owners, name='identifyo'),
]