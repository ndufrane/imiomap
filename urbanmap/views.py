from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.gis.geos import GEOSGeometry
from django.core.serializers import serialize
from django.db.models import Max
from django.contrib.gis.gdal import CoordTransform, SpatialReference

from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt

import logging
import json

from urbanmap.models import Parcels, Capa

logger = logging.getLogger(__name__)

def index(request):
    return HttpResponse("UrbanMap")

@csrf_exempt
@require_POST
def get_parcels_light_by_geom(request):
      """
        input :
            * geom : WKT geometry expected
        process :
            * perform spatial filter to the cadastral spatial parcel table
        output :
            * Geojson Feature collection (SRID: 31370)
      """   
      # TODO: input check and error handling
      geom_wkt = request.POST.get("geom")
      try:
            input_geometry = GEOSGeometry(geom_wkt, srid=31370)
            capa_qry = Capa.objects.filter(the_geom__intersects=input_geometry)
            
            response_geojson = serialize('geojson', capa_qry,
                  geometry_field='the_geom',
                  srid=31370
                  )

            return HttpResponse(response_geojson, content_type='application/json')
      except TypeError as e:
            logger.error(str(e))
            return HttpResponse("Error reading the geometry from geom parameter", status=500)

@csrf_exempt
@require_POST
def get_parcels_capakeys_by_geom(request):
      """
        input :
            * geom : WKT geometry expected
        process :
            * perform spatial filter to the cadastral spatial parcel table
        output :
            * 0..n capakeys
      """  
      geom_wkt = request.POST.get("geom")
      try:
            input_geometry = GEOSGeometry(geom_wkt, srid=31370)
            capa_qry = Capa.objects.filter(the_geom__intersects=input_geometry)
            response_geojson = serialize('json', capa_qry, fields=('capakey'))
            return HttpResponse(response_geojson, content_type='application/json')
      except TypeError as e:
            logger.error(str(e))
            return HttpResponse("Error reading the geometry from geom parameter", status=500)      

@csrf_exempt
@require_GET
def get_parcels_by_capakey(request, capakeys):
      """
        input :
            * 0..n capakeys separated by ,
        process :
            * search parcels by capakey in database
        output :
            * Geojson Feature collection (SRID: 31370)
      """  
      # TODO: input check and error handling
      capakeys_parsed = capakeys.split(',')

      capa_qry = Capa.objects.filter(capakey__in=capakeys_parsed)
      
      response_geojson = serialize('geojson', capa_qry,
            geometry_field='the_geom',
            srid=31370,
            fields=('capakey'))
      
      return HttpResponse(response_geojson, content_type='application/json')

@csrf_exempt
@require_GET
def get_parcels_infos_by_capakey(request, capakeys):
      """
        input :
            * 0..n capakeys separated by ,
        process :
            * search latest parcels info by capakey in database
        output :
            * Geojson Feature collection (SRID: 31370)
      """  
      # TODO: input check and error handling
      capakeys_parsed = capakeys.split(',')

      parcels_qry = Parcels.objects.filter(capakey__in=capakeys_parsed)
      parcels_qry.latest('datesituation')
      
      response_geojson = serialize('json', parcels_qry)
      
      return HttpResponse(response_geojson, content_type='application/json')