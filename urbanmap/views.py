from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.gis.geos import GEOSGeometry
from django.core.serializers import serialize
from django.db.models import Max

from django.views.decorators.http import require_POST, require_GET

from urbanmap.models import Parcels, Capa

def index(request):
    return HttpResponse("UrbanMap")

@require_POST
def get_parcels_light_by_geom(request):
    """
        geom : WKT geometry expected
        perform spatial filter to the cadastral spatial parcel table
    """
    # TODO: input check and error handling
    geom_wkt = request.POST.get("geom", None)
    input_geometry = GEOSGeometry(geom_wkt)

    capa_qry = Capa.objects.filter(the_geom__intersects=input_geometry).select_related('parcels').aggregate(Max('datesituation'))

    response_geojson = serialize('geojson', capa_qry,
          geometry_field='the_geom',
          fields=('capakey','propertysituationid'))

    return HttpResponse(response_geojson, content_type='application/json')

@require_GET
def get_parcels_by_capakey(request, capakeys):

    # TODO: input check and error handling
    capakeys_parsed = capakeys.split(',')

    capa_qry = Capa.objects.filter(capakey__in=capakeys_parsed).select_related('parcels').aggregate(Max('datesituation'))
    
    response_geojson = serialize('geojson', capa_qry,
          geometry_field='the_geom',
          fields=('capakey','propertysituationid'))
    
    return HttpResponse(response_geojson, content_type='application/json')