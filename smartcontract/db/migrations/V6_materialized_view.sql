DROP MATERIALIZED VIEW IF EXISTS project_metrics;

CREATE MATERIALIZED VIEW project_metrics AS
SELECT 
    p.project_id,
    p.title,
    p.funding_goal,
    p.current_funding,
    COUNT(DISTINCT m.milestone_id) AS total_milestones,
    COUNT(DISTINCT pl.pledge_id)   AS total_pledges,
    COALESCE(SUM(pl.amount),0)     AS pledged_amount
FROM projects p
LEFT JOIN milestones m ON m.project_id = p.project_id
LEFT JOIN pledges   pl ON pl.project_id = p.project_id
GROUP BY p.project_id;

-- helpful index for refreshing/queries
CREATE INDEX IF NOT EXISTS ix_project_metrics_project_id ON project_metrics(project_id);
