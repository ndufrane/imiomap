
from django.views.generic.base import TemplateView
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from geoviewer.proxy import proxy_view

class HomePageView(TemplateView):

    template_name = "spwhome.html"

    def get_context_data(self, **kwargs):
        from django.conf import settings
    
        context = super().get_context_data(**kwargs)
        context.update(settings.GLOBAL_SETTINGS)
        return context


@csrf_exempt
def proxy(request):
    requestpath = request.GET.urlencode(safe='/:?')
    if requestpath[-1] == '=':
        requestpath = requestpath[:-1]

    response = proxy_view(request, requestpath)
    response.__delitem__("Access-Control-Allow-Origin")

    return response

@csrf_exempt
def csv(request):
    response = HttpResponse(request.POST.get("csvFileContent"), content_type="text/csv", charset="UTF-8")
    response['Content-Disposition'] = 'attachment; filename="' +request.POST.get("csvFileName")+'"'
    return response