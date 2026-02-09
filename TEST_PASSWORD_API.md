# Test Password API

> **⚠️ QUAN TRỌNG:** Endpoint này chỉ chấp nhận **POST** method, KHÔNG phải GET!
> 
> ❌ Không được mở trong browser (browser dùng GET)
> 
> ✅ Phải dùng: curl, Postman, Thunder Client, hoặc công cụ API client khác

## 1. Test nếu password khớp với hash trong DB

### Cách 1: PowerShell (Windows)
```powershell
$body = @{
    email = "admin2@secureshop.vn"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8090/api/debug/test-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Cách 2: Git Bash / Linux / Mac
```bash
curl -X POST http://localhost:8090/api/debug/test-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin2@secureshop.vn", "password": "admin123"}'
```

**Response mong đợi:**
```json
{
  "email": "admin2@secureshop.vn",
  "password_input": "admin123",
  "found": true,
  "user_id": "...",
  "user_name": "Admin SecureShop",
  "enabled": true,
  "role": "ADMIN",
  "provider": "local",
  "stored_hash": "$2a$10$...",
  "hash_length": 60,
  "hash_prefix": "$2a$10$92IXUNpkjO0rO",
  "password_matches": true,  // ← Phải là TRUE
  "new_hash_for_this_password": "$2a$10$...",
  "new_hash_matches": true,
  "message": "✅ Password ĐÚNG! Login should work!"
}
```

## 2. Reset password qua API

**Request:**
```bash
curl -X POST http://localhost:8090/api/debug/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin2@secureshop.vn\", \"newPassword\": \"admin123\"}"
```

**Response:**
```json
{
  "message": "✅ Password đã được reset",
  "email": "admin2@secureshop.vn",
  "new_hash": "$2a$10$..."
}
```

## Hoặc test bằng Postman / Thunder Client

1. Mở Postman hoặc Thunder Client (VS Code extension)
2. Tạo request mới: **POST** http://localhost:8090/api/debug/test-password
3. Headers: Content-Type: application/json
4. Body (raw JSON):
   ```json
   {
     "email": "admin2@secureshop.vn",
     "password": "admin123"
   }
   ```
5. Send và xem response
