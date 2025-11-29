INSERT INTO CREATORS(wallet_address, name, status)
VALUES ('0xcreator...', 'Creator', 1)
ON CONFLICT DO NOTHING;

INSERT INTO BACKERS(wallet_address, name, status)
VALUES ('0xbacker...', 'Backer', 1)
ON CONFLICT DO NOTHING;
