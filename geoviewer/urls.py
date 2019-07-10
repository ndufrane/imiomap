from django.urls import path

from geoviewer.views import HomePageView
from geoviewer.views import proxy
from geoviewer.views import csv

urlpatterns = [
    path('', HomePageView.as_view(), name='spwhome'),
    path('proxy.jsp', proxy),
    path('csv', csv),
]