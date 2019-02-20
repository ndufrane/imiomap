from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.gis.geos import GEOSGeometry
from django.core.serializers import serialize
from django.db.models import Max
from django.contrib.gis.gdal import CoordTransform, SpatialReference

from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt

from django.contrib.gis.geos import Point

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

@csrf_exempt
@require_POST
def get_parcels_by_owner(request):
    surname = request.POST.get("surname", "")
    firstname = request.POST.get("firstname", "")
    address = request.POST.get("address", "")

    if surname == "" and firstname == "" and address == "":
        return HttpResponse(None, content_type='application/json')
    

    capa_qry = Capa.objects

    if surname != "":
        capa_qry = capa_qry.filter(parcelinfo__owner__owner_uid__name__icontains=surname)
    if firstname != "":
        capa_qry = capa_qry.filter(parcelinfo__owner__owner_uid__firstname__icontains=firstname)
    if address != "":
        capa_qry = capa_qry.filter(parcelinfo__owner__owner_uid__street_fr__icontains=address)

    logger.error(capa_qry.count())
  
    response_geojson = serialize('geojson', capa_qry.all()[:100],
            geometry_field='the_geom',
            srid=31370)
    
    return HttpResponse(response_geojson, content_type='application/json')

@csrf_exempt
@require_GET
def identify_parcel(request):
    geometry_json = request.GET.get("geometry")
    geometry = json.loads(geometry_json)
    pnt = Point(geometry.x, geometry.y)

    # Faire deux service : 1 identify parcel et un autre pour les proprios
    capa_qry = Capa.objects.filter(the_geom__intersects=pnt)
    capa_qry = capa_qry.values(
        'the_geom',
        'capakey',
        'rc__surfacenottaxable',
        'rc__surfacetaxable',
        'rc__surfaceverif',
        'rc__numbercadastralincome',
        'rc__charcadastralincome',
        'rc__cadastralincome',
        'rc__dateendexoneration',
        'rc__datesituation'
    )

    geos = []
    for result in capa_qry.all():
        feature = {
            "type": "Feature",
            "properties": {
                "capakey": result.pk,
                "cadastralincome": result.rc__cadastralincome,
                "datesituation": result.rc__datesituation
            },
            "geometry": result._the_geom.geojson
        }
        geos.append(feature)

    geometries = {
        'type': 'FeatureCollection',
        'features': geos,
        "crs": {"type": "name", "properties": {"name": "EPSG:31370"}}
    }

    return HttpResponse(json.dumps(geometries), content_type='application/json')