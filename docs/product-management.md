# 📦 Tài liệu: Quản lý Sản phẩm, Biến thể, Màu sắc & Thuộc tính

> **Dự án:** SecureShop – Backend Spring Boot + Frontend React (Vite/TSX)  
> **Cập nhật lần cuối:** 2026-04-07  
> **Phạm vi:** Thêm sản phẩm, quản lý Variant, Color, Attribute và IMEI/Inventory Unit

---

## 1. Kiến trúc dữ liệu (Database Tables)

### 1.1 Sơ đồ quan hệ

```
products
   ├── product_variants       (1 SP → nhiều biến thể)
   │      └── inventory_units (1 biến thể → nhiều unit IMEI)
   │      └── variant_color_mappings (biến thể × màu → SKU riêng)
   ├── product_colors         (1 SP → nhiều màu)
   ├── product_attributes     (1 SP → nhiều thuộc tính động)
   └── barcodes               (1 SP → mã vạch)
```

---

### 1.2 Bảng `products`

**File:** `backend/src/main/java/secure_shop/backend/entities/Product.java`  
**Table:** `products`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | Khoá chính (kế thừa `BaseEntity`) |
| `sku` | VARCHAR(50) | NOT NULL, UNIQUE | Mã SKU duy nhất |
| `name` | VARCHAR(500) | NOT NULL | Tên sản phẩm |
| `short_desc` | NVARCHAR(MAX) | | Mô tả ngắn |
| `long_desc` | NVARCHAR(MAX) | | Mô tả chi tiết |
| `listed_price` | DECIMAL(15,2) | NOT NULL | Giá niêm yết |
| `price` | DECIMAL(15,2) | NOT NULL | Giá bán |
| `active` | BIT | NOT NULL, default=1 | Trạng thái kích hoạt |
| `thumbnail_url` | VARCHAR(2048) | | URL ảnh đại diện |
| `rating` | FLOAT | NOT NULL, default=0.0 | Điểm đánh giá trung bình |
| `review_count` | INT | NOT NULL, default=0 | Số đánh giá |
| `brand_id` | UUID | FK → brands | Thương hiệu |
| `category_id` | UUID | FK → categories | Danh mục |
| `deleted_at` | DATETIME | | Soft delete timestamp |

**Soft delete:** `UPDATE products SET deleted_at = GETDATE(), active = 0 WHERE id = ?`  
**SQLRestriction:** Tự động lọc `deleted_at IS NULL` trong mọi query.

**Indexes:**
- `idx_products_sku` → `sku`
- `idx_products_active` → `active`
- `idx_products_category` → `category_id`
- `idx_products_brand` → `brand_id`
- `idx_products_name` → `name`
- `idx_products_listed_price` → `listed_price`
- `idx_products_price` → `price`

---

### 1.3 Bảng `product_variants`

**File:** `backend/src/main/java/secure_shop/backend/entities/ProductVariant.java`  
**Table:** `product_variants`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `product_id` | UUID | FK → products | Sản phẩm cha |
| `variant_type` | VARCHAR(100) | NOT NULL | Loại biến thể (VD: `resolution`, `lens_type`) |
| `variant_value` | VARCHAR(255) | NOT NULL | Giá trị (VD: `4MP`, `2.8mm`) |
| `sku` | VARCHAR(100) | NOT NULL, UNIQUE | SKU của biến thể |
| `price_adjustment` | DECIMAL(15,2) | NOT NULL, ≥0 | Chênh lệch giá so với SP gốc |
| `description` | NVARCHAR(MAX) | | Mô tả biến thể |
| `image_url` | VARCHAR(2048) | | Ảnh riêng của biến thể |
| `active` | BIT | NOT NULL, default=1 | |
| `deleted_at` | DATETIME | | Soft delete |

**Ví dụ thực tế:**
```
Camera IP HD:
  - variant_type = "resolution", variant_value = "2MP", sku = "CAM-HD-2MP-001"
  - variant_type = "resolution", variant_value = "4MP", sku = "CAM-HD-4MP-001"
  - variant_type = "lens_type",  variant_value = "2.8mm", sku = "CAM-HD-LENS28-001"
```

**Indexes:** `idx_variant_sku`, `idx_variant_product`, `idx_variant_type`, `idx_variant_active`

---

### 1.4 Bảng `product_colors`

**File:** `backend/src/main/java/secure_shop/backend/entities/ProductColor.java`  
**Table:** `product_colors`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `product_id` | UUID | FK → products | Sản phẩm cha |
| `color_name` | VARCHAR(100) | NOT NULL | Tên màu (VD: `Black`, `White`, `Silver`) |
| `hex_code` | VARCHAR(7) | NOT NULL, regex `#RRGGBB` | Mã màu hex |
| `image_url` | VARCHAR(2048) | | Ảnh mẫu màu |
| `description` | NVARCHAR(MAX) | | Mô tả |
| `active` | BIT | NOT NULL, default=1 | |
| `deleted_at` | DATETIME | | Soft delete |

**Ví dụ:**
```
Smart Lock:
  - color_name = "Black",  hex_code = "#1a1a1a"
  - color_name = "White",  hex_code = "#f5f5f5"
  - color_name = "Silver", hex_code = "#c0c0c0"
```

---

### 1.5 Bảng `product_attributes`

**File:** `backend/src/main/java/secure_shop/backend/entities/ProductAttribute.java`  
**Table:** `product_attributes`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `product_id` | UUID | FK → products | Sản phẩm cha |
| `variant_id` | UUID | FK → product_variants (nullable) | Gắn với biến thể cụ thể (nếu có) |
| `attribute_key` | VARCHAR(100) | NOT NULL | Key dạng snake_case (VD: `ir_range`) |
| `attribute_name` | VARCHAR(100) | NOT NULL | Tên hiển thị (VD: `Tầm hồng ngoại`) |
| `attribute_value` | NVARCHAR(MAX) | NOT NULL | Giá trị (VD: `50m`) |
| `description` | NVARCHAR(MAX) | | Mô tả thêm |
| `value_type` | VARCHAR(50) | default=`string` | Kiểu dữ liệu: `string`, `number`, `boolean` |
| `unit` | VARCHAR(50) | | Đơn vị (VD: `m`, `MP`, `GHz`) |
| `deleted_at` | DATETIME | | Soft delete |

**Ví dụ:**
```
Camera IP:
  - attribute_key = "resolution",   attribute_name = "Độ phân giải",   value = "4MP"
  - attribute_key = "ir_range",     attribute_name = "Tầm hồng ngoại", value = "50",  unit = "m"
  - attribute_key = "lens_type",    attribute_name = "Loại lens",       value = "Varifocal"
  - attribute_key = "connectivity", attribute_name = "Kết nối",         value = "PoE / WiFi"
```

---

### 1.6 Bảng `variant_color_mappings`

**File:** `backend/src/main/java/secure_shop/backend/entities/VariantColorMapping.java`  
**Table:** `variant_color_mappings`

Bảng trung gian giữa Variant × Color. Mỗi tổ hợp (variant + color) có SKU riêng và có thể có giá điều chỉnh thêm.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `variant_id` | UUID | FK → product_variants | |
| `color_id` | UUID | FK → product_colors | |
| `sku` | VARCHAR(100) | NOT NULL, UNIQUE | SKU = `CAM-4MP-BLACK-001` |
| `color_price_adjustment` | DECIMAL(15,2) | ≥0 | Chênh giá theo màu |
| `description` | NVARCHAR(MAX) | | |
| `image_url` | VARCHAR(2048) | | Ảnh của combination này |
| `active` | BIT | NOT NULL, default=1 | |
| `deleted_at` | DATETIME | | |

**Unique index:** `(variant_id, color_id)` – không trùng combination.

**Helper method:**
```java
public BigDecimal getTotalPriceAdjustment() {
    return variantPriceAdj + colorPriceAdj;
}
```

---

### 1.7 Bảng `inventory_units`

**File:** `backend/src/main/java/secure_shop/backend/entities/InventoryUnit.java`  
**Table:** `inventory_units`

Theo dõi từng thiết bị vật lý qua IMEI/Serial number.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `variant_id` | UUID | FK → product_variants, NOT NULL | Biến thể |
| `color_id` | UUID | FK → product_colors (nullable) | Màu sắc (tuỳ chọn) |
| `imei_serial` | VARCHAR(100) | NOT NULL, UNIQUE | IMEI / Serial number |
| `unit_status` | VARCHAR(50) | NOT NULL, default=`AVAILABLE` | Trạng thái (enum) |
| `warranty_expires_at` | DATETIME | | Hạn bảo hành |
| `notes` | NVARCHAR(MAX) | | Ghi chú (hỏng hóc, etc.) |
| `warehouse_location` | VARCHAR(100) | | Vị trí kho (VD: `Shelf A-12-3`) |
| `order_item_id` | UUID | FK → order_items (nullable) | Liên kết khi bán |
| `deleted_at` | DATETIME | | Soft delete |

**Enum `InventoryUnitStatus`:**
| Giá trị | Ý nghĩa |
|---------|---------|
| `AVAILABLE` | Sẵn có, chưa bán |
| `RESERVED` | Đang trong đơn hàng, chờ xác nhận |
| `SOLD` | Đã giao cho khách |
| `RETURNED` | Khách trả lại |
| `DAMAGED` | Hỏng |

---

## 2. Backend API Endpoints

> **Base URL:** `http://localhost:8080/api`  
> **Auth:** Tất cả endpoint viết (POST/PUT/DELETE) yêu cầu role `ADMIN`.  
> **Header:** `Authorization: Bearer <token>`

---

### 2.1 Product API – `/api/products`

| Method | Đường dẫn | Auth | Mô tả |
|--------|-----------|------|-------|
| `GET` | `/api/products` | Public | Lấy danh sách sản phẩm (phân trang, lọc) |
| `GET` | `/api/products/{id}` | Public | Lấy chi tiết đầy đủ sản phẩm (bao gồm variants, colors, attributes) |
| `GET` | `/api/products/summary/{id}` | Public | Lấy thông tin tóm tắt sản phẩm |
| `GET` | `/api/products/count` | Public | Đếm tổng số sản phẩm |
| `POST` | `/api/products` | ADMIN | Tạo sản phẩm mới |
| `PUT` | `/api/products/{id}` | ADMIN | Cập nhật sản phẩm |
| `DELETE` | `/api/products/{id}` | ADMIN | Xoá mềm sản phẩm |

**Query Params cho `GET /api/products`:**
```
?active=true
&categoryId=<Long>
&brandId=<Long>
&minPrice=<decimal>
&maxPrice=<decimal>
&inStock=true
&keyword=<string>
&page=0&size=12
```

**Request Body cho `POST/PUT /api/products`** – `ProductDetailsDTO`:
```json
{
  "name": "Camera IP 4MP Full Color",
  "sku": "CAM-4MP-FC-001",
  "listedPrice": 2500000,
  "price": 2200000,
  "active": true,
  "category": { "id": 1 },
  "brand": { "id": 2 },
  "shortDesc": "Camera giám sát 4MP Full Color ban đêm",
  "longDesc": "Mô tả chi tiết...",
  "thumbnailUrl": "https://cdn.example.com/cam-4mp.jpg",
  "mediaAssets": [
    { "url": "https://cdn.example.com/img1.jpg", "altText": "Camera mặt trước" }
  ]
}
```

---

### 2.2 Product Variant API – `/api/product-variants`

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/product-variants/product/{productId}` | Tạo biến thể mới cho sản phẩm |
| `GET` | `/api/product-variants/{variantId}` | Lấy thông tin biến thể |
| `GET` | `/api/product-variants/product/{productId}` | Lấy tất cả biến thể của sản phẩm |
| `GET` | `/api/product-variants/product/{productId}/type/{variantType}` | Lấy biến thể theo loại |
| `GET` | `/api/product-variants/product/{productId}/type/{variantType}/value/{variantValue}` | Tìm biến thể cụ thể |
| `GET` | `/api/product-variants/product/{productId}/types` | Lấy danh sách các loại biến thể |
| `PUT` | `/api/product-variants/{variantId}` | Cập nhật biến thể |
| `DELETE` | `/api/product-variants/{variantId}` | Xoá mềm biến thể |
| `POST` | `/api/product-variants/{variantId}/restore` | Khôi phục biến thể |

**Request Body `ProductVariantDTO`:**
```json
{
  "variantType": "resolution",
  "variantValue": "4MP",
  "sku": "CAM-4MP-001",
  "priceAdjustment": 300000,
  "description": "Độ phân giải 4MP Ultra HD",
  "imageUrl": "https://cdn.example.com/4mp.jpg",
  "active": true
}
```

---

### 2.3 Product Color API – `/api/product-colors`

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/product-colors/product/{productId}` | Tạo màu mới cho sản phẩm |
| `GET` | `/api/product-colors/{colorId}` | Lấy thông tin màu |
| `GET` | `/api/product-colors/product/{productId}` | Lấy tất cả màu của sản phẩm |
| `PUT` | `/api/product-colors/{colorId}` | Cập nhật màu |
| `DELETE` | `/api/product-colors/{colorId}` | Xoá mềm màu |

**Request Body `ProductColorDTO`:**
```json
{
  "colorName": "Black",
  "hexCode": "#1a1a1a",
  "imageUrl": "https://cdn.example.com/black-sample.jpg",
  "description": "Màu đen sang trọng",
  "active": true
}
```

---

### 2.4 Product Attribute API – `/api/product-attributes`

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/product-attributes/product/{productId}` | Tạo thuộc tính mới |
| `GET` | `/api/product-attributes/{attributeId}` | Lấy thuộc tính theo ID |
| `GET` | `/api/product-attributes/product/{productId}` | Lấy tất cả thuộc tính của SP |
| `GET` | `/api/product-attributes/variant/{variantId}` | Lấy thuộc tính của một biến thể |
| `PUT` | `/api/product-attributes/{attributeId}` | Cập nhật thuộc tính |
| `DELETE` | `/api/product-attributes/{attributeId}` | Xoá thuộc tính |

**Request Body `ProductAttributeDTO`:**
```json
{
  "attributeKey": "ir_range",
  "attributeName": "Tầm hồng ngoại",
  "attributeValue": "50",
  "valueType": "number",
  "unit": "m",
  "description": "Phạm vi nhìn đêm hồng ngoại"
}
```

---

### 2.5 Inventory Unit (IMEI) API – `/api/inventory-units`

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `POST` | `/api/inventory-units` | Tạo 1 unit đơn lẻ |
| `POST` | `/api/inventory-units/bulk-import` | Nhập nhiều IMEI cùng lúc |
| `POST` | `/api/inventory-units/generate-range` | Tạo dải IMEI tự động theo prefix |
| `GET` | `/api/inventory-units/{unitId}` | Lấy thông tin 1 unit |
| `GET` | `/api/inventory-units/imei/{imeiSerial}` | Tìm unit theo IMEI |
| `GET` | `/api/inventory-units/variant/{variantId}` | Lấy tất cả unit của biến thể |
| `GET` | `/api/inventory-units/variant/{variantId}/color/{colorId}` | Lọc theo variant + màu |
| `GET` | `/api/inventory-units/variant/{variantId}/available` | Lấy unit còn sẵn hàng |
| `GET` | `/api/inventory-units/variant/{variantId}/imeis` | Lấy danh sách IMEI còn sẵn |
| `GET` | `/api/inventory-units/status/{status}` | Lấy unit theo trạng thái |
| `PUT` | `/api/inventory-units/{unitId}` | Cập nhật unit |
| `PATCH` | `/api/inventory-units/{unitId}/status` | Đổi trạng thái unit |
| `PATCH` | `/api/inventory-units/{unitId}/location` | Cập nhật vị trí kho |
| `PATCH` | `/api/inventory-units/{unitId}/damage` | Đánh dấu hỏng |
| `DELETE` | `/api/inventory-units/{unitId}` | Xoá unit |
| `GET` | `/api/inventory-units/stats/variant/{variantId}` | Thống kê theo variant |
| `GET` | `/api/inventory-units/stats/status/{status}` | Thống kê theo trạng thái |

**`POST /api/inventory-units/bulk-import` – `BulkImportRequest`:**
```json
{
  "variantId": "uuid-of-variant",
  "colorId": "uuid-of-color",
  "imeiList": ["CAM-2024-001", "CAM-2024-002", "CAM-2024-003"]
}
```

**`POST /api/inventory-units/generate-range` – `GenerateRangeRequest`:**
```json
{
  "variantId": "uuid-of-variant",
  "colorId": "uuid-of-color",
  "prefix": "CAM-2024-",
  "startSequence": "001",
  "quantity": 50
}
```
> Sẽ tự động tạo: `CAM-2024-001`, `CAM-2024-002`, ..., `CAM-2024-050`

---

## 3. DTOs (Data Transfer Objects)

### DTO đầu vào/ra quan trọng

| DTO | File | Mô tả |
|----|------|-------|
| `ProductDetailsDTO` | `dto/product/ProductDetailsDTO.java` | DTO đầy đủ: bao gồm variants, colors, attributes, variantColorMappings |
| `ProductVariantDTO` | `dto/product/ProductVariantDTO.java` | Biến thể |
| `ProductColorDTO` | `dto/product/ProductColorDTO.java` | Màu sắc |
| `ProductAttributeDTO` | `dto/product/ProductAttributeDTO.java` | Thuộc tính động |
| `VariantColorMappingDTO` | `dto/product/VariantColorMappingDTO.java` | Mapping variant × color |
| `InventoryUnitDTO` | `dto/product/InventoryUnitDTO.java` | Đơn vị tồn kho IMEI |
| `BulkImportRequest` | `dto/product/request/BulkImportRequest.java` | Request nhập IMEI hàng loạt |
| `GenerateRangeRequest` | `dto/product/request/GenerateRangeRequest.java` | Request tạo dải IMEI tự động |

---

## 4. Frontend – ProductModal (Wizard 4 bước)

**File:** `frontend/src/components/admin-modal/ProductModal.tsx`

Modal thêm sản phẩm mới sử dụng **4-step wizard**. Khi **chỉnh sửa** sản phẩm, chỉ hiển thị bước 1 (thông tin cơ bản).

### 4.1 Các bước trong Wizard

| Bước | Tiêu đề | Nội dung |
|------|---------|---------|
| **Bước 1** | Cơ bản | Tên, SKU, Mã vạch, Giá, Tồn kho, Danh mục, Thương hiệu, Mô tả, Ảnh |
| **Bước 2** | Màu & Biến thể | Thêm màu sắc + biến thể (tuỳ chọn) |
| **Bước 3** | Thuộc tính | Đặc tính kỹ thuật động (tuỳ chọn) |
| **Bước 4** | Tồn kho IMEI | Nhập danh sách IMEI cho từng biến thể |

### 4.2 Auto-generate Helpers

```typescript
// Tạo SKU từ tên sản phẩm (slug hoá tiếng Việt)
generateSKU("Camera IP 4MP") → "CAMERA-IP-4MP-123"

// Tạo barcode EAN-13 hợp lệ (prefix 893 – Việt Nam)
generateBarcode() → "8938412341234X" (13 ký tự, check digit đúng)

// Tạo SKU cho biến thể
generateVariantSKU(parentSku, variantValue, index) 
→ "CAM-4MP-001-3_6MM-0"

// Tạo dải IMEI (chỉ frontend preview trước khi gửi API)
generateIMEIRange("CAM-2024-", 1, 10) 
→ ["CAM-2024-001", "CAM-2024-002", ..., "CAM-2024-010"]
```

### 4.3 State quản lý trong Modal

```typescript
// Màu sắc mới
newColors: { colorName: string, hexCode: string }[]

// Biến thể mới
newVariants: { variantType: string, variantValue: string, sku: string, priceAdjustment: number }[]

// Thuộc tính mới
newAttributes: { attributeKey: string, attributeName: string, attributeValue: string, valueType: string }[]

// IMEI cho từng biến thể (index → chuỗi IMEI cách nhau dấu phẩy)
newImeis: Record<number, string>

// Cấu hình tạo IMEI tự động
imeiGenConfig: Record<number, { prefix: string, start: number, qty: number, open: boolean }>
```

### 4.4 Luồng submit khi tạo sản phẩm mới

```
1. Upload ảnh thumbnail lên Cloudinary
2. Upload ảnh media phụ lên Cloudinary
3. POST /api/products → lấy về newProductId
4. POST /api/barcodes   (nếu có mã vạch)
5. POST /api/product-colors/product/{id}  (nếu có màu)
6. POST /api/product-variants/product/{id} (nếu có biến thể)
7. POST /api/product-attributes/product/{id} (nếu có thuộc tính)
8. POST /api/inventory-units/bulk-import (IMEI cho mỗi biến thể)
```

### 4.5 API utils đã khai báo

**File:** `frontend/src/utils/api.ts`

```typescript
productApi.create(data)         // POST /api/products
productApi.update(id, data)     // PUT  /api/products/{id}

productColorApi.create(productId, data)     // POST /api/product-colors/product/{id}
productVariantApi.create(productId, data)   // POST /api/product-variants/product/{id}
productAttributeApi.create(productId, data) // POST /api/product-attributes/product/{id}

inventoryUnitApi.bulkImport({ variantId, imeiList }) // POST /api/inventory-units/bulk-import

BarcodeApi.create({ barcode, productId }) // POST /api/barcodes
BarcodeApi.getByProduct(productId)        // GET  /api/barcodes/product/{id}
```

---

## 5. Validation Rules

### 5.1 Sản phẩm (Product)
- `sku`: NOT BLANK, tối đa 100 ký tự, chỉ `[A-Za-z0-9\-_.]`
- `name`: NOT BLANK, tối đa 255 ký tự
- `listedPrice` / `price`: NOT NULL, > 0
- `sku` **unique** ở DB level → backend trả `409 Conflict` nếu trùng

### 5.2 Biến thể (ProductVariant)
- `variantType`: NOT BLANK, ≤ 100 ký tự
- `variantValue`: NOT BLANK, ≤ 255 ký tự
- `sku`: NOT BLANK, unique, chỉ `[A-Za-z0-9\-_.]`
- `priceAdjustment`: ≥ 0

### 5.3 Màu sắc (ProductColor)
- `colorName`: NOT BLANK, ≤ 100 ký tự
- `hexCode`: NOT BLANK, đúng format `#RRGGBB` (regex: `^#[0-9A-Fa-f]{6}$`)

### 5.4 Thuộc tính (ProductAttribute)
- `attributeKey`: NOT BLANK, ≤ 100 ký tự
- `attributeName`: NOT BLANK, ≤ 100 ký tự
- `attributeValue`: NOT BLANK, ≤ 500 ký tự
- `valueType`: một trong `string`, `number`, `boolean`

### 5.5 IMEI (InventoryUnit)
- `imeiSerial`: NOT BLANK, unique, chỉ `[A-Z0-9-]+` (uppercase)
- `unitStatus`: một trong `AVAILABLE`, `RESERVED`, `SOLD`, `RETURNED`, `DAMAGED`

---

## 6. Các file liên quan

### Backend
```
backend/src/main/java/secure_shop/backend/
├── entities/
│   ├── Product.java
│   ├── ProductVariant.java
│   ├── ProductColor.java
│   ├── ProductAttribute.java
│   ├── VariantColorMapping.java
│   └── InventoryUnit.java
├── controller/
│   ├── ProductController.java
│   ├── ProductVariantController.java
│   ├── ProductColorController.java
│   ├── ProductAttributeController.java
│   └── InventoryUnitController.java
├── dto/product/
│   ├── ProductDetailsDTO.java
│   ├── ProductVariantDTO.java
│   ├── ProductColorDTO.java
│   ├── ProductAttributeDTO.java
│   ├── VariantColorMappingDTO.java
│   ├── InventoryUnitDTO.java
│   └── request/
│       ├── BulkImportRequest.java
│       └── GenerateRangeRequest.java
├── service/
│   ├── ProductService.java  (+ impl)
│   ├── ProductVariantService.java
│   ├── ProductColorService.java
│   ├── ProductAttributeService.java
│   └── InventoryUnitService.java
└── repositories/
    ├── ProductRepository.java
    └── ...
```

### Frontend
```
frontend/src/
├── components/admin-modal/
│   └── ProductModal.tsx   ← Wizard 4 bước thêm sản phẩm
├── pages/admin/
│   └── ProductDetails.tsx ← Trang chi tiết sản phẩm (admin)
└── utils/
    ├── api.ts             ← Khai báo tất cả API calls
    └── imageUploadService.ts ← Upload ảnh Cloudinary
```

---

## 7. Ghi chú & Lưu ý

> **Soft Delete:** Tất cả bảng đều dùng soft delete thông qua `deleted_at`. Hibernate tự động thêm `WHERE deleted_at IS NULL` vào mọi query nhờ `@SQLRestriction`.

> **Barcode:** Hiện tại chỉ hỗ trợ nhập/tạo mã vạch khi **tạo mới** sản phẩm. Chỉnh sửa mã vạch chưa được hỗ trợ trong UI.

> **Wizard chỉ dành cho tạo mới:** Khi edit sản phẩm, modal chỉ hiện bước 1 (thông tin cơ bản). Việc thêm/sửa variant/color sau khi tạo cần thực hiện qua API riêng hoặc trang ProductDetails.

> **IMEI Format:** Backend yêu cầu IMEI chỉ chứa `[A-Z0-9-]` (uppercase). Frontend tự động `.toUpperCase()` khi generate range.

> **VariantColorMapping:** Bảng này được tạo riêng để quản lý combo variant × color, với SKU riêng và giá điều chỉnh riêng. Hiện tại UI chưa có form tạo mapping này trực tiếp – cần gọi API thủ công hoặc mở rộng sau.
