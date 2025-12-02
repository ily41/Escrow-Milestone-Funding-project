"""
Model Monitoring and Performance Tracking
"""
import json
import pandas as pd
from datetime import datetime
import os

class ModelMonitor:
    def __init__(self, log_file='ds_pipeline/monitoring/model_performance.jsonl'):
        self.log_file = log_file
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    def log_prediction(self, model_name, features, prediction, probability=None, actual=None):
        """Log individual predictions for monitoring"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'model': model_name,
            'prediction': int(prediction),
            'probability': float(probability) if probability is not None else None,
            'actual': int(actual) if actual is not None else None,
            'features': {k: float(v) for k, v in features.items()}
        }
        
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    
    def calculate_drift(self, baseline_file='ds_pipeline/data/projects.csv'):
        """Detect data drift by comparing current vs baseline distributions"""
        baseline = pd.read_csv(baseline_file)
        
        # Read recent predictions
        if not os.path.exists(self.log_file):
            return {"status": "No predictions logged yet"}
        
        logs = []
        with open(self.log_file, 'r') as f:
            for line in f:
                logs.append(json.loads(line))
        
        if len(logs) == 0:
            return {"status": "No predictions logged"}
        
        # Extract feature distributions
        recent_df = pd.DataFrame([log['features'] for log in logs])
        
        drift_report = {}
        for col in recent_df.columns:
            if col in baseline.columns:
                baseline_mean = baseline[col].mean()
                recent_mean = recent_df[col].mean()
                drift_pct = abs(recent_mean - baseline_mean) / baseline_mean * 100 if baseline_mean != 0 else 0
                drift_report[col] = {
                    'baseline_mean': baseline_mean,
                    'recent_mean': recent_mean,
                    'drift_percentage': drift_pct,
                    'alert': drift_pct > 20  # Alert if >20% drift
                }
        
        return drift_report
    
    def get_performance_summary(self):
        """Calculate running performance metrics"""
        if not os.path.exists(self.log_file):
            return {"status": "No predictions logged"}
        
        logs = []
        with open(self.log_file, 'r') as f:
            for line in f:
                log = json.loads(line)
                if log.get('actual') is not None:
                    logs.append(log)
        
        if len(logs) == 0:
            return {"status": "No labeled predictions for evaluation"}
        
        df = pd.DataFrame(logs)
        
        # Calculate accuracy
        accuracy = (df['prediction'] == df['actual']).mean()
        
        return {
            'total_predictions': len(logs),
            'accuracy': accuracy,
            'prediction_distribution': df['prediction'].value_counts().to_dict(),
            'last_updated': datetime.now().isoformat()
        }

# Rate limiting hook
class RateLimiter:
    def __init__(self, max_requests_per_minute=60):
        self.max_requests = max_requests_per_minute
        self.requests = []
    
    def allow_request(self):
        """Check if request is allowed under rate limit"""
        now = datetime.now()
        
        # Remove requests older than 1 minute
        self.requests = [req_time for req_time in self.requests 
                        if (now - req_time).total_seconds() < 60]
        
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        else:
            return False
    
    def get_status(self):
        """Get current rate limit status"""
        now = datetime.now()
        recent = [req for req in self.requests if (now - req).total_seconds() < 60]
        return {
            'requests_in_last_minute': len(recent),
            'limit': self.max_requests,
            'available': self.max_requests - len(recent)
        }

if __name__ == "__main__":
    # Example usage
    monitor = ModelMonitor()
    
    # Simulate logging
    monitor.log_prediction(
        model_name='project_success',
        features={'reputation_score': 7.5, 'funding_goal': 10000},
        prediction=1,
        probability=0.85,
        actual=1
    )
    
    print("Performance Summary:")
    print(json.dumps(monitor.get_performance_summary(), indent=2))
    
    print("\nRate Limiter Test:")
    limiter = RateLimiter(max_requests_per_minute=5)
    for i in range(7):
        allowed = limiter.allow_request()
        print(f"Request {i+1}: {'Allowed' if allowed else 'BLOCKED'}")
    print(limiter.get_status())
