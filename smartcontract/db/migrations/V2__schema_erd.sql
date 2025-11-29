CREATE TABLE CREATORS (
    creator_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address    TEXT UNIQUE NOT NULL,
    name              TEXT,
    email             TEXT UNIQUE,
    reputation_score  NUMERIC(38,18),
    registered_at     TIMESTAMPTZ DEFAULT NOW(),
    status            INT NOT NULL DEFAULT 1
);

CREATE TABLE BACKERS (
    backer_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address    TEXT UNIQUE NOT NULL,
    name              TEXT,
    email             TEXT UNIQUE,
    total_pledged     NUMERIC(38,18) DEFAULT 0,
    registered_at     TIMESTAMPTZ DEFAULT NOW(),
    status            INT NOT NULL DEFAULT 1
);

CREATE TABLE PROJECTS (
    project_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id        UUID NOT NULL REFERENCES CREATORS(creator_id),
    escrow_address    TEXT UNIQUE NOT NULL,
    title             TEXT,
    description       TEXT,
    funding_goal      NUMERIC(38,18) NOT NULL,
    current_funding   NUMERIC(38,18) NOT NULL DEFAULT 0,
    deadline          TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    status            INT NOT NULL DEFAULT 1
);

CREATE TABLE PLEDGES (
    pledge_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id        UUID NOT NULL REFERENCES PROJECTS(project_id),
    backer_id         UUID NOT NULL REFERENCES BACKERS(backer_id),
    amount            NUMERIC(38,18) NOT NULL,
    pledged_at        TIMESTAMPTZ DEFAULT NOW(),
    status            INT NOT NULL DEFAULT 1,
    voting_power      NUMERIC(38,18) DEFAULT 0
);

CREATE TABLE MILESTONES (
    milestone_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id        UUID NOT NULL REFERENCES PROJECTS(project_id),
    title             TEXT,
    description       TEXT,
    funding_amount    NUMERIC(38,18) NOT NULL,
    due_date          TIMESTAMPTZ,
    submitted_at      TIMESTAMPTZ,
    status            INT NOT NULL DEFAULT 0,
    voting_session_id TEXT
);

CREATE TABLE VOTES (
    vote_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id      UUID NOT NULL REFERENCES MILESTONES(milestone_id),
    backer_id         UUID NOT NULL REFERENCES BACKERS(backer_id),
    vote_weight       NUMERIC(38,18) NOT NULL,
    approval          INT NOT NULL,
    voted_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE RELEASES (
    release_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id      UUID NOT NULL REFERENCES MILESTONES(milestone_id),
    amount            NUMERIC(38,18) NOT NULL,
    released_at       TIMESTAMPTZ DEFAULT NOW(),
    transaction_hash  TEXT,
    status            INT NOT NULL DEFAULT 1
);

CREATE TABLE REFUNDS (
    refund_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id        UUID NOT NULL REFERENCES PROJECTS(project_id),
    backer_id         UUID NOT NULL REFERENCES BACKERS(backer_id),
    amount            NUMERIC(38,18) NOT NULL,
    requested_at      TIMESTAMPTZ DEFAULT NOW(),
    processed_at      TIMESTAMPTZ,
    status            INT NOT NULL DEFAULT 1
);

CREATE TABLE AUDIT_LOGS (
    log_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type       TEXT,
    user_id           UUID,
    user_type         INT,
    entity_type       INT,
    entity_id         UUID,
    contract_address  TEXT,
    function_name     TEXT,
    parameters        TEXT,
    transaction_hash  TEXT,
    gas_used          NUMERIC(38,18),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    success           INT DEFAULT 1,
    error_message     TEXT
);

CREATE TABLE SYSTEM_METRICS (
    metric_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name       TEXT,
    metric_value      NUMERIC(38,18),
    recorded_at       TIMESTAMPTZ DEFAULT NOW(),
    project_id        UUID REFERENCES PROJECTS(project_id),
    milestone_id      UUID REFERENCES MILESTONES(milestone_id),
    metric_type       TEXT,
    dimension_1       TEXT,
    dimension_2       TEXT
);
