import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from app.config import config
from app.schemas.models import ForecasterFeedbackRequest, ForecasterFeedbackRecord

class FeedbackStore:
    """
    Manages forecaster review feedback for retrospective scientific evaluation and future model auditing.
    Persists to JSON/SQLite without automatic online retraining.
    """
    
    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or config.feedback_file
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_path.exists():
            with open(self.storage_path, "w") as f:
                json.dump([], f)

    def add_feedback(self, request: ForecasterFeedbackRequest) -> ForecasterFeedbackRecord:
        record = ForecasterFeedbackRecord(
            feedback_id=f"FB-{uuid.uuid4().hex[:8].upper()}",
            prediction_id=request.prediction_id,
            forecast_id=request.forecast_id,
            region_id=request.region_id,
            lead_time_days=request.lead_time_days,
            user_name=request.user_name,
            user_role=request.user_role,
            decision=request.decision,
            decision_reason=request.decision_reason,
            observed_actual_value=request.observed_actual_value,
            notes=request.notes,
            calibrated_probability=request.calibrated_probability,
            risk_tier=request.risk_tier,
            model_version=request.model_version,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        records = self.get_all_feedback()
        records.insert(0, record)
        
        with open(self.storage_path, "w") as f:
            json.dump([r.model_dump() for r in records], f, indent=2)
            
        return record

    def get_all_feedback(self) -> List[ForecasterFeedbackRecord]:
        try:
            with open(self.storage_path, "r") as f:
                data = json.load(f)
                return [ForecasterFeedbackRecord(**item) for item in data]
        except Exception:
            return []

feedback_store = FeedbackStore()
