from django.contrib.auth.models import User
from accounts.models import WalletProfile

def create_backer():
    try:
        u, created = User.objects.get_or_create(username='backer_qa_1')
        if created:
            u.set_password('Password123!')
            u.save()
            print("Created user backer_qa_1")
        else:
            print("User backer_qa_1 already exists")

        p, _ = WalletProfile.objects.get_or_create(user=u, defaults={'wallet_address': '0xBackerQA1', 'role': 'backer'})
        if not p.wallet_address:
            p.wallet_address = '0xBackerQA1'
            p.role = 'backer'
            p.save()
            print("Updated wallet profile for backer")
    except Exception as e:
        print(f"Error: {e}")

create_backer()
