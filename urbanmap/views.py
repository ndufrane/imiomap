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
def identify_parcel(request, x, y):

    pnt = Point(float(x), float(y), srid=31370)

    capa_qry = Capa.objects.filter(the_geom__intersects=pnt)
    capa_qry = capa_qry.values(
        'the_geom',
        'capakey',
        'parcelinfo__rc__surfacenottaxable',
        'parcelinfo__rc__surfacetaxable',
        'parcelinfo__rc__surfaceverif',
        'parcelinfo__rc__numbercadastralincome',
        'parcelinfo__rc__charcadastralincome',
        'parcelinfo__rc__cadastralincome',
        'parcelinfo__rc__dateendexoneration',
        'parcelinfo__rc__datesituation'
    )
    geos = []
    for result in capa_qry.all():
        feature = {
            "layerId": "0",
            "layerName": "matrice cadastrale",
            "displayFieldName": "",
            "capakey": result.get("capakey"),
            "cadastralincome": result.get("parcelinfo__rc__cadastralincome"),
            "datesituation": str(result.get("parcelinfo__rc__datesituation")),
            "geometry": result.get("the_geom").json
        }
        geos.append(feature)

    infos = {
        'results': geos
    }

    return HttpResponse(json.dumps(infos), content_type='application/json')

@csrf_exempt
@require_GET
def identify_owners(request, x, y):

    pnt = Point(float(x), float(y), srid=31370)

    capa_qry = Capa.objects.filter(the_geom__intersects=pnt)
    capa_qry = capa_qry.order_by('parcelinfo__owner__order')
    capa_qry = capa_qry.values(
        'the_geom',
        'capakey',
        'parcelinfo__owner__datesituation',
        'parcelinfo__owner__order',
        'parcelinfo__owner__ownerright',
        'parcelinfo__owner__right_trad',
        'parcelinfo__owner__coowner',
        'parcelinfo__owner__owner_uid__name',
        'parcelinfo__owner__owner_uid__firstname',
        'parcelinfo__owner__owner_uid__birthdate',
        'parcelinfo__owner__partner_uid__name',
        'parcelinfo__owner__partner_uid__firstname',
        'parcelinfo__owner__partner_uid__birthdate',
    )
    geos = []
    cpt = 0

    def ifNRE(data):
        if data == None:
            return ""
        else:
            return str(data)

    for result in capa_qry.all():
        feature = {
            "layerId": str(cpt),
            "layerName": "propriétaires",
            "displayFieldName": "",
            "capakey": result.get("capakey"),
            "ownerright": ifNRE(result.get("parcelinfo__owner__ownerright", "")),
            "order": ifNRE(result.get("parcelinfo__owner__order", "")),
            "righttrad": ifNRE(result.get("parcelinfo__owner__right_trad", "")),
            "coowner": ifNRE(result.get("parcelinfo__owner__coowner", "")),
            "owner_name": ifNRE(result.get("parcelinfo__owner__owner_uid__name", "")),
            "owner_firstname": ifNRE(result.get("parcelinfo__owner__owner_uid__firstname", "")),
            "owner_birthdate": ifNRE(result.get("parcelinfo__owner__owner_uid__birthdate", "")),
            "partner_name": ifNRE(result.get("parcelinfo__owner__partner_uid__name", "")),
            "partner_firstname": ifNRE(result.get("parcelinfo__owner__partner_uid__firstname", "")),
            "partner_birthdate": ifNRE(result.get("parcelinfo__owner__partner_uid__birthdate", "")),
            "geometry": result.get("the_geom").json
        }
        geos.append(feature)
        cpt += 1

    infos = {
        'results': geos
    }

    return HttpResponse(json.dumps(infos), content_type='application/json')