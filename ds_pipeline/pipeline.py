"""
ML Pipeline for Escrow Milestone Funding Project
Predicts: 1) Project Success, 2) Milestone Risk
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
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
    
    def save_models(self, output_dir='ds_pipeline/models'):
        """Save trained models and metrics"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        for name, model in self.models.items():
            joblib.dump(model, f'{output_dir}/{name}_model.pkl')
            joblib.dump(self.scalers[name], f'{output_dir}/{name}_scaler.pkl')
        
        with open(f'{output_dir}/metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        print(f"\nModels saved to {output_dir}/")
    
    def run_pipeline(self):
        """Execute full pipeline"""
        self.load_data()
        self.engineer_features()
        self.train_project_success_model()
        self.train_milestone_risk_model()
        self.save_models()
        print("\n✓ Pipeline complete!")

if __name__ == "__main__":
    pipeline = EscrowMLPipeline()
    pipeline.run_pipeline()
