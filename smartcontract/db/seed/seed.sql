INSERT INTO creators (wallet_address, name, email) VALUES
('0xcreator_demo', 'Demo Creator', 'creator@example.com')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO backers (wallet_address, name, email) VALUES
('0xbacker_demo', 'Demo Backer', 'backer@example.com')
ON CONFLICT (wallet_address) DO NOTHING;
