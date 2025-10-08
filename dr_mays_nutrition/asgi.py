import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dr_mays_nutrition.settings')

application = get_asgi_application()

# TODO: Uncomment when channels is properly configured
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# import notifications.routing

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter(
#             notifications.routing.websocket_urlpatterns
#         )
#     ),
# })
