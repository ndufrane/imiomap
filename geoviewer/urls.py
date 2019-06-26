from django.urls import path

from geoviewer.views import HomePageView
from geoviewer.views import proxy

urlpatterns = [
    path('', HomePageView.as_view(), name='spwhome'),
    path('proxy.jsp', proxy),
]