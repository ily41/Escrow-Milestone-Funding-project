# Data Science Pipeline - Escrow Milestone Funding

## Overview
This directory contains the complete ML pipeline for predicting project success and milestone risk in the Escrow Milestone Funding platform.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate Synthetic Data
```bash
python data_generator.py
```
This creates 1000+ rows of data in `data/` directory:
- `creators.csv` (50 rows)
- `backers.csv` (500 rows)
- `projects.csv` (200 rows)
- `pledges.csv` (1000+ rows)
- `milestones.csv` (600-1000 rows)
- `votes.csv` (3000+ rows)

### 3. Train Models
```bash
python pipeline.py
```
Outputs:
- Trained models in `models/`
- Performance metrics in `models/metrics.json`

### 4. Run Tests
```bash
python -m unittest tests/test_features.py
```

### 5. Monitor Performance
```bash
python monitoring.py
```

## Project Structure
```
ds_pipeline/
├── data_generator.py      # Synthetic data generation
├── pipeline.py            # ML pipeline (feature eng + training)
├── monitoring.py          # Model monitoring & rate limiting
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── data/                 # Generated CSV files
│   ├── creators.csv
│   ├── backers.csv
│   ├── projects.csv
│   ├── pledges.csv
│   ├── milestones.csv
│   └── votes.csv
├── models/               # Trained models (created after running pipeline)
│   ├── project_success_model.pkl
│   ├── project_success_scaler.pkl
│   ├── milestone_risk_model.pkl
│   ├── milestone_risk_scaler.pkl
│   └── metrics.json
├── tests/
│   └── test_features.py  # Unit tests
└── monitoring/           # Monitoring logs (created at runtime)
    └── model_performance.jsonl
```

## Models

### Model 1: Project Success Prediction
- **Algorithm**: Random Forest Classifier
- **Features**: reputation_score, funding_goal, pledge_count, unique_backers, funding_ratio, etc.
- **Target**: Binary (0=Failed, 1=Successful)
- **Expected Accuracy**: ~85-92%

### Model 2: Milestone Risk Assessment
- **Algorithm**: Gradient Boosting Classifier
- **Features**: funding_amount, vote_count, approval_rate
- **Target**: Binary (0=Low Risk, 1=High Risk)
- **Expected Accuracy**: ~78-85%

## Key Features

### Feature Engineering
- **Creator Reputation**: Historical performance score
- **Funding Velocity**: Pledges per day
- **Backer Diversity**: Unique backers count
- **Funding Ratio**: current_funding / funding_goal
- **Vote Sentiment**: Approval rate from backers

### Monitoring
- **Data Drift Detection**: Alerts when feature distributions shift >20%
- **Performance Tracking**: Logs predictions vs actuals
- **Rate Limiting**: Max 60 predictions/minute

## Business Impact

### A/B Testing Framework
- Test hypothesis: ML-highlighted projects increase conversion by 15%
- Metrics: Pledge conversion rate, average pledge amount

### Multi-Armed Bandit
- Optimize milestone funding release strategies
- Algorithm: Thompson Sampling with ε-greedy exploration

## Deliverables Checklist

- ✅ **DS Notebook/Report**: `modeling_report.md` (comprehensive 6-page report)
- ✅ **Code Artifacts**:
  - ✅ `pipeline.py` - Feature engineering + model training
  - ✅ `tests/test_features.py` - Unit tests
  - ✅ `monitoring.py` - Monitoring + rate limiting
- ✅ **Baseline Data**: Generated in `data/` directory
- ✅ **Documentation**: This README

## Next Steps

1. **Run the pipeline**: Follow Quick Start steps 1-3
2. **Review metrics**: Check `models/metrics.json` for performance
3. **Iterate**: Adjust hyperparameters in `pipeline.py` if needed
4. **Deploy**: Integrate models into production API

## Troubleshooting

**Issue**: `ModuleNotFoundError`
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: No data files found
- **Solution**: Run `python data_generator.py` first

**Issue**: Low model accuracy
- **Solution**: Synthetic data may need tuning. Adjust distributions in `data_generator.py`

## Contact
For questions or issues, contact the Data Science team.
