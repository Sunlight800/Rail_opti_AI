"""FastAPI application factory for RAILOPT AI."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from rail_opti.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event to initialize database tables and seed data."""
    from rail_opti.database.init_db import init_db
    init_db()
    yield


def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )


    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"https://.*rail-opt.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    from rail_opti.api.routes.auth import router as auth_router
    from rail_opti.api.routes.dashboard import router as dashboard_router
    from rail_opti.api.routes.data_integration import router as data_integration_router
    from rail_opti.api.routes.maintenance import router as maintenance_router
    from rail_opti.api.routes.assets import router as assets_router
    from rail_opti.api.routes.departments import router as departments_router
    from rail_opti.api.routes.risk import router as risk_router
    from rail_opti.api.routes.priority import router as priority_router
    from rail_opti.api.routes.resources import router as resources_router
    from rail_opti.api.routes.operations import router as operations_router
    from rail_opti.api.routes.conflicts import router as conflicts_router
    from rail_opti.api.routes.optimizer import router as optimizer_router
    from rail_opti.api.routes.blocks import router as blocks_router
    from rail_opti.api.routes.consolidation import router as consolidation_router
    from rail_opti.api.routes.what_if import router as what_if_router
    from rail_opti.api.routes.approval import router as approval_router
    from rail_opti.api.routes.plan_versions import router as plan_versions_router
    from rail_opti.api.routes.analytics import router as analytics_router
    from rail_opti.api.routes.reports import router as reports_router
    from rail_opti.api.routes.audit import router as audit_router

    app.include_router(auth_router, prefix=settings.API_V1_STR)
    app.include_router(dashboard_router, prefix=settings.API_V1_STR)
    app.include_router(data_integration_router, prefix=settings.API_V1_STR)
    app.include_router(maintenance_router, prefix=settings.API_V1_STR)
    app.include_router(assets_router, prefix=settings.API_V1_STR)
    app.include_router(departments_router, prefix=settings.API_V1_STR)
    app.include_router(risk_router, prefix=settings.API_V1_STR)
    app.include_router(priority_router, prefix=settings.API_V1_STR)
    app.include_router(resources_router, prefix=settings.API_V1_STR)
    app.include_router(operations_router, prefix=settings.API_V1_STR)
    app.include_router(conflicts_router, prefix=settings.API_V1_STR)
    app.include_router(optimizer_router, prefix=settings.API_V1_STR)
    app.include_router(blocks_router, prefix=settings.API_V1_STR)
    app.include_router(consolidation_router, prefix=settings.API_V1_STR)
    app.include_router(what_if_router, prefix=settings.API_V1_STR)
    app.include_router(approval_router, prefix=settings.API_V1_STR)
    app.include_router(plan_versions_router, prefix=settings.API_V1_STR)
    app.include_router(analytics_router, prefix=settings.API_V1_STR)
    app.include_router(reports_router, prefix=settings.API_V1_STR)
    app.include_router(audit_router, prefix=settings.API_V1_STR)

    # Root health check endpoint
    @app.get("/health", tags=["Health"])
    def health_check():




        return {
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "demo_mode": settings.DEMO_MODE,
            "disclaimer": settings.DEMO_DATA_DISCLAIMER,
        }

    return app


app = create_app()
