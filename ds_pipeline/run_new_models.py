from pipeline import EscrowMLPipeline
import json

p = EscrowMLPipeline()
p.load_data()
p.engineer_features()

# Run new models
metrics = {}
metrics['clustering'] = p.train_backer_clustering()
metrics['anomaly'] = p.train_pledge_anomaly_detection()
metrics['recommender'] = p.train_project_recommender()

print("\n=== NEW METRICS ===")
print(json.dumps(metrics, indent=2))
