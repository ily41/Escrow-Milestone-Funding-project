"""
Unit tests for feature engineering
"""
import unittest
import pandas as pd
import numpy as np
import sys
sys.path.append('..')
from pipeline import EscrowMLPipeline

class TestFeatureEngineering(unittest.TestCase):
    
    def setUp(self):
        """Create sample data for testing"""
        self.pipeline = EscrowMLPipeline()
        
        # Mock data
        self.pipeline.df_projects = pd.DataFrame({
            'project_id': ['p1', 'p2'],
            'creator_id': ['c1', 'c1'],
            'funding_goal': [1000, 2000],
            'current_funding': [800, 2500],
            'deadline': pd.to_datetime(['2024-12-31', '2024-11-30']),
            'created_at': pd.to_datetime(['2024-10-01', '2024-09-01']),
            'status': [1, 2]
        })
        
        self.pipeline.df_creators = pd.DataFrame({
            'creator_id': ['c1'],
            'reputation_score': [7.5]
        })
        
        self.pipeline.df_pledges = pd.DataFrame({
            'project_id': ['p1', 'p1', 'p2'],
            'backer_id': ['b1', 'b2', 'b3'],
            'amount': [400, 400, 2500],
            'pledged_at': pd.to_datetime(['2024-10-05', '2024-10-10', '2024-09-15'])
        })
        
        self.pipeline.df_milestones = pd.DataFrame({
            'project_id': ['p1', 'p2'],
            'milestone_id': ['m1', 'm2'],
            'funding_amount': [400, 1250],
            'due_date': pd.to_datetime(['2025-01-15', '2024-12-15'])
        })
    
    def test_feature_engineering_columns(self):
        """Test that all expected features are created"""
        features = self.pipeline.engineer_features()
        
        expected_cols = [
            'reputation_score', 'pledge_count', 'avg_pledge', 
            'unique_backers', 'days_to_deadline', 'funding_ratio',
            'milestone_count', 'success'
        ]
        
        for col in expected_cols:
            self.assertIn(col, features.columns, f"Missing feature: {col}")
    
    def test_funding_ratio_calculation(self):
        """Test funding ratio is calculated correctly"""
        features = self.pipeline.engineer_features()
        
        # Project p1: 800/1000 = 0.8
        p1_ratio = features[features['project_id'] == 'p1']['funding_ratio'].values[0]
        self.assertAlmostEqual(p1_ratio, 0.8, places=2)
        
        # Project p2: 2500/2000 = 1.25
        p2_ratio = features[features['project_id'] == 'p2']['funding_ratio'].values[0]
        self.assertAlmostEqual(p2_ratio, 1.25, places=2)
    
    def test_success_label(self):
        """Test success label is correctly assigned"""
        features = self.pipeline.engineer_features()
        
        # p1 has status=1 (not successful)
        self.assertEqual(features[features['project_id'] == 'p1']['success'].values[0], 0)
        
        # p2 has status=2 (successful)
        self.assertEqual(features[features['project_id'] == 'p2']['success'].values[0], 1)
    
    def test_no_nan_values(self):
        """Test that feature engineering handles NaN values"""
        features = self.pipeline.engineer_features()
        
        # Should have no NaN values after fillna
        self.assertEqual(features.isna().sum().sum(), 0)

if __name__ == '__main__':
    unittest.main()
