
from django.views.generic.base import TemplateView
from django.views.decorators.csrf import csrf_exempt
from proxy.views import proxy_view

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
    return proxy_view(request, requestpath)