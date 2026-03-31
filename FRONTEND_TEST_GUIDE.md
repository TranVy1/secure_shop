# Frontend Testing Guide - Product Variant/Color/Attribute Management

## 🔧 Issues Fixed
- **Fixed API Path Error**: Removed duplicate `/api` prefix from all new endpoints
  - Before: `/api/product-variants/...` (caused 500 error due to `/api/api/...`)
  - After: `/product-variants/...` (correct path)

## ✅ Testing Checklist

### Step 1: Verify Backend is Running
```bash
# Check if backend is available at port 8090
http://localhost:8090/swagger-ui.html
```
- Backend should be running on port 8090
- Check if these endpoints exist in Swagger:
  - `/api/product-variants/**`
  - `/api/product-colors/**`
  - `/api/product-attributes/**`
  - `/api/inventory-units/**`

### Step 2: Start Frontend Development Server
```bash
cd frontend
npm run dev
```
- Frontend runs on: `http://localhost:5173`
- Leave running in background

### Step 3: Navigate to Admin Product Management

1. **Go to Admin Dashboard**
   - URL: `http://localhost:5173/admin`
   - Click on "Sản phẩm" in sidebar

2. **Select a Product**
   - Click on any product in the table
   - Should show product details

3. **Click Settings Button (⚙️)**
   - Located in the Actions column
   - Should navigate to: `/admin/products/{productId}/details`

### Step 4: Test Each Tab

#### 🔄 Tab 1: Biến thể (Variants)
**Expected Behavior:**
- Show list of product variants
- Able to:
  - ✅ Click "Thêm biến thể" (Add variant)
  - ✅ Enter variant type (e.g., "resolution")
  - ✅ Enter variant value (e.g., "4MP")
  - ✅ Enter SKU
  - ✅ Set price adjustment
  - ✅ Upload optional image
  - ✅ Click "Lưu" to save
  - ✅ See success toast: "Thêm biến thể thành công!"
  - ✅ Edit existing variant (pencil icon)
  - ✅ Delete variant (trash icon)

**If 500 Error occurs:**
- Check browser console for exact path being called
- Verify backend has `/api/product-variants/product/{productId}` endpoint
- Ensure JWT token is valid in localStorage

#### 🎨 Tab 2: Màu sắc (Colors)
**Expected Behavior:**
- Show grid view of product colors
- Each color card shows:
  - Color hex code preview box
  - Color name
  - Color sample image (if exists)
- Able to:
  - ✅ Click "Thêm màu sắc" (Add color)
  - ✅ Enter color name
  - ✅ Enter hex code (#XXXXXX)
  - ✅ See live color preview
  - ✅ Enter description
  - ✅ Toggle active status
  - ✅ Upload color sample image
  - ✅ Click "Lưu" to save
  - ✅ Edit color (pencil icon)
  - ✅ Delete color (trash icon)

#### 📋 Tab 3: Thuộc tính (Attributes)
**Expected Behavior:**
- Show table of product attributes
- Columns: Khóa, Tên, Giá trị, Loại, Đơn vị, Thao tác
- Able to:
  - ✅ Click "Thêm thuộc tính" (Add attribute)
  - ✅ Enter attribute key (e.g., "resolution")
  - ✅ Enter attribute name (e.g., "Độ phân giải")
  - ✅ Enter attribute value (e.g., "4MP")
  - ✅ Select value type (Văn bản, Số, Boolean, Lựa chọn)
  - ✅ Enter unit (e.g., "MP", "m", "GB")
  - ✅ Click "Lưu" to save
  - ✅ Edit attribute (pencil icon)
  - ✅ Delete attribute (trash icon)

#### 📦 Tab 4: Kho hàng (Inventory/IMEI)
**Expected Behavior:**
- Click "Nhập IMEI" button
- Modal opens with 2 modes:

**Mode 1: Nhập danh sách (Bulk Import)**
- Select variant from dropdown
- Optionally select color
- Paste IMEI list (one per line)
- Click "Nhập IMEI"
- Should show success message

**Mode 2: Tự động tạo (Auto-generate)**
- Select variant from dropdown
- Enter prefix (e.g., "CAM-2024-")
- Enter start sequence (default: 1)
- Enter quantity (default: 100)
- Preview shows: "Sẽ tạo IMEI từ CAM-2024-001 đến CAM-2024-100"
- Click "Tạo IMEI"
- Should show success message

## 🐛 Common Issues & Solutions

### Issue 1: 500 Error when loading tab
**Cause:** Backend endpoint not implemented or API path incorrect
**Solution:**
1. Check browser Console → Network tab
2. Look at failing request URL
3. Verify in backend that endpoint exists
4. Check API path has correct format (no double `/api/api`)

### Issue 2: Modal not opening
**Cause:** Form validation failing
**Solution:**
- Check browser console for errors
- Ensure all required fields marked with * are filled
- Try with simple test data first

### Issue 3: Image upload failing
**Cause:** File too large or backend upload endpoint down
**Solution:**
- Ensure file < 5MB
- Use JPG/PNG/WebP format only
- Check backend has `/api/upload/image` endpoint

### Issue 4: Token expiration during testing
**Cause:** JWT token expired
**Solution:**
- Log out and log back in
- Or refresh the admin page
- Check localStorage for `accessToken`

## 📊 Expected API Paths

All calls should go to backend at `http://localhost:12345/api` (or your configured URL):

```
GET    /api/product-variants/product/{productId}
POST   /api/product-variants/product/{productId}
GET    /api/product-variants/{variantId}
PUT    /api/product-variants/{variantId}
DELETE /api/product-variants/{variantId}

GET    /api/product-colors/product/{productId}
POST   /api/product-colors/product/{productId}
GET    /api/product-colors/{colorId}
PUT    /api/product-colors/{colorId}
DELETE /api/product-colors/{colorId}

GET    /api/product-attributes/product/{productId}
POST   /api/product-attributes/product/{productId}
GET    /api/product-attributes/{attributeId}
PUT    /api/product-attributes/{attributeId}
DELETE /api/product-attributes/{attributeId}

POST   /api/inventory-units/bulk-import
POST   /api/inventory-units/generate-range
GET    /api/inventory-units/variant/{variantId}
GET    /api/inventory-units/variant/{variantId}/imeis
```

## 🧪 Test Data

### Sample Variant
```json
{
  "variantType": "resolution",
  "variantValue": "4MP",
  "sku": "CAM-4MP-001",
  "priceAdjustment": 500000
}
```

### Sample Color
```json
{
  "colorName": "Black",
  "hexCode": "#000000",
  "description": "Classic black color",
  "active": true
}
```

### Sample Attribute
```json
{
  "attributeKey": "resolution",
  "attributeName": "Độ phân giải",
  "attributeValue": "4MP",
  "valueType": "string",
  "unit": "MP"
}
```

### Sample IMEI List
```
CAM-2024-001
CAM-2024-002
CAM-2024-003
CAM-2024-004
CAM-2024-005
```

## ✅ Success Indicators

1. ✅ All tabs load without errors
2. ✅ Can add new variants/colors/attributes
3. ✅ Can edit existing items
4. ✅ Can delete items (with confirmation)
5. ✅ Can upload images (for variants & colors)
6. ✅ Form validation works (required fields highlighted)
7. ✅ Toast notifications show success/error messages
8. ✅ IMEI import/generation completes
9. ✅ Browser console has no 400/500 errors
10. ✅ All forms are responsive on mobile

## 🚀 Performance Notes

- Page loads variant/color/attribute data on tab switch
- Modal forms validate in real-time
- Image uploads may take 2-3 seconds
- Large IMEI lists (1000+) may take 5-10 seconds
- All operations show loading spinners

## 📝 Browser DevTools Debugging

### View Network Requests:
1. Press F12 → Network tab
2. Each successful request should show:
   - Status: 200 (success) or 201 (created)
   - Content-Type: application/json
   - Response shows created/updated item

### Check Storage:
1. Press F12 → Application/Storage tab
2. LocalStorage should contain:
   - `accessToken` - JWT token (if logged in)
   - `refreshToken`

### Monitor Console:
1. Press F12 → Console tab
2. Should show:
   - No red errors
   - Success messages like "Cập nhật thành công!"
   - Any API errors will show AxiosError details

## 📞 Support

If you encounter issues:
1. Check browser console for error details
2. Check backend logs for 500 errors
3. Compare request URL with expected paths
4. Verify JWT token is valid
5. Try clearing browser cache (Ctrl+Shift+Delete)
