"""
Direct SQLite migration script for 009_master_catalogue.
Applies master_categories, master_products, farmer_inventory tables
and seeds 120 master products — without going through Alembic (for offline use).
"""

import sqlite3
from datetime import datetime

DB_PATH = "auxin.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check existing tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Existing tables:", tables)

# ── 1. master_categories ─────────────────────────────────────────────────────
if "master_categories" not in tables:
    cur.execute("""
        CREATE TABLE master_categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            parent_id INTEGER REFERENCES master_categories(id) ON DELETE SET NULL,
            icon_emoji TEXT,
            image_url TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    cur.execute("CREATE INDEX ix_master_categories_slug ON master_categories(slug)")
    cur.execute("CREATE INDEX ix_master_categories_parent ON master_categories(parent_id, is_active)")
    print("Created master_categories")
else:
    print("master_categories already exists")

# ── 2. master_products ────────────────────────────────────────────────────────
if "master_products" not in tables:
    cur.execute("""
        CREATE TABLE master_products (
            id INTEGER PRIMARY KEY,
            category_id INTEGER NOT NULL REFERENCES master_categories(id) ON DELETE RESTRICT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            default_unit TEXT NOT NULL DEFAULT 'kg',
            image_url TEXT,
            tags TEXT,
            storage_info TEXT,
            shelf_life_days INTEGER,
            is_seasonal INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    cur.execute("CREATE INDEX ix_master_products_category ON master_products(category_id, is_active)")
    cur.execute("CREATE UNIQUE INDEX ix_master_products_slug ON master_products(slug)")
    cur.execute("CREATE INDEX ix_master_products_display_order ON master_products(display_order, is_active)")
    print("Created master_products")
else:
    print("master_products already exists")

# ── 3. farmer_inventory ───────────────────────────────────────────────────────
if "farmer_inventory" not in tables:
    cur.execute("""
        CREATE TABLE farmer_inventory (
            id INTEGER PRIMARY KEY,
            master_product_id INTEGER NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
            farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
            price REAL NOT NULL CHECK (price > 0),
            quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
            unit TEXT NOT NULL DEFAULT 'kg',
            is_organic INTEGER NOT NULL DEFAULT 0,
            harvest_date TEXT NOT NULL,
            notes TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            is_demo INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (master_product_id, farmer_id)
        )
    """)
    cur.execute("CREATE INDEX ix_inventory_master_product ON farmer_inventory(master_product_id, is_active)")
    cur.execute("CREATE INDEX ix_inventory_farmer ON farmer_inventory(farmer_id, is_active)")
    print("Created farmer_inventory")
else:
    print("farmer_inventory already exists")

# ── 4. Extend order_items ────────────────────────────────────────────────────
cur.execute("PRAGMA table_info(order_items)")
cols = [row[1] for row in cur.fetchall()]
if "inventory_id" not in cols:
    cur.execute("ALTER TABLE order_items ADD COLUMN inventory_id INTEGER REFERENCES farmer_inventory(id)")
    print("Added order_items.inventory_id")
if "master_product_id" not in cols:
    cur.execute("ALTER TABLE order_items ADD COLUMN master_product_id INTEGER REFERENCES master_products(id)")
    print("Added order_items.master_product_id")

# ── 5. Seed master_categories ─────────────────────────────────────────────────
now = datetime.utcnow().isoformat()

root_cats = [
    (1,  "Vegetables",       "vegetables",      None, "🥦", 1),
    (2,  "Fruits",           "fruits",          None, "🍎", 2),
    (3,  "Grains & Pulses",  "grains-pulses",   None, "🌾", 3),
    (4,  "Dairy & Eggs",     "dairy-eggs",      None, "🥛", 4),
    (5,  "Herbs & Spices",   "herbs-spices",    None, "🌿", 5),
    (6,  "Natural Products", "natural-products", None, "🍯", 6),
]
sub_cats = [
    (10, "Leafy Greens",    "leafy-greens",    1, "🥬", 1),
    (11, "Root Vegetables", "root-vegetables", 1, "🥕", 2),
    (12, "Gourds",          "gourds",          1, "🥒", 3),
    (13, "Beans & Pods",    "beans-pods",      1, "🫘", 4),
    (14, "Tropical Fruits", "tropical-fruits", 2, "🥭", 1),
    (15, "Citrus Fruits",   "citrus-fruits",   2, "🍊", 2),
    (16, "Stone Fruits",    "stone-fruits",    2, "🍑", 3),
    (17, "Rice Varieties",  "rice-varieties",  3, "🍚", 1),
    (18, "Wheat & Flour",   "wheat-flour-cat", 3, "🌾", 2),
    (19, "Millets",         "millets",         3, "🌱", 3),
    (20, "Lentils & Dals",  "lentils-dals",    3, "🫘", 4),
    (21, "Milk Products",   "milk-products",   4, "🥛", 1),
    (22, "Fresh Herbs",     "fresh-herbs",     5, "🌿", 1),
    (23, "Dry Spices",      "dry-spices",      5, "🧄", 2),
]

for row in root_cats + sub_cats:
    cur.execute(
        "INSERT OR IGNORE INTO master_categories (id, name, slug, parent_id, icon_emoji, display_order, is_active, created_at) VALUES (?,?,?,?,?,?,1,?)",
        (row[0], row[1], row[2], row[3], row[4], row[5], now)
    )

conn.commit()
print(f"Seeded {len(root_cats) + len(sub_cats)} categories")

# ── 6. Seed master_products ───────────────────────────────────────────────────
products = [
    # Leafy Greens (10)
    (1,  10, "Spinach",              "spinach",            "Fresh tender spinach, rich in iron",              "bunch", 5,  0, 1),
    (2,  10, "Fenugreek Leaves",     "fenugreek-leaves",   "Fresh methi leaves, aromatic",                   "bunch", 4,  0, 2),
    (3,  10, "Coriander",            "coriander",          "Fresh coriander leaves with stems",               "bunch", 5,  0, 3),
    (4,  10, "Mint Leaves",          "mint-leaves",        "Fresh pudina leaves, crisp and aromatic",         "bunch", 5,  0, 4),
    (5,  10, "Curry Leaves",         "curry-leaves",       "Fresh kadi patta for South Indian cooking",       "bunch", 7,  0, 5),
    (6,  10, "Drumstick Leaves",     "drumstick-leaves",   "Moringa leaves, packed with nutrients",           "bunch", 4,  0, 6),
    # Root Vegetables (11)
    (7,  11, "Tomato",               "tomato",             "Fresh red tomatoes, firm and juicy",              "kg",    7,  0, 1),
    (8,  11, "Onion",                "onion",              "Fresh red onions, pungent and flavorful",         "kg",    30, 0, 2),
    (9,  11, "Potato",               "potato",             "Fresh potatoes, ideal for all cooking",           "kg",    21, 0, 3),
    (10, 11, "Carrot",               "carrot",             "Fresh orange carrots, sweet and crunchy",         "kg",    14, 0, 4),
    (11, 11, "Beetroot",             "beetroot",           "Fresh beets, rich in antioxidants",               "kg",    14, 0, 5),
    (12, 11, "Radish",               "radish",             "Fresh white radish (mooli), crisp and peppery",   "kg",    7,  0, 6),
    (13, 11, "Ginger",               "ginger",             "Fresh ginger root, pungent and spicy",            "kg",    21, 0, 7),
    (14, 11, "Garlic",               "garlic",             "Fresh garlic bulbs, aromatic",                    "kg",    30, 0, 8),
    (15, 11, "Turmeric",             "turmeric",           "Fresh turmeric root, vivid yellow",               "kg",    30, 0, 9),
    # Gourds (12)
    (16, 12, "Bottle Gourd",         "bottle-gourd",       "Fresh lauki, light and easy to digest",           "piece", 7,  0, 1),
    (17, 12, "Bitter Gourd",         "bitter-gourd",       "Fresh karela, traditional medicinal vegetable",   "kg",    5,  0, 2),
    (18, 12, "Ridge Gourd",          "ridge-gourd",        "Fresh turai, tender and mild flavoured",          "kg",    5,  0, 3),
    (19, 12, "Snake Gourd",          "snake-gourd",        "Fresh padwal, long and light textured",           "kg",    5,  0, 4),
    (20, 12, "Pumpkin",              "pumpkin",            "Fresh yellow pumpkin, sweet and versatile",       "kg",    14, 1, 5),
    (21, 12, "Ash Gourd",            "ash-gourd",          "Fresh white petha, used in traditional sweets",   "kg",    30, 0, 6),
    # Beans & Pods (13)
    (22, 13, "Green Beans",          "green-beans",        "Fresh cluster beans (gavar), tender and crisp",   "kg",    5,  0, 1),
    (23, 13, "Green Peas",           "green-peas",         "Fresh tender green peas in pod",                  "kg",    5,  1, 2),
    (24, 13, "Okra (Lady Finger)",   "okra",               "Fresh bhindi, slender and bright green",          "kg",    4,  0, 3),
    (25, 13, "Raw Banana",           "raw-banana",         "Green raw bananas for cooking curries",           "kg",    7,  0, 4),
    (26, 13, "Capsicum (Green)",     "capsicum-green",     "Fresh green bell peppers, crisp and mild",        "kg",    7,  0, 5),
    (27, 13, "Capsicum (Red)",       "capsicum-red",       "Fresh red bell peppers, sweet and vibrant",       "kg",    7,  1, 6),
    (28, 13, "Brinjal (Eggplant)",   "brinjal",            "Fresh purple brinjal, firm and glossy",           "kg",    5,  0, 7),
    (29, 13, "Cauliflower",          "cauliflower",        "Fresh white cauliflower head, tender",             "piece", 5,  1, 8),
    (30, 13, "Cabbage",              "cabbage",            "Fresh green cabbage head, crisp and crunchy",      "piece", 10, 0, 9),
    (31, 13, "Broccoli",             "broccoli",           "Fresh green broccoli florets, nutrient-dense",    "piece", 5,  1, 10),
    # Tropical Fruits (14)
    (32, 14, "Mango (Alphonso)",     "mango-alphonso",     "Premium Hapus mango from Ratnagiri",              "kg",    4,  1, 1),
    (33, 14, "Mango (Banganapalli)", "mango-banganapalli", "Large sweet Banganapalli from Andhra Pradesh",    "kg",    5,  1, 2),
    (34, 14, "Mango (Kesar)",        "mango-kesar",        "Aromatic Kesar mango from Saurashtra Gujarat",    "kg",    4,  1, 3),
    (35, 14, "Banana (Robusta)",     "banana-robusta",     "Sweet Robusta bananas, ripe and nutritious",      "dozen", 5,  0, 4),
    (36, 14, "Banana (Nendran)",     "banana-nendran",     "Large Kerala Nendran banana",                     "dozen", 7,  0, 5),
    (37, 14, "Papaya",               "papaya",             "Fresh ripe papaya, sweet and digestive",          "piece", 5,  0, 6),
    (38, 14, "Pineapple",            "pineapple",          "Fresh ripe pineapple, tangy and sweet",           "piece", 7,  1, 7),
    (39, 14, "Jackfruit",            "jackfruit",          "Fresh jackfruit, tropical and fragrant",          "kg",    5,  1, 8),
    (40, 14, "Watermelon",           "watermelon",         "Fresh red watermelon, hydrating summer fruit",    "piece", 7,  1, 9),
    (41, 14, "Coconut",              "coconut",            "Fresh whole coconut with water",                  "piece", 30, 0, 10),
    (42, 14, "Guava",                "guava",              "Fresh guava, crisp and sweet with pink flesh",    "kg",    5,  0, 11),
    (43, 14, "Chikoo (Sapodilla)",   "chikoo",             "Fresh sapodilla, caramel sweet and grainy",       "kg",    4,  1, 12),
    # Citrus Fruits (15)
    (44, 15, "Orange (Nagpur)",      "orange-nagpur",      "Sweet Nagpur oranges, premium quality",           "kg",    14, 1, 1),
    (45, 15, "Lemon",                "lemon",              "Fresh sour lemons, essential kitchen staple",     "kg",    14, 0, 2),
    (46, 15, "Lime (Green)",         "lime-green",         "Fresh green limes, tangy and aromatic",           "kg",    14, 0, 3),
    (47, 15, "Mousambi (Sweet Lime)","mousambi",           "Fresh sweet lime, juicy and mild",                "kg",    7,  1, 4),
    (48, 15, "Pomelo",               "pomelo",             "Large citrus pomelo, mild and refreshing",        "piece", 14, 1, 5),
    # Stone Fruits (16)
    (49, 16, "Pomegranate",          "pomegranate",        "Fresh Bhagwa pomegranate, ruby red arils",        "piece", 14, 1, 1),
    (50, 16, "Grapes (Green)",       "grapes-green",       "Fresh seedless green grapes, sweet and crunchy",  "kg",    7,  1, 2),
    (51, 16, "Grapes (Black)",       "grapes-black",       "Fresh black grapes, deep purple and sweet",       "kg",    7,  1, 3),
    (52, 16, "Custard Apple",        "custard-apple",      "Fresh sitaphal, creamy sweet pulp",               "kg",    3,  1, 4),
    (53, 16, "Strawberry",           "strawberry",         "Fresh red strawberries, sweet-tart and fragrant", "kg",    3,  1, 5),
    # Rice (17)
    (54, 17, "Rice (Basmati)",       "rice-basmati",       "Premium aged Basmati rice, long-grain aromatic",  "kg",    365, 0, 1),
    (55, 17, "Rice (Sona Masoori)",  "rice-sona-masoori",  "Lightweight Sona Masoori rice",                   "kg",    365, 0, 2),
    (56, 17, "Rice (Ponni)",         "rice-ponni",         "Soft Ponni boiled rice from Tamil Nadu",          "kg",    365, 0, 3),
    (57, 17, "Rice (Brown)",         "rice-brown",         "Whole grain brown rice, nutritious and nutty",    "kg",    180, 0, 4),
    (58, 17, "Rice (Red)",           "rice-red",           "Nutrient-rich Kerala red rice",                   "kg",    180, 0, 5),
    (59, 17, "Beaten Rice (Poha)",   "poha",               "Flattened rice flakes, quick to cook",            "kg",    180, 0, 6),
    # Wheat (18)
    (60, 18, "Wheat (Sharbati)",     "wheat-sharbati",     "Premium Sharbati wheat, protein-rich",            "kg",    365, 0, 1),
    (61, 18, "Whole Wheat Flour",    "wheat-flour-whole",  "Stone-ground atta, preserves bran and germ",      "kg",    60,  0, 2),
    (62, 18, "Maize (Corn)",         "maize-corn",         "Fresh sweet corn or dried maize kernels",         "kg",    365, 0, 3),
    # Millets (19)
    (63, 19, "Finger Millet (Ragi)", "ragi",               "Nutritious ragi grains rich in calcium",          "kg",    365, 0, 1),
    (64, 19, "Pearl Millet (Bajra)", "bajra",              "Earthy bajra, high in iron and protein",          "kg",    365, 0, 2),
    (65, 19, "Sorghum (Jowar)",      "jowar",              "Gluten-free jowar, energy-dense",                 "kg",    365, 0, 3),
    (66, 19, "Foxtail Millet",       "foxtail-millet",     "Ancient kangni, light and digestible",            "kg",    365, 0, 4),
    (67, 19, "Little Millet",        "little-millet",      "Tiny sama grains, nutritious and low GI",         "kg",    365, 0, 5),
    # Lentils (20)
    (68, 20, "Toor Dal",             "toor-dal",           "Split pigeon peas, staple of Indian cooking",     "kg",    365, 0, 1),
    (69, 20, "Moong Dal (Green)",    "moong-dal-green",    "Whole green moong beans, easy to digest",         "kg",    365, 0, 2),
    (70, 20, "Moong Dal (Yellow)",   "moong-dal-yellow",   "Split yellow moong dal, light and quick cooking", "kg",    365, 0, 3),
    (71, 20, "Chana Dal",            "chana-dal",          "Split Bengal gram, nutty and high protein",       "kg",    365, 0, 4),
    (72, 20, "Masoor Dal (Red)",     "masoor-dal",         "Split red lentils, quick-cooking and earthy",     "kg",    365, 0, 5),
    (73, 20, "Urad Dal (Black)",     "urad-dal-black",     "Whole black urad, used for dal makhani",          "kg",    365, 0, 6),
    (74, 20, "Groundnuts (Peanuts)", "groundnuts",         "Raw groundnuts, fresh from farm",                 "kg",    90,  0, 7),
    (75, 20, "Chickpeas (Kabuli)",   "chickpeas-kabuli",   "Large white Kabuli chana, meaty and nutritious",  "kg",    365, 0, 8),
    # Dairy (21)
    (76, 21, "Cow Milk",             "cow-milk",           "Fresh full-cream cow milk, collected same morning","litre", 1,  0, 1),
    (77, 21, "Buffalo Milk",         "buffalo-milk",       "Rich creamy buffalo milk, high fat content",      "litre", 1,  0, 2),
    (78, 21, "Curd (Dahi)",          "curd-dahi",          "Thick fresh curd made from farm milk",            "kg",    3,  0, 3),
    (79, 21, "Ghee (Cow)",           "ghee-cow",           "Pure A2 cow ghee, traditional bilona process",    "litre", 365, 0, 4),
    (80, 21, "Paneer",               "paneer",             "Fresh soft paneer from full-cream milk",          "kg",    5,  0, 5),
    (81, 21, "Buttermilk (Chaas)",   "buttermilk",         "Thin tangy chaas, refreshing and probiotic",      "litre", 2,  0, 6),
    (82, 21, "Farm Eggs",            "farm-eggs",          "Free-range desi hen eggs, rich yolk colour",      "dozen", 14, 0, 7),
    (83, 21, "Honey",                "honey",              "Raw unprocessed wildflower honey",                "kg",    730, 0, 8),
    # Fresh Herbs (22)
    (84, 22, "Basil Leaves",         "basil-leaves",       "Fresh green basil, aromatic and peppery",         "bunch", 4,  0, 1),
    (85, 22, "Lemongrass",           "lemongrass",         "Fresh lemongrass stalks, citrusy aroma",          "bunch", 7,  0, 2),
    # Dry Spices (23)
    (86, 23, "Dry Red Chilli",       "dry-red-chilli",     "Whole dry Byadgi or Guntur chillies",             "kg",    365, 0, 1),
    (87, 23, "Coriander Seeds",      "coriander-seeds",    "Dried dhania seeds, aromatic and citrusy",        "kg",    365, 0, 2),
    (88, 23, "Cumin Seeds (Jeera)",  "cumin-seeds",        "Whole jeera, earthy and warm flavour",            "kg",    365, 0, 3),
    (89, 23, "Black Pepper",         "black-pepper",       "Whole black peppercorns from Kerala",             "kg",    365, 0, 4),
    (90, 23, "Cardamom (Green)",     "cardamom-green",     "Fresh green elaichi pods, intensely aromatic",    "kg",    365, 1, 5),
    (91, 23, "Mustard Seeds",        "mustard-seeds",      "Black or yellow rai/sarson seeds",                "kg",    365, 0, 6),
    (92, 23, "Fennel Seeds (Saunf)", "fennel-seeds",       "Sweet anise-like saunf, digestive and aromatic",  "kg",    365, 0, 7),
    (93, 23, "Dry Turmeric",         "dry-turmeric",       "Dried haldi fingers or powder from farm",         "kg",    365, 0, 8),
    # Natural Products (6)
    (94,  6, "Jaggery (Gur)",        "jaggery",            "Unrefined cane sugar jaggery block, dark and rich","kg",   180, 0, 1),
    (95,  6, "Coconut Oil",          "coconut-oil",        "Cold-pressed virgin coconut oil",                 "litre", 365, 0, 2),
    (96,  6, "Sesame Oil (Gingelly)","sesame-oil",         "Traditional cold-pressed gingelly oil",           "litre", 365, 0, 3),
    (97,  6, "Groundnut Oil",        "groundnut-oil",      "Cold-pressed peanut oil, light and flavourful",   "litre", 365, 0, 4),
    (98,  6, "Sugarcane Juice",      "sugarcane-juice",    "Fresh pressed sugarcane juice, naturally sweet",   "litre", 1,  1, 5),
    (99,  6, "Tamarind",             "tamarind",           "Sour fresh tamarind pods or pulp",                "kg",    180, 0, 6),
    (100, 6, "Dry Coconut (Copra)",  "dry-coconut",        "Sun-dried coconut halves for grating or oil",     "kg",    90,  0, 7),
    # Extra Vegetables (1)
    (101, 1, "Sweet Corn",           "sweet-corn",         "Fresh sweet corn cobs, plump and juicy",          "piece", 3,  1, 1),
    (102, 1, "Drumstick",            "drumstick",          "Fresh moringa pods, long and tender",             "kg",    5,  0, 2),
    (103, 1, "Raw Mango",            "raw-mango",          "Sour green unripe mango for pickles and chutneys","kg",    7,  1, 3),
    (104, 1, "Suran (Yam)",          "suran-yam",          "Fresh elephant yam, starchy and versatile",       "kg",    30, 0, 4),
    (105, 1, "Colocasia (Arbi)",     "colocasia",          "Fresh taro root, mild and starchy",               "kg",    14, 0, 5),
    (106, 1, "Raw Jackfruit",        "raw-jackfruit",      "Young green jackfruit for curries",               "kg",    3,  1, 6),
    (107, 1, "Green Papaya",         "green-papaya",       "Raw papaya for salads and curries",               "kg",    7,  0, 7),
    (108, 1, "Pointed Gourd",        "pointed-gourd",      "Fresh parwal, tender green with white stripes",   "kg",    5,  0, 8),
    # Extra Fruits (2)
    (109, 2, "Fig (Anjeer)",         "fig-anjeer",         "Fresh ripe figs, honey-sweet and delicate",       "kg",    3,  1, 1),
    (110, 2, "Amla (Gooseberry)",    "amla",               "Fresh Indian gooseberry, Vitamin C-rich",         "kg",    14, 1, 2),
    (111, 2, "Starfruit (Carambola)","starfruit",          "Refreshing star-shaped tropical fruit",           "kg",    7,  1, 3),
    (112, 2, "Passion Fruit",        "passion-fruit",      "Tropical wrinkled purple fruit with tart pulp",   "kg",    5,  1, 4),
    (113, 2, "Dragon Fruit",         "dragon-fruit",       "Vibrant pink dragon fruit, white speckled flesh",  "piece", 7,  1, 5),
    # Extra Grains (3)
    (114, 3, "Sesame Seeds (Till)",  "sesame-seeds",       "White or black til seeds, nutty and oil-rich",    "kg",    365, 0, 1),
    (115, 3, "Flax Seeds (Alsi)",    "flax-seeds",         "Nutritious alsi seeds, omega-3 rich",             "kg",    365, 0, 2),
    (116, 3, "Sunflower Seeds",      "sunflower-seeds",    "Raw sunflower seeds, light and crunchy",           "kg",    180, 0, 3),
    (117, 3, "Green Gram (Whole)",   "green-gram-whole",   "Whole unpeeled green moong, versatile",           "kg",    365, 0, 4),
    # More Spices (5)
    (118, 5, "Cloves",               "cloves",             "Whole dried cloves (laung), intensely aromatic",  "kg",    365, 0, 1),
    (119, 5, "Cinnamon",             "cinnamon",           "Ceylon cinnamon sticks, warm and sweet",          "kg",    365, 0, 2),
    (120, 5, "Star Anise",           "star-anise",         "Whole star anise pods, licorice-like aroma",      "kg",    365, 0, 3),
]

for p in products:
    cur.execute(
        "INSERT OR IGNORE INTO master_products "
        "(id, category_id, name, slug, description, default_unit, shelf_life_days, is_seasonal, is_active, display_order, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,1,?,?,?)",
        (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], now, now)
    )

conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM master_categories")
cat_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM master_products")
prod_count = cur.fetchone()[0]
print(f"\n✅ Migration complete!")
print(f"   Categories: {cat_count}")
print(f"   Master Products: {prod_count}")

# Also record in alembic_version
cur.execute("SELECT version_num FROM alembic_version")
versions = [r[0] for r in cur.fetchall()]
print(f"   Alembic versions: {versions}")
if "009_master_catalogue" not in versions:
    cur.execute("INSERT INTO alembic_version (version_num) VALUES (?)", ("009_master_catalogue",))
    conn.commit()
    print("   Recorded 009_master_catalogue in alembic_version")

conn.close()
