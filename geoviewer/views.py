
from django.views.generic.base import TemplateView

class HomePageView(TemplateView):

    template_name = "spwhome.html"

    def get_context_data(self, **kwargs):
        from django.conf import settings

    
        context = super().get_context_data(**kwargs)
        context.update(settings.GLOBAL_SETTINGS)
        return context