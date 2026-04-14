----------
## My project Name: MEDE STORE


```
 "email": "admin@gmail.com",
    "password": "Admin1234"

    "name": "Seller ",
    "email": "seller@gmail.com",
    "password": "Seller1234",
    "role": "SELLER"

       "name": "Customer ",
       "email": "Customer@gmail.com",
       "password": "Customer1234",
       "role": "CUSTOMER"
```
## 🔎 Search
```

search=ACI → name/brand/manufacturer/description/category.name এ খুঁজবে
```
##  Filters
```

categoryId=...

sellerId=...

brand=Square

form=TABLET | SYRUP | ...

status=ACTIVE | INACTIVE

minPrice=10

maxPrice=1000
```


## Sort
```

sortBy=createdAt | price | stock | name

sortOrder=asc | desc
```
##  Pagination
```
page=1

limit=10
```
## work flow
```

💊 Customer Journey
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Browse Shop │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Add to Cart  │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Checkout   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Track Order  │
                              └──────────────┘
🏪 Seller Journey
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Add Medicines │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Manage Stock │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ View Orders  │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Update Status │
                              └──────────────┘
📊 Order Status
                              ┌──────────────┐
                              │    PLACED    │
                              └──────────────┘
                               /            \
                              /              \
                        (seller)        (customer)
                        confirms         cancels
                            /                \
                           ▼                  ▼
                   ┌──────────────┐   ┌──────────────┐
                   │  PROCESSING  │   │  CANCELLED   │
                   └──────────────┘   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   SHIPPED    │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  DELIVERED   │
                   └──────────────┘
💊 Note: OTC medicines only (no prescription required)

``

```
src/
 ├─ modules/
 │   ├─ auth
 │   ├─ user
 │   ├─ medicine
 │   ├─ order
 │   ├─ review
 │   ├─ category
 │
 ├─ middlewares/
 │   ├─ authGuard
 │   ├─ roleGuard
 │
 ├─ routes/
 ├─ prisma/
 └─ utils/
```