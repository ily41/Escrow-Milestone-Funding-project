import requests
import json
import time
from eth_account import Account
import os
from web3 import Web3

# Configuration
API_URL = "http://localhost:8000/api"
AUTH_URL = "http://localhost:8000/auth"
ESCROW_ADDRESS = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570"
RPC_URL = "http://localhost:8545"

# Private keys for Hardhat local node
CREATOR_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Account 0
BACKER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"  # Account 1

w3 = Web3(Web3.HTTPProvider(RPC_URL))

def get_token(username, password):
    r = requests.post(f"{AUTH_URL}/login/", json={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()['access']
    else:
        print(f"Login failed for {username}: {r.text}")
        return None

def test_full_flow():
    print("--- Starting Full E2E Flow ---")
    
    # 0. Login
    creator_token = get_token('tester', 'password')
    if not creator_token: return
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    
    # 1. Create Project in Backend
    print("1. Creating project in backend...")
    payload = {
        "title": "E2E Test Project " + str(int(time.time())),
        "funding_goal_eth": "10",
        "deadline_timestamp": int(time.time()) + 3600
    }
    
    r = requests.post(f"{API_URL}/projects/create/", json=payload, headers=creator_headers)
    if r.status_code != 200:
        print(f"Failed to create project: {r.text}")
        return
    
    project_data = r.json()
    project_db_id = project_data['project_id']
    print(f"Project created in DB: {project_db_id}")

    # 2. Deploy Project to Blockchain
    print("2. Deploying project to blockchain...")
    with open('smartcontract/artifacts/contracts/ProjectEscrow.sol/ProjectEscrow.json') as f:
        abi = json.load(f)['abi']
    
    contract = w3.eth.contract(address=ESCROW_ADDRESS, abi=abi)
    creator_acc = Account.from_key(CREATOR_PRIVATE_KEY)
    
    goal_wei = w3.to_wei(10, 'ether')
    deadline = int(time.time()) + 3600
    
    next_id = contract.functions.nextProjectId().call()
    on_chain_id = next_id
    
    tx = contract.functions.createProject(goal_wei, deadline).build_transaction({
        'from': creator_acc.address,
        'nonce': w3.eth.get_transaction_count(creator_acc.address),
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=CREATOR_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Project deployment tx sent: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Project deployed on-chain. ID: {on_chain_id}")

    # 3. Update Backend with on_chain_id (CRITICAL: Do this BEFORE more actions)
    print("3. Updating backend with on_chain_id...")
    r = requests.patch(f"{API_URL}/projects/{project_db_id}/", json={
        "on_chain_id": on_chain_id,
        "escrow_address": ESCROW_ADDRESS
    }, headers=creator_headers)
    
    # WAIT for indexer to potentially catch up or just give the DB time to settle
    time.sleep(2)

    # 4. Add Milestone in Backend
    print("4. Adding milestone in backend...")
    milestone_title = "Milestone " + str(int(time.time()))
    milestone_payload = {
        "title": milestone_title,
        "target_amount": "5"
    }
    r = requests.post(f"{API_URL}/projects/{project_db_id}/milestones/create/", json=milestone_payload, headers=creator_headers)
    
    # Get the milestone ID
    time.sleep(1)
    r = requests.get(f"{API_URL}/projects/{project_db_id}/milestones/", headers=creator_headers)
    milestones = r.json()
    target_ms = next(m for m in milestones if m['title'] == milestone_title)
    milestone_db_id = target_ms['milestone_id']
    print(f"Milestone created in DB: {milestone_db_id}")

    # 5. Submit Milestone to Blockchain
    print("5. Submitting milestone to blockchain...")
    tx = contract.functions.submitMilestone(on_chain_id, milestone_title, w3.to_wei(5, 'ether')).build_transaction({
        'from': creator_acc.address,
        'nonce': w3.eth.get_transaction_count(creator_acc.address),
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=CREATOR_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get milestone count to know the ID
    on_mil_contract_addr = contract.functions.milestonesContract().call()
    with open('smartcontract/artifacts/contracts/Milestones.sol/Milestones.json') as f:
        m_abi = json.load(f)['abi']
    m_contract = w3.eth.contract(address=on_mil_contract_addr, abi=m_abi)
    on_chain_milestone_id = m_contract.functions.milestoneCount(on_chain_id).call() - 1
    print(f"Milestone submitted on-chain. ID: {on_chain_milestone_id}")

    # 6. Update Milestone on Chain ID in Backend
    print("6. Updating milestone in backend...")
    r = requests.patch(f"{API_URL}/milestones/{milestone_db_id}/", json={
        "on_chain_id": on_chain_milestone_id
    }, headers=creator_headers)
    
    time.sleep(2)

    # 7. Activate Milestone
    print("7. Activating milestone...")
    tx = contract.functions.activateMilestone(on_chain_id, on_chain_milestone_id).build_transaction({
        'from': creator_acc.address,
        'nonce': w3.eth.get_transaction_count(creator_acc.address),
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=CREATOR_PRIVATE_KEY)
    w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    r = requests.post(f"{API_URL}/projects/{project_db_id}/milestones/{milestone_db_id}/activate/", headers=creator_headers)
    print("Milestone activated.")
    
    time.sleep(2)

    # 8. Pledge as Backer
    print("8. Pledging as backer...")
    backer_token = get_token('backer', 'password')
    backer_headers = {"Authorization": f"Bearer {backer_token}"}
    
    # Backend record
    r = requests.post(f"{API_URL}/projects/{project_db_id}/pledge/", json={"amount": "5"}, headers=backer_headers)
    
    # On-chain pledge
    print("Pledging on-chain...")
    backer_acc = Account.from_key(BACKER_PRIVATE_KEY)
    tx = contract.functions.pledge(on_chain_id).build_transaction({
        'from': backer_acc.address,
        'nonce': w3.eth.get_transaction_count(backer_acc.address),
        'value': w3.to_wei(5, 'ether')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=BACKER_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print("Pledge completed on-chain.")

    # 9. Wait for Indexer and check results
    print("9. Waiting for indexer (10s)...")
    time.sleep(10)
    
    r = requests.get(f"{API_URL}/projects/{project_db_id}/milestones/", headers=creator_headers)
    milestones = r.json()
    target_ms = next(m for m in milestones if m['milestone_id'] == milestone_db_id)
    ms_status = target_ms['status']
    print(f"Milestone Status in Backend: {ms_status} (Expected: 2 for Voting)")
    
    if str(ms_status) == '2':
        print("SUCCESS: Automated Voting Triggered and Synced!")
    else:
        print(f"FAILURE: Milestone status is {ms_status}")
        print(f"Full milestone data: {target_ms}")

if __name__ == "__main__":
    test_full_flow()
