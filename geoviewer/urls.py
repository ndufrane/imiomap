from django.urls import path

from geoviewer.views import HomePageView

urlpatterns = [
    path('', HomePageView.as_view(), name='spwhome'),
]