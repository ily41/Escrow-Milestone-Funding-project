from web3 import Web3
import os
import json

# Try to load contract address from deployments
DEPLOYMENTS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "smartcontract", "deployments.json")
PROJECT_ESCROW_ADDRESS = os.getenv("PROJECT_ESCROW_ADDRESS")

if not PROJECT_ESCROW_ADDRESS and os.path.exists(DEPLOYMENTS_PATH):
    try:
        with open(DEPLOYMENTS_PATH, 'r') as f:
            data = json.load(f)
            PROJECT_ESCROW_ADDRESS = data["addresses"]["ProjectEscrow"]
    except:
        pass

WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:8545")
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))

def get_current_block():
    try:
        return w3.eth.block_number
    except:
        return 0

def fake_tx_hash():
    import uuid
    return "0x" + uuid.uuid4().hex

