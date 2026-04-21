from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.restaurant_routes import router as restaurant_router
from app.routes.menu_routes import router as menu_router
from app.routes.order_routes import router as order_router
from app.routes.rider_routes import router as rider_router
from app.routes.payment_routes import router as payment_router
from app.routes.dashboard_routes import router as dashboard_router
import time

app = FastAPI(
    title="Food Delivery App API",
    description="Backend API for the Food Delivery Application",
    version="1.0.0",
)

# CORS – allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with timing."""
    start = time.time()
    method = request.method
    path = request.url.path
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    status_emoji = "✅" if response.status_code < 400 else "⚠️" if response.status_code < 500 else "❌"
    print(f"{status_emoji} {method} {path} - {response.status_code} ({duration:.0f}ms)")
    return response


# Register routers
app.include_router(auth_router)
app.include_router(restaurant_router)
app.include_router(menu_router)
app.include_router(order_router)
app.include_router(rider_router)
app.include_router(payment_router)
app.include_router(dashboard_router)



@app.get("/")
async def root():
    return {"message": "Food Delivery App API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
