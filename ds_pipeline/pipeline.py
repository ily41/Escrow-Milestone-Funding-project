"""
ML Pipeline for Escrow Milestone Funding Project
Predicts: 1) Project Success, 2) Milestone Risk
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report, confusion_matrix, silhouette_score, mean_squared_error
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import TruncatedSVD
import joblib
import json
from datetime import datetime

class EscrowMLPipeline:
    def __init__(self, data_dir='ds_pipeline/data'):
        self.data_dir = data_dir
        self.models = {}
        self.scalers = {}
        self.metrics = {}
        
    def load_data(self):
        """Load all CSV files"""
        print("Loading data...")
        self.df_projects = pd.read_csv(f'{self.data_dir}/projects.csv', parse_dates=['deadline', 'created_at'])
        self.df_pledges = pd.read_csv(f'{self.data_dir}/pledges.csv', parse_dates=['pledged_at'])
        self.df_creators = pd.read_csv(f'{self.data_dir}/creators.csv', parse_dates=['registered_at'])
        self.df_backers = pd.read_csv(f'{self.data_dir}/backers.csv', parse_dates=['registered_at'])
        self.df_milestones = pd.read_csv(f'{self.data_dir}/milestones.csv', parse_dates=['due_date'])
        self.df_votes = pd.read_csv(f'{self.data_dir}/votes.csv', parse_dates=['voted_at'])
        print(f"Loaded {len(self.df_projects)} projects, {len(self.df_pledges)} pledges")
        
    def engineer_features(self):
        """Feature engineering for project success prediction"""
        print("Engineering features...")
        
        # Project-level features
        features = self.df_projects.copy()
        
        # Creator reputation
        features = features.merge(
            self.df_creators[['creator_id', 'reputation_score']], 
            on='creator_id', 
            how='left'
        )
        
        # Pledge statistics
        pledge_stats = self.df_pledges.groupby('project_id').agg({
            'amount': ['count', 'mean', 'std', 'sum'],
            'backer_id': 'nunique'
        }).reset_index()
        pledge_stats.columns = ['project_id', 'pledge_count', 'avg_pledge', 'std_pledge', 'total_pledged', 'unique_backers']
        features = features.merge(pledge_stats, on='project_id', how='left')
        
        # Time-based features
        features['days_to_deadline'] = (features['deadline'] - features['created_at']).dt.days
        features['funding_ratio'] = features['current_funding'] / features['funding_goal']
        
        # Milestone features
        milestone_stats = self.df_milestones.groupby('project_id').agg({
            'milestone_id': 'count',
            'funding_amount': 'mean'
        }).reset_index()
        milestone_stats.columns = ['project_id', 'milestone_count', 'avg_milestone_amount']
        features = features.merge(milestone_stats, on='project_id', how='left')
        
        # Fill NaN values
        features = features.fillna(0)
        
        # Target: Project Success (status == 2)
        features['success'] = (features['status'] == 2).astype(int)
        
        self.features_df = features
        return features
    
    def train_project_success_model(self):
        """Train model to predict project success"""
        print("\n=== Training Project Success Model ===")
        
        # Select features
        feature_cols = [
            'reputation_score', 'funding_goal', 'days_to_deadline',
            'pledge_count', 'avg_pledge', 'unique_backers', 
            'milestone_count'
        ]
        
        X = self.features_df[feature_cols]
        y = self.features_df['success']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Random Forest
        rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
        rf_model.fit(X_train_scaled, y_train)
        
        # Predictions
        y_pred = rf_model.predict(X_test_scaled)
        y_pred_proba = rf_model.predict_proba(X_test_scaled)[:, 1]
        
        # Metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'feature_importance': dict(zip(feature_cols, rf_model.feature_importances_.tolist()))
        }
        
        print(f"Accuracy: {metrics['accuracy']:.3f}")
        print(f"F1 Score: {metrics['f1_score']:.3f}")
        print(f"ROC-AUC: {metrics['roc_auc']:.3f}")
        print("\nFeature Importance:")
        for feat, imp in sorted(metrics['feature_importance'].items(), key=lambda x: x[1], reverse=True):
            print(f"  {feat}: {imp:.3f}")
        
        # Save model
        self.models['project_success'] = rf_model
        self.scalers['project_success'] = scaler
        self.metrics['project_success'] = metrics
        
        return metrics
    
    def train_milestone_risk_model(self):
        """Train model to predict milestone rejection risk"""
        print("\n=== Training Milestone Risk Model ===")
        
        # Aggregate votes per milestone
        vote_stats = self.df_votes.groupby('milestone_id').agg({
            'approval': ['mean', 'sum', 'count'],
            'vote_weight': 'sum'
        }).reset_index()
        vote_stats.columns = ['milestone_id', 'approval_rate', 'total_approvals', 'vote_count', 'total_vote_weight']
        
        # Merge with milestones
        milestone_features = self.df_milestones.merge(vote_stats, on='milestone_id', how='left')
        milestone_features = milestone_features.fillna(0)
        
        # Target: High Risk (approval_rate < 0.7)
        milestone_features['high_risk'] = (milestone_features['approval_rate'] < 0.7).astype(int)
        
        # Features - REMOVED approval_rate as it leaks the target directly
        feature_cols = ['funding_amount', 'vote_count', 'total_vote_weight']
        X = milestone_features[feature_cols]
        y = milestone_features['high_risk']
        
        if len(X) == 0 or y.sum() == 0:
            print("Not enough milestone data for training")
            return None
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train
        gb_model = GradientBoostingClassifier(n_estimators=50, max_depth=5, random_state=42)
        gb_model.fit(X_train_scaled, y_train)
        
        # Predictions
        y_pred = gb_model.predict(X_test_scaled)
        y_pred_proba = gb_model.predict_proba(X_test_scaled)[:, 1]
        
        # Metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
        
        print(f"Accuracy: {metrics['accuracy']:.3f}")
        print(f"F1 Score: {metrics['f1_score']:.3f}")
        print(f"ROC-AUC: {metrics['roc_auc']:.3f}")
        
        self.models['milestone_risk'] = gb_model
        self.scalers['milestone_risk'] = scaler
        self.metrics['milestone_risk'] = metrics
        
        return metrics
    
    def train_backer_clustering(self):
        """Segment backers using K-Means Clustering"""
        print("\n=== Training Backer Segmentation (K-Means) ===")
        
        # Aggregate backer stats
        backer_stats = self.df_pledges.groupby('backer_id').agg({
            'amount': ['sum', 'mean', 'count'],
            'project_id': 'nunique'
        }).reset_index()
        backer_stats.columns = ['backer_id', 'total_pledged', 'avg_pledge', 'pledge_count', 'unique_projects']
        
        # Features for clustering
        X = backer_stats[['total_pledged', 'avg_pledge', 'pledge_count', 'unique_projects']]
        
        # Scale
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train K-Means (3 clusters: Whales, Regulars, Casuals)
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Metrics
        score = silhouette_score(X_scaled, clusters)
        print(f"Silhouette Score: {score:.3f}")
        
        # Interpret clusters
        backer_stats['cluster'] = clusters
        print("\nCluster Centers:")
        print(backer_stats.groupby('cluster')[['total_pledged', 'pledge_count']].mean())
        
        self.models['backer_clustering'] = kmeans
        self.scalers['backer_clustering'] = scaler
        self.metrics['backer_clustering'] = {'silhouette_score': score, 'n_clusters': 3}
        
        return self.metrics['backer_clustering']

    def train_pledge_anomaly_detection(self):
        """Detect suspicious pledges using Isolation Forest"""
        print("\n=== Training Pledge Anomaly Detection (Isolation Forest) ===")
        
        # Features: Amount, and deviation from project average
        pledges = self.df_pledges.merge(
            self.df_projects[['project_id', 'funding_goal']], 
            on='project_id'
        )
        pledges['goal_ratio'] = pledges['amount'] / pledges['funding_goal']
        
        X = pledges[['amount', 'goal_ratio']]
        
        # Train Isolation Forest
        iso_forest = IsolationForest(contamination=0.05, random_state=42)
        preds = iso_forest.fit_predict(X)
        
        # Metrics
        n_anomalies = (preds == -1).sum()
        print(f"Detected {n_anomalies} anomalies out of {len(X)} pledges")
        
        self.models['pledge_anomaly'] = iso_forest
        self.metrics['pledge_anomaly'] = {'anomalies_detected': int(n_anomalies), 'total_pledges': len(X)}
        
        return self.metrics['pledge_anomaly']

    def train_project_recommender(self):
        """Recommend projects using SVD (Collaborative Filtering)"""
        print("\n=== Training Project Recommender (SVD) ===")
        
        # Create User-Item Matrix
        user_item_matrix = self.df_pledges.pivot_table(
            index='backer_id', 
            columns='project_id', 
            values='amount', 
            fill_value=0
        )
        
        # SVD
        X = user_item_matrix.values
        svd = TruncatedSVD(n_components=min(20, X.shape[1]-1), random_state=42)
        X_reduced = svd.fit_transform(X)
        X_reconstructed = svd.inverse_transform(X_reduced)
        
        # Metrics (MSE)
        mse = mean_squared_error(X, X_reconstructed)
        print(f"Reconstruction MSE: {mse:.3f}")
        
        self.models['project_recommender'] = svd
        self.metrics['project_recommender'] = {'mse': mse, 'components': svd.n_components}
        
        return self.metrics['project_recommender']

    def run_pipeline(self):
        """Execute full pipeline"""
        self.load_data()
        self.engineer_features()
        self.train_project_success_model()
        self.train_milestone_risk_model()
        self.train_backer_clustering()
        self.train_pledge_anomaly_detection()
        self.train_project_recommender()
        self.save_models()
        print("\n✓ Pipeline complete!")

if __name__ == "__main__":
    pipeline = EscrowMLPipeline()
    pipeline.run_pipeline()
