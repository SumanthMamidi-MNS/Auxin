"""
009_master_catalogue.py
=======================
Phase 3.10 — Master Product Catalogue

Creates:
  - master_categories   (2-level category hierarchy)
  - master_products     (admin-owned canonical product catalogue)
  - farmer_inventory    (per-farmer stock contributions)

Extends:
  - order_items         (adds inventory_id + master_product_id columns)

Seeds:
  - 6 root categories + subcategories
  - 120 master products covering all common Indian agricultural produce
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers
revision = "009_master_catalogue"
down_revision = "31675d11771f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. master_categories
    # ------------------------------------------------------------------ #
    op.create_table(
        "master_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column(
            "parent_id",
            sa.Integer(),
            sa.ForeignKey("master_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("icon_emoji", sa.String(10), nullable=True),
        sa.Column("image_url", sa.String(2048), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="TRUE"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_master_categories_slug", "master_categories", ["slug"])
    op.create_index(
        "ix_master_categories_parent",
        "master_categories",
        ["parent_id", "is_active"],
    )

    # ------------------------------------------------------------------ #
    # 2. master_products
    # ------------------------------------------------------------------ #
    op.create_table(
        "master_products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("master_categories.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_unit", sa.String(20), nullable=False, server_default="kg"),
        sa.Column("image_url", sa.String(2048), nullable=True),
        sa.Column("tags", sa.Text(), nullable=True),           # stored as JSON string
        sa.Column("storage_info", sa.Text(), nullable=True),
        sa.Column("shelf_life_days", sa.Integer(), nullable=True),
        sa.Column("is_seasonal", sa.Boolean(), nullable=False, server_default="FALSE"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="TRUE"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_master_products_category",
        "master_products",
        ["category_id", "is_active"],
    )
    op.create_index("ix_master_products_slug", "master_products", ["slug"])
    op.create_index(
        "ix_master_products_display_order",
        "master_products",
        ["display_order", "is_active"],
    )

    # ------------------------------------------------------------------ #
    # 3. farmer_inventory
    # ------------------------------------------------------------------ #
    op.create_table(
        "farmer_inventory",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "master_product_id",
            sa.Integer(),
            sa.ForeignKey("master_products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "farmer_id",
            sa.Integer(),
            sa.ForeignKey("farmers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(20), nullable=False, server_default="kg"),
        sa.Column("is_organic", sa.Boolean(), nullable=False, server_default="FALSE"),
        sa.Column("harvest_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="TRUE"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default="FALSE"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "master_product_id", "farmer_id", name="uq_inventory_product_farmer"
        ),
        sa.CheckConstraint("price > 0", name="ck_inventory_price_positive"),
        sa.CheckConstraint("quantity >= 0", name="ck_inventory_quantity_nonneg"),
    )
    op.create_index(
        "ix_inventory_master_product",
        "farmer_inventory",
        ["master_product_id", "is_active"],
    )
    op.create_index(
        "ix_inventory_farmer", "farmer_inventory", ["farmer_id", "is_active"]
    )

    # ------------------------------------------------------------------ #
    # 4. Extend order_items with inventory / master product references
    # ------------------------------------------------------------------ #
    op.add_column(
        "order_items",
        sa.Column(
            "inventory_id",
            sa.Integer(),
            sa.ForeignKey("farmer_inventory.id", ondelete="RESTRICT"),
            nullable=True,  # nullable — old order_items rows have no inventory
        ),
    )
    op.add_column(
        "order_items",
        sa.Column(
            "master_product_id",
            sa.Integer(),
            sa.ForeignKey("master_products.id", ondelete="RESTRICT"),
            nullable=True,  # nullable — old order_items rows have no master_product
        ),
    )

    # ------------------------------------------------------------------ #
    # 5. Seed master_categories
    # ------------------------------------------------------------------ #
    conn = op.get_bind()
    now = datetime.now(tz=timezone.utc)

    # (id, name, slug, parent_id, icon_emoji, display_order)
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
        conn.execute(
            sa.text(
                "INSERT INTO master_categories "
                "(id, name, slug, parent_id, icon_emoji, display_order, is_active, created_at) "
                "VALUES (:id, :name, :slug, :parent_id, :icon_emoji, :display_order, :is_active, :created_at) "
                "ON CONFLICT DO NOTHING"
            ),
            {
                "id": row[0], "name": row[1], "slug": row[2],
                "parent_id": row[3], "icon_emoji": row[4],
                "display_order": row[5], "is_active": True, "created_at": now,
            },
        )

    # ------------------------------------------------------------------ #
    # 6. Seed master_products (~120 Indian agri products)
    # ------------------------------------------------------------------ #
    # (id, category_id, name, slug, description, default_unit, shelf_life_days, is_seasonal, display_order)
    products = [
        # Leafy Greens (10)
        (1,  10, "Spinach",            "spinach",            "Fresh tender spinach leaves, rich in iron",              "bunch", 5,   False, 1),
        (2,  10, "Fenugreek Leaves",   "fenugreek-leaves",   "Fresh methi leaves, aromatic and nutritious",            "bunch", 4,   False, 2),
        (3,  10, "Coriander",          "coriander",          "Fresh green coriander leaves with stems",                "bunch", 5,   False, 3),
        (4,  10, "Mint Leaves",        "mint-leaves",        "Fresh pudina leaves, crisp and aromatic",                "bunch", 5,   False, 4),
        (5,  10, "Curry Leaves",       "curry-leaves",       "Fresh kadi patta for South Indian cooking",              "bunch", 7,   False, 5),
        (6,  10, "Drumstick Leaves",   "drumstick-leaves",   "Moringa leaves, superfood packed with nutrients",        "bunch", 4,   False, 6),
        # Root Vegetables (11)
        (7,  11, "Tomato",             "tomato",             "Fresh red tomatoes, firm and juicy",                     "kg",    7,   False, 1),
        (8,  11, "Onion",              "onion",              "Fresh red onions, pungent and flavorful",                "kg",    30,  False, 2),
        (9,  11, "Potato",             "potato",             "Fresh potatoes, ideal for all cooking styles",           "kg",    21,  False, 3),
        (10, 11, "Carrot",             "carrot",             "Fresh orange carrots, sweet and crunchy",                "kg",    14,  False, 4),
        (11, 11, "Beetroot",           "beetroot",           "Fresh beets, rich in antioxidants",                      "kg",    14,  False, 5),
        (12, 11, "Radish",             "radish",             "Fresh white radish (mooli), crisp and peppery",          "kg",    7,   False, 6),
        (13, 11, "Ginger",             "ginger",             "Fresh ginger root, pungent and spicy",                   "kg",    21,  False, 7),
        (14, 11, "Garlic",             "garlic",             "Fresh garlic bulbs, aromatic and flavourful",            "kg",    30,  False, 8),
        (15, 11, "Turmeric",           "turmeric",           "Fresh turmeric root, vivid yellow and earthy",           "kg",    30,  False, 9),
        # Gourds (12)
        (16, 12, "Bottle Gourd",       "bottle-gourd",       "Fresh lauki, light and easy to digest",                  "piece", 7,   False, 1),
        (17, 12, "Bitter Gourd",       "bitter-gourd",       "Fresh karela, traditional medicinal vegetable",          "kg",    5,   False, 2),
        (18, 12, "Ridge Gourd",        "ridge-gourd",        "Fresh turai, tender and mild flavoured",                 "kg",    5,   False, 3),
        (19, 12, "Snake Gourd",        "snake-gourd",        "Fresh padwal, long and light textured",                  "kg",    5,   False, 4),
        (20, 12, "Pumpkin",            "pumpkin",            "Fresh yellow pumpkin, sweet and versatile",              "kg",    14,  True,  5),
        (21, 12, "Ash Gourd",          "ash-gourd",          "Fresh white petha, used in traditional sweets",          "kg",    30,  False, 6),
        # Beans & Pods (13)
        (22, 13, "Green Beans",        "green-beans",        "Fresh cluster beans (gavar), tender and crisp",          "kg",    5,   False, 1),
        (23, 13, "Green Peas",         "green-peas",         "Fresh tender green peas in pod",                         "kg",    5,   True,  2),
        (24, 13, "Okra (Lady Finger)", "okra",               "Fresh bhindi, slender and bright green",                 "kg",    4,   False, 3),
        (25, 13, "Raw Banana",         "raw-banana",         "Green raw bananas for cooking curries",                  "kg",    7,   False, 4),
        (26, 13, "Capsicum (Green)",   "capsicum-green",     "Fresh green bell peppers, crisp and mild",               "kg",    7,   False, 5),
        (27, 13, "Capsicum (Red)",     "capsicum-red",       "Fresh red bell peppers, sweet and vibrant",              "kg",    7,   True,  6),
        (28, 13, "Brinjal (Eggplant)", "brinjal",            "Fresh purple brinjal, firm and glossy",                  "kg",    5,   False, 7),
        (29, 13, "Cauliflower",        "cauliflower",        "Fresh white cauliflower head, compact and tender",        "piece", 5,   True,  8),
        (30, 13, "Cabbage",            "cabbage",            "Fresh green cabbage head, crisp and crunchy",             "piece", 10,  False, 9),
        (31, 13, "Broccoli",           "broccoli",           "Fresh green broccoli florets, nutrient-dense",           "piece", 5,   True,  10),
        # Tropical Fruits (14)
        (32, 14, "Mango (Alphonso)",   "mango-alphonso",     "Premium Hapus mango from Ratnagiri, king of mangoes",    "kg",    4,   True,  1),
        (33, 14, "Mango (Banganapalli)", "mango-banganapalli", "Large sweet Banganapalli from Andhra Pradesh",         "kg",    5,   True,  2),
        (34, 14, "Mango (Kesar)",      "mango-kesar",        "Aromatic Kesar mango from Saurashtra Gujarat",           "kg",    4,   True,  3),
        (35, 14, "Banana (Robusta)",   "banana-robusta",     "Sweet Robusta bananas, ripe and nutritious",             "dozen", 5,   False, 4),
        (36, 14, "Banana (Nendran)",   "banana-nendran",     "Large Kerala Nendran banana, perfect for chips",         "dozen", 7,   False, 5),
        (37, 14, "Papaya",             "papaya",             "Fresh ripe papaya, sweet and digestive",                 "piece", 5,   False, 6),
        (38, 14, "Pineapple",          "pineapple",          "Fresh ripe pineapple, tangy and sweet",                  "piece", 7,   True,  7),
        (39, 14, "Jackfruit",          "jackfruit",          "Fresh raw or ripe jackfruit, tropical and fragrant",     "kg",    5,   True,  8),
        (40, 14, "Watermelon",         "watermelon",         "Fresh red watermelon, hydrating summer fruit",           "piece", 7,   True,  9),
        (41, 14, "Coconut",            "coconut",            "Fresh whole coconut with water",                         "piece", 30,  False, 10),
        (42, 14, "Guava",              "guava",              "Fresh guava, crisp and sweet with pink flesh",           "kg",    5,   False, 11),
        (43, 14, "Chikoo (Sapodilla)", "chikoo",             "Fresh sapodilla, caramel sweet and grainy",              "kg",    4,   True,  12),
        # Citrus Fruits (15)
        (44, 15, "Orange (Nagpur)",    "orange-nagpur",      "Sweet Nagpur oranges, India's premium orange",           "kg",    14,  True,  1),
        (45, 15, "Lemon",              "lemon",              "Fresh sour lemons, essential kitchen staple",            "kg",    14,  False, 2),
        (46, 15, "Lime (Green)",       "lime-green",         "Fresh green limes, tangy and aromatic",                  "kg",    14,  False, 3),
        (47, 15, "Mousambi (Sweet Lime)", "mousambi",        "Fresh sweet lime, juicy and mild",                       "kg",    7,   True,  4),
        (48, 15, "Pomelo",             "pomelo",             "Large citrus pomelo, mild and refreshing",               "piece", 14,  True,  5),
        # Stone Fruits (16)
        (49, 16, "Pomegranate",        "pomegranate",        "Fresh Bhagwa pomegranate, ruby red arils",               "piece", 14,  True,  1),
        (50, 16, "Grapes (Green)",     "grapes-green",       "Fresh seedless green grapes, sweet and crunchy",         "kg",    7,   True,  2),
        (51, 16, "Grapes (Black)",     "grapes-black",       "Fresh black grapes, deep purple and sweet",              "kg",    7,   True,  3),
        (52, 16, "Custard Apple",      "custard-apple",      "Fresh sitaphal, creamy sweet pulp",                      "kg",    3,   True,  4),
        (53, 16, "Strawberry",         "strawberry",         "Fresh red strawberries, sweet-tart and fragrant",        "kg",    3,   True,  5),
        # Rice Varieties (17)
        (54, 17, "Rice (Basmati)",     "rice-basmati",       "Premium aged Basmati rice, long-grain aromatic",         "kg",    365, False, 1),
        (55, 17, "Rice (Sona Masoori)", "rice-sona-masoori", "Lightweight Sona Masoori rice, South India staple",      "kg",    365, False, 2),
        (56, 17, "Rice (Ponni)",       "rice-ponni",         "Soft Ponni boiled rice from Tamil Nadu",                 "kg",    365, False, 3),
        (57, 17, "Rice (Brown)",       "rice-brown",         "Whole grain brown rice, nutritious and nutty",           "kg",    180, False, 4),
        (58, 17, "Rice (Red)",         "rice-red",           "Nutrient-rich Kerala red rice, earthy flavour",          "kg",    180, False, 5),
        (59, 17, "Beaten Rice (Poha)", "poha",               "Flattened rice flakes, quick to cook",                   "kg",    180, False, 6),
        # Wheat & Flour (18)
        (60, 18, "Wheat (Sharbati)",   "wheat-sharbati",     "Premium Sharbati wheat, sweet and protein-rich",         "kg",    365, False, 1),
        (61, 18, "Whole Wheat Flour",  "wheat-flour-whole",  "Stone-ground atta, preserves bran and germ",             "kg",    60,  False, 2),
        (62, 18, "Maize (Corn)",       "maize-corn",         "Fresh sweet corn or dried maize kernels",                "kg",    365, False, 3),
        # Millets (19)
        (63, 19, "Finger Millet (Ragi)", "ragi",             "Nutritious ragi grains rich in calcium",                 "kg",    365, False, 1),
        (64, 19, "Pearl Millet (Bajra)", "bajra",            "Earthy bajra, high in iron and protein",                 "kg",    365, False, 2),
        (65, 19, "Sorghum (Jowar)",    "jowar",              "Gluten-free jowar, energy-dense and versatile",          "kg",    365, False, 3),
        (66, 19, "Foxtail Millet",     "foxtail-millet",     "Ancient kangni, light and digestible",                   "kg",    365, False, 4),
        (67, 19, "Little Millet",      "little-millet",      "Tiny sama grains, nutritious and low GI",                "kg",    365, False, 5),
        # Lentils & Dals (20)
        (68, 20, "Toor Dal",           "toor-dal",           "Split pigeon peas, staple of Indian cooking",            "kg",    365, False, 1),
        (69, 20, "Moong Dal (Green)",  "moong-dal-green",    "Whole green moong beans, easy to digest",                "kg",    365, False, 2),
        (70, 20, "Moong Dal (Yellow)", "moong-dal-yellow",   "Split yellow moong dal, light and quick cooking",        "kg",    365, False, 3),
        (71, 20, "Chana Dal",          "chana-dal",          "Split Bengal gram, nutty flavour and high protein",      "kg",    365, False, 4),
        (72, 20, "Masoor Dal (Red)",   "masoor-dal",         "Split red lentils, quick-cooking and earthy",            "kg",    365, False, 5),
        (73, 20, "Urad Dal (Black)",   "urad-dal-black",     "Whole black urad, used for dal makhani",                 "kg",    365, False, 6),
        (74, 20, "Groundnuts (Peanuts)", "groundnuts",       "Raw groundnuts, fresh from farm",                        "kg",    90,  False, 7),
        (75, 20, "Chickpeas (Kabuli)", "chickpeas-kabuli",   "Large white Kabuli chana, meaty and nutritious",         "kg",    365, False, 8),
        # Dairy & Eggs (21)
        (76, 21, "Cow Milk",           "cow-milk",           "Fresh full-cream cow milk, collected same morning",      "litre", 1,   False, 1),
        (77, 21, "Buffalo Milk",       "buffalo-milk",       "Rich creamy buffalo milk, high fat content",             "litre", 1,   False, 2),
        (78, 21, "Curd (Dahi)",        "curd-dahi",          "Thick fresh curd made from farm milk",                   "kg",    3,   False, 3),
        (79, 21, "Ghee (Cow)",         "ghee-cow",           "Pure A2 cow ghee, traditional bilona process",           "litre", 365, False, 4),
        (80, 21, "Paneer",             "paneer",             "Fresh soft paneer made from full-cream milk",            "kg",    5,   False, 5),
        (81, 21, "Buttermilk (Chaas)", "buttermilk",         "Thin tangy chaas, refreshing and probiotic",             "litre", 2,   False, 6),
        (82, 21, "Farm Eggs",          "farm-eggs",          "Free-range desi hen eggs, rich yolk colour",             "dozen", 14,  False, 7),
        (83, 21, "Honey",              "honey",              "Raw unprocessed wildflower honey",                       "kg",    730, False, 8),
        # Fresh Herbs (22)
        (84, 22, "Basil Leaves",       "basil-leaves",       "Fresh green basil, aromatic and peppery",                "bunch", 4,   False, 1),
        (85, 22, "Lemongrass",         "lemongrass",         "Fresh lemongrass stalks, citrusy aroma",                 "bunch", 7,   False, 2),
        # Dry Spices (23)
        (86, 23, "Dry Red Chilli",     "dry-red-chilli",     "Whole dry Byadgi or Guntur chillies",                    "kg",    365, False, 1),
        (87, 23, "Coriander Seeds",    "coriander-seeds",    "Dried dhania seeds, aromatic and citrusy",               "kg",    365, False, 2),
        (88, 23, "Cumin Seeds (Jeera)", "cumin-seeds",       "Whole jeera, earthy and warm flavour",                   "kg",    365, False, 3),
        (89, 23, "Black Pepper",       "black-pepper",       "Whole black peppercorns from Kerala",                    "kg",    365, False, 4),
        (90, 23, "Cardamom (Green)",   "cardamom-green",     "Fresh green elaichi pods, intensely aromatic",           "kg",    365, True,  5),
        (91, 23, "Mustard Seeds",      "mustard-seeds",      "Black or yellow rai/sarson seeds",                       "kg",    365, False, 6),
        (92, 23, "Fennel Seeds (Saunf)", "fennel-seeds",     "Sweet anise-like saunf, digestive and aromatic",         "kg",    365, False, 7),
        (93, 23, "Dry Turmeric",       "dry-turmeric",       "Dried haldi fingers or powder from farm",                "kg",    365, False, 8),
        # Natural Products (6)
        (94,  6, "Jaggery (Gur)",      "jaggery",            "Unrefined cane sugar jaggery block, dark and rich",      "kg",    180, False, 1),
        (95,  6, "Coconut Oil",        "coconut-oil",        "Cold-pressed virgin coconut oil",                        "litre", 365, False, 2),
        (96,  6, "Sesame Oil (Gingelly)", "sesame-oil",      "Traditional cold-pressed gingelly oil",                  "litre", 365, False, 3),
        (97,  6, "Groundnut Oil",      "groundnut-oil",      "Cold-pressed peanut oil, light and flavourful",          "litre", 365, False, 4),
        (98,  6, "Sugarcane Juice",    "sugarcane-juice",    "Fresh pressed sugarcane juice, naturally sweet",          "litre", 1,   True,  5),
        (99,  6, "Tamarind",           "tamarind",           "Sour fresh tamarind pods or pulp",                       "kg",    180, False, 6),
        (100, 6, "Dry Coconut (Copra)", "dry-coconut",       "Sun-dried coconut halves for grating or oil",            "kg",    90,  False, 7),
        # Extra Vegetables (1)
        (101, 1, "Sweet Corn",         "sweet-corn",         "Fresh sweet corn cobs, plump and juicy",                 "piece", 3,   True,  1),
        (102, 1, "Drumstick",          "drumstick",          "Fresh moringa pods, long and tender",                    "kg",    5,   False, 2),
        (103, 1, "Raw Mango",          "raw-mango",          "Sour green unripe mango for pickles and chutneys",       "kg",    7,   True,  3),
        (104, 1, "Suran (Yam)",        "suran-yam",          "Fresh elephant yam, starchy and versatile",              "kg",    30,  False, 4),
        (105, 1, "Colocasia (Arbi)",   "colocasia",          "Fresh taro root, mild and starchy",                      "kg",    14,  False, 5),
        (106, 1, "Raw Jackfruit",      "raw-jackfruit",      "Young green jackfruit for curries",                      "kg",    3,   True,  6),
        (107, 1, "Green Papaya",       "green-papaya",       "Raw papaya for salads and curries",                      "kg",    7,   False, 7),
        (108, 1, "Pointed Gourd",      "pointed-gourd",      "Fresh parwal, tender green with white stripes",          "kg",    5,   False, 8),
        # Extra Fruits (2)
        (109, 2, "Fig (Anjeer)",       "fig-anjeer",         "Fresh ripe figs, honey-sweet and delicate",              "kg",    3,   True,  1),
        (110, 2, "Amla (Gooseberry)",  "amla",               "Fresh Indian gooseberry, Vitamin C-rich",                "kg",    14,  True,  2),
        (111, 2, "Starfruit (Carambola)", "starfruit",        "Refreshing star-shaped tropical fruit",                  "kg",    7,   True,  3),
        (112, 2, "Passion Fruit",      "passion-fruit",      "Tropical wrinkled purple fruit with tart pulp",          "kg",    5,   True,  4),
        (113, 2, "Dragon Fruit",       "dragon-fruit",       "Vibrant pink dragon fruit, white speckled flesh",         "piece", 7,   True,  5),
        # Extra Grains (3)
        (114, 3, "Sesame Seeds (Till)", "sesame-seeds",      "White or black til seeds, nutty and oil-rich",           "kg",    365, False, 1),
        (115, 3, "Flax Seeds (Alsi)",  "flax-seeds",         "Nutritious alsi seeds, omega-3 rich",                    "kg",    365, False, 2),
        (116, 3, "Sunflower Seeds",    "sunflower-seeds",    "Raw sunflower seeds, light and crunchy",                  "kg",    180, False, 3),
        (117, 3, "Green Gram (Whole)", "green-gram-whole",   "Whole unpeeled green moong, versatile",                  "kg",    365, False, 4),
        # More Spices (5)
        (118, 5, "Cloves",             "cloves",             "Whole dried cloves (laung), intensely aromatic",         "kg",    365, False, 1),
        (119, 5, "Cinnamon",           "cinnamon",           "Ceylon cinnamon sticks, warm and sweet",                 "kg",    365, False, 2),
        (120, 5, "Star Anise",         "star-anise",         "Whole star anise pods, licorice-like aroma",             "kg",    365, False, 3),
    ]

    for p in products:
        conn.execute(
            sa.text(
                "INSERT INTO master_products "
                "(id, category_id, name, slug, description, default_unit, shelf_life_days, is_seasonal, is_active, display_order, created_at, updated_at) "
                "VALUES (:id, :cat, :name, :slug, :desc, :unit, :shelf, :seasonal, TRUE, :order, :now, :now) "
                "ON CONFLICT DO NOTHING"
            ),
            {
                "id": p[0], "cat": p[1], "name": p[2], "slug": p[3],
                "desc": p[4], "unit": p[5], "shelf": p[6],
                "seasonal": p[7], "order": p[8], "now": now,
            },
        )


def downgrade() -> None:
    op.drop_column("order_items", "master_product_id")
    op.drop_column("order_items", "inventory_id")
    op.drop_table("farmer_inventory")
    op.drop_table("master_products")
    op.drop_table("master_categories")
