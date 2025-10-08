import logging

logger = logging.getLogger('accounts')

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the request
        print(f"=== MIDDLEWARE REQUEST ===")
        print(f"Request: {request.method} {request.path}")
        print(f"Request data: {request.body}")
        print(f"Request headers: {dict(request.headers)}")
        
        response = self.get_response(request)
        
        # Log the response
        print(f"Response status: {response.status_code}")
        print(f"=== END MIDDLEWARE ===")
        
        return response
