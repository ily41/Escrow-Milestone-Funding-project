from web3 import Web3
import os

WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:8545")
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))

PROJECT_ESCROW_ADDRESS = os.getenv("PROJECT_ESCROW_ADDRESS")
PROJECT_ESCROW_ABI = []  # TODO: paste ABI

def get_contract():
    if not PROJECT_ESCROW_ADDRESS or not PROJECT_ESCROW_ABI:
        raise RuntimeError("PROJECT_ESCROW_ADDRESS or ABI not configured")
    return w3.eth.contract(address=Web3.to_checksum_address(PROJECT_ESCROW_ADDRESS), abi=PROJECT_ESCROW_ABI)

def fake_tx_hash():
    import uuid
    return "0x" + uuid.uuid4().hex
