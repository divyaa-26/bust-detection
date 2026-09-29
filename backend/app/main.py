import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.api.routes import router as api_router
from app.api.edr import edr_router

app = FastAPI(
    title=config.app_name,
    version=config.app_version,
    description=(
        "**Forecast Reliability Intelligence & Decision-Support Layer (SIH26079)**\n\n"
        "Sits above Numerical Weather Prediction (NWP) and data-driven AI forecasting systems "
        "(GFS, ECMWF/AIFS, NCUM) to answer:\n\n"
        "- **WHERE** is the forecast likely to fail?\n"
        "- **WHEN** is it likely to fail?\n"
        "- **HOW** severe could the uncertainty/error be?\n"
        "- **WHY** is the forecast being flagged?\n"
        "- **WHICH** regions deserve forecaster attention first?\n\n"
        "*MoES Sponsor: Ministry of Earth Sciences, Government of India.*"
    ),
    contact={
        "name": "SIH26079 Forecast Reliability Team",
        "email": "contact@sih26079.moes.gov.in"
    },
    license_info={
        "name": "Open Government Data License (India) / CC-BY-4.0"
    }
)

# Enable CORS for local Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(api_router)
app.include_router(edr_router)

# Mount frontend production build if available
frontend_dist = config.base_dir.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "system": config.app_name,
            "version": config.app_version,
            "sponsor": config.sponsor,
            "data_mode": config.data_mode.value,
            "docs_url": "/docs",
            "edr_url": "/edr/collections"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
