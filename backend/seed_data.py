"""
Seed script for Food Delivery App.
Creates: 1 admin, 3 restaurants, menu items for each, and 2 riders.
Run: python seed_data.py
"""
import requests
import time

BASE_URL = "http://localhost:8000"
SESSION = requests.Session()


def safe_post(url, retries=3, delay=1, **kwargs):
    """POST with retry logic."""
    for attempt in range(retries):
        try:
            res = SESSION.post(url, timeout=15, **kwargs)
            return res
        except (requests.ConnectionError, requests.Timeout) as e:
            if attempt < retries - 1:
                print(f"   ⏳ Connection failed, retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise e


def safe_get(url, retries=3, delay=1, **kwargs):
    """GET with retry logic."""
    for attempt in range(retries):
        try:
            res = SESSION.get(url, timeout=15, **kwargs)
            return res
        except (requests.ConnectionError, requests.Timeout) as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise e

# ── 1. Register Admin ──────────────────────────────────────────────
print("=" * 60)
print("1. Registering Admin...")
res = safe_post(f"{BASE_URL}/auth/admin/register", json={
    "username": "admin",
    "password": "admin123"
})
if res.status_code in (200, 201):
    admin_data = res.json()
    TOKEN = admin_data["access_token"]
    print(f"   ✅ Admin created: username=admin, password=admin123")
elif res.status_code == 400:
    # Admin already exists, try login
    res = safe_post(f"{BASE_URL}/auth/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    admin_data = res.json()
    TOKEN = admin_data["access_token"]
    print(f"   ℹ️  Admin already exists, logged in.")
else:
    print(f"   ❌ Failed: {res.status_code} {res.text}")
    exit(1)

HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# ── 2. Create Restaurants ──────────────────────────────────────────
print("\n2. Creating Restaurants...")

# Fetch existing restaurants to avoid duplicates
existing_res = safe_get(f"{BASE_URL}/restaurants/", headers=HEADERS)
existing_names = set()
if existing_res.status_code == 200:
    for r in existing_res.json():
        existing_names.add(r["name"].lower().strip())

restaurants_data = [
    {
        "name": "Pizza Palace",
        "address": "123 Main Street, Lahore",
        "phone": "0301-1234567",
        "commission_rate": 12.0,
    },
    {
        "name": "Biryani House",
        "address": "456 Food Court, Karachi",
        "phone": "0321-9876543",
        "commission_rate": 10.0,
    },
    {
        "name": "Burger King Express",
        "address": "789 University Road, Islamabad",
        "phone": "0333-5556677",
        "commission_rate": 15.0,
    },
]

restaurant_ids = []
for r in restaurants_data:
    if r["name"].lower().strip() in existing_names:
        # Already exists — fetch its id
        for er in existing_res.json():
            if er["name"].lower().strip() == r["name"].lower().strip():
                restaurant_ids.append(er["id"])
                print(f"   ⏭️  {r['name']} already exists, skipping.")
                break
        continue
    res = safe_post(f"{BASE_URL}/restaurants/", json=r, headers=HEADERS)
    time.sleep(0.3)
    if res.status_code in (200, 201):
        rid = res.json()["id"]
        restaurant_ids.append(rid)
        print(f"   ✅ {r['name']} (id: {rid})")
    else:
        print(f"   ❌ {r['name']}: {res.status_code} {res.text}")
        restaurant_ids.append(None)

# ── 3. Create Menu Items ──────────────────────────────────────────
print("\n3. Creating Menu Items...")

menu_items = {
    0: [  # Pizza Palace
        {"name": "Margherita Pizza", "description": "Classic tomato sauce, mozzarella, fresh basil", "price": 850, "category": "Pizza"},
        {"name": "Pepperoni Pizza", "description": "Loaded with pepperoni and cheese", "price": 950, "category": "Pizza"},
        {"name": "BBQ Chicken Pizza", "description": "BBQ sauce, grilled chicken, onions, cheese", "price": 1100, "category": "Pizza"},
        {"name": "Garlic Bread", "description": "Crispy garlic bread with herbs", "price": 350, "category": "Sides"},
        {"name": "Caesar Salad", "description": "Romaine lettuce, croutons, parmesan", "price": 450, "category": "Salads"},
        {"name": "Pasta Alfredo", "description": "Creamy white sauce pasta with mushrooms", "price": 750, "category": "Pasta"},
        {"name": "Coca Cola 500ml", "description": "Chilled soft drink", "price": 150, "category": "Drinks"},
        {"name": "Chocolate Lava Cake", "description": "Warm chocolate cake with molten center", "price": 500, "category": "Desserts"},
    ],
    1: [  # Biryani House
        {"name": "Chicken Biryani", "description": "Aromatic basmati rice with tender chicken", "price": 550, "category": "Biryani"},
        {"name": "Mutton Biryani", "description": "Premium mutton with special spices", "price": 750, "category": "Biryani"},
        {"name": "Beef Nihari", "description": "Slow-cooked beef in rich spicy gravy", "price": 650, "category": "Curry"},
        {"name": "Chicken Karahi", "description": "Stir-fried chicken with tomatoes and spices", "price": 800, "category": "Curry"},
        {"name": "Dal Makhani", "description": "Creamy black lentils cooked overnight", "price": 400, "category": "Curry"},
        {"name": "Naan (2 pcs)", "description": "Fresh tandoori naan bread", "price": 100, "category": "Bread"},
        {"name": "Raita", "description": "Yogurt with cucumber and mint", "price": 120, "category": "Sides"},
        {"name": "Kheer", "description": "Traditional rice pudding with cardamom", "price": 250, "category": "Desserts"},
        {"name": "Lassi", "description": "Sweet yogurt drink", "price": 180, "category": "Drinks"},
    ],
    2: [  # Burger King Express
        {"name": "Classic Beef Burger", "description": "Juicy beef patty, lettuce, tomato, cheese", "price": 550, "category": "Burgers"},
        {"name": "Chicken Zinger", "description": "Crispy fried chicken fillet with mayo", "price": 500, "category": "Burgers"},
        {"name": "Double Cheese Burger", "description": "Two patties, double cheese, special sauce", "price": 750, "category": "Burgers"},
        {"name": "Loaded Fries", "description": "Fries with cheese sauce and jalapeños", "price": 350, "category": "Sides"},
        {"name": "Chicken Nuggets (8 pcs)", "description": "Crispy chicken nuggets with dip", "price": 400, "category": "Sides"},
        {"name": "Chicken Wrap", "description": "Grilled chicken in tortilla with veggies", "price": 450, "category": "Wraps"},
        {"name": "Oreo Milkshake", "description": "Creamy Oreo cookie milkshake", "price": 350, "category": "Drinks"},
        {"name": "Brownie Sundae", "description": "Warm brownie with vanilla ice cream", "price": 400, "category": "Desserts"},
    ],
}

for idx, items in menu_items.items():
    rid = restaurant_ids[idx]
    if not rid:
        print(f"   ⚠️  Skipping menu for restaurant index {idx} (not created)")
        continue
    rname = restaurants_data[idx]["name"]
    for item in items:
        form_data = {
            "restaurant_id": rid,
            "name": item["name"],
            "description": item["description"],
            "price": str(item["price"]),
            "category": item["category"],
        }
        res = safe_post(f"{BASE_URL}/menu/", data=form_data, headers=HEADERS)
        time.sleep(0.3)
        if res.status_code in (200, 201):
            print(f"   ✅ [{rname}] {item['name']} - Rs.{item['price']}")
        else:
            print(f"   ❌ [{rname}] {item['name']}: {res.status_code} {res.text}")

# ── 4. Create Riders ──────────────────────────────────────────────
print("\n4. Creating Riders...")

riders_data = [
    {"name": "Ali Khan", "phone": "0300-1112233", "password": "rider123"},
    {"name": "Ahmed Raza", "phone": "0311-4445566", "password": "rider123"},
]

rider_ids = []
for rider in riders_data:
    res = safe_post(f"{BASE_URL}/riders/", json=rider, headers=HEADERS)
    time.sleep(0.3)
    if res.status_code in (200, 201):
        rid = res.json()["id"]
        rider_ids.append(rid)
        print(f"   ✅ {rider['name']} (phone: {rider['phone']}, password: {rider['password']})")
    else:
        print(f"   ❌ {rider['name']}: {res.status_code} {res.text}")
        rider_ids.append(None)

# ── 5. Summary ────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SEED DATA COMPLETE!")
print("=" * 60)
print(f"""
LOGIN CREDENTIALS:
─────────────────────────────────
ADMIN:
  Username: admin
  Password: admin123

RIDERS:
  Rider 1: Ali Khan
    Phone:    0300-1112233
    Password: rider123

  Rider 2: Ahmed Raza
    Phone:    0311-4445566
    Password: rider123
─────────────────────────────────

RESTAURANTS:
  1. Pizza Palace     - 8 menu items
  2. Biryani House    - 9 menu items
  3. Burger King Express - 8 menu items

Open http://localhost:3000 to browse!
""")
