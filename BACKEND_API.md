# Backend API Documentation

## Overview
Complete REST API for the Universal Business Accounting System. Built with Express.js and TypeScript.

## Base URL
```
http://localhost:3000 (production)
http://localhost:5173 (development - proxied through Vite)
```

## Response Format
All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## Authentication Routes

### POST /api/auth/login
Login user with credentials.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "1",
    "email": "demo@example.com",
    "name": "Demo User"
  }
}
```

### POST /api/auth/logout
Logout user.

---

## Party Management Routes

### GET /api/parties
Get all parties (customers & suppliers).

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `type` (optional: 'customer', 'supplier', 'both')

**Response:**
```json
{
  "success": true,
  "message": "Parties retrieved successfully",
  "data": [
    {
      "id": "1",
      "name": "ABC Corporation",
      "phone": "+880-1234-5678",
      "address": "Dhaka",
      "type": "customer",
      "openingBalance": 50000,
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2024-03-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10
}
```

### GET /api/parties/:id
Get single party by ID.

### POST /api/parties
Create new party.

**Request:**
```json
{
  "name": "New Company",
  "phone": "+880-1234-5678",
  "address": "Dhaka, Bangladesh",
  "type": "customer",
  "openingBalance": 25000
}
```

### PUT /api/parties/:id
Update party details.

### DELETE /api/parties/:id
Delete party.

---

## Product Management Routes

### GET /api/products
Get all products.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `category` (optional)

### GET /api/products/:id
Get single product.

### POST /api/products
Create new product.

**Request:**
```json
{
  "name": "Cement Bag 50kg",
  "category": "Building Materials",
  "unit": "Bag",
  "price": 450,
  "trackStock": true
}
```

### PUT /api/products/:id
Update product.

### DELETE /api/products/:id
Delete product.

---

## Account Management Routes

### GET /api/accounts
Get all accounts (Cash, Bank, Wallet).

### GET /api/accounts/:id
Get single account.

### POST /api/accounts
Create new account.

**Request:**
```json
{
  "name": "Main Cash",
  "type": "cash",
  "openingBalance": 100000,
  "currency": "BDT"
}
```

### PUT /api/accounts/:id
Update account.

### DELETE /api/accounts/:id
Delete account.

---

## Sales/Invoice Routes

### GET /api/sales
Get all invoices.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `status` (optional: 'draft', 'sent', 'paid')
- `partyId` (optional)

### GET /api/sales/:id
Get single invoice.

### POST /api/sales
Create new invoice.

**Request:**
```json
{
  "billNumber": "INV-001",
  "partyId": "1",
  "date": "2024-03-15",
  "items": [
    {
      "productId": "1",
      "productName": "Cement Bag 50kg",
      "quantity": 100,
      "rate": 450,
      "amount": 45000
    }
  ],
  "paymentMethod": "Bank Transfer",
  "taxPercentage": 15
}
```

### PUT /api/sales/:id
Update invoice (change status).

### DELETE /api/sales/:id
Delete invoice.

---

## Purchase Routes

### GET /api/purchases
Get all purchases.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `status` (optional: 'draft', 'received', 'paid')
- `supplierId` (optional)

### GET /api/purchases/:id
Get single purchase.

### POST /api/purchases
Create new purchase.

**Request:**
```json
{
  "purchaseNumber": "PUR-001",
  "supplierId": "2",
  "date": "2024-03-15",
  "items": [
    {
      "productId": "1",
      "productName": "Cement Bag 50kg",
      "quantity": 100,
      "rate": 420,
      "amount": 42000
    }
  ],
  "paymentMethod": "Bank Transfer",
  "taxPercentage": 15
}
```

### PUT /api/purchases/:id
Update purchase.

### DELETE /api/purchases/:id
Delete purchase.

---

## Daily Report Routes

### GET /api/daily-reports
Get all daily reports.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `startDate` (optional: YYYY-MM-DD)
- `endDate` (optional: YYYY-MM-DD)

### GET /api/daily-reports/:date
Get daily report for specific date (YYYY-MM-DD).

### POST /api/daily-reports
Create daily report.

**Request:**
```json
{
  "date": "2024-03-15",
  "openingCashBalance": 100000,
  "bankDeposits": 50000,
  "expenses": [
    {
      "description": "Office Supplies",
      "amount": 5000,
      "category": "Supplies"
    }
  ],
  "advancesPaid": 10000,
  "cashReceived": 25000,
  "onlineBankTransfer": 15000,
  "creditSales": 30000
}
```

**Auto-calculated fields:**
- `totalExpenses`: Sum of all expenses
- `totalIncome`: Sum of income sources
- `closingBalance`: Opening + Income - Expenses - Advances

### PUT /api/daily-reports/:date
Update daily report.

### DELETE /api/daily-reports/:date
Delete daily report.

---

## Inventory Routes

### GET /api/inventory
Get all inventory items.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)
- `date` (optional: YYYY-MM-DD)
- `productId` (optional)

### GET /api/inventory/:id
Get single inventory item.

### POST /api/inventory
Create inventory entry.

**Request:**
```json
{
  "productId": "1",
  "openingStock": 500,
  "production": 200,
  "sales": 150
}
```

**Auto-calculated:**
- `closingStock`: Opening + Production - Sales

### PUT /api/inventory/:id
Update inventory item.

### DELETE /api/inventory/:id
Delete inventory item.

---

## Ledger Routes

### GET /api/ledger
Get all party ledgers with pagination.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 10)

### GET /api/ledger/:partyId
Get ledger for specific party.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "message": "Party ledger retrieved successfully",
  "data": {
    "partyId": "1",
    "partyName": "ABC Corporation",
    "entries": [
      {
        "id": "1",
        "partyId": "1",
        "partyName": "ABC Corporation",
        "date": "2024-03-15",
        "description": "Invoice INV-001",
        "debit": 51750,
        "credit": 0,
        "balance": 51750,
        "type": "invoice"
      }
    ],
    "totalDebit": 51750,
    "totalCredit": 25000,
    "closingBalance": 26750
  }
}
```

### POST /api/ledger
Create ledger entry (manual entry).

**Request:**
```json
{
  "partyId": "1",
  "partyName": "ABC Corporation",
  "date": "2024-03-15",
  "description": "Manual entry",
  "debit": 10000,
  "credit": 0,
  "type": "manual"
}
```

### DELETE /api/ledger/:id
Delete ledger entry.

---

## Integration Guide

### Frontend to Backend Communication

**In your React components, use fetch or axios:**

```typescript
// Example: Get all parties
const response = await fetch('/api/parties?page=1&pageSize=10');
const result = await response.json();

if (result.success) {
  setParties(result.data);
}
```

### Setup Mock Data

The backend uses in-memory mock data. Replace with database:

1. Install database package (e.g., MongoDB, PostgreSQL)
2. Replace mock arrays with database queries
3. Update type definitions if needed

### Error Handling

```typescript
try {
  const response = await fetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partyData),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Operation failed');
  }

  return result.data;
} catch (error) {
  console.error('API Error:', error);
  // Handle error
}
```

---

## Environment Variables

Create `.env` file:

```env
PING_MESSAGE=Server is running
NODE_ENV=development
PORT=3000
```

---

## Running Backend

```bash
# Development with hot reload
pnpm dev

# Production build
pnpm build
pnpm start

# Type checking
pnpm typecheck
```

---

## Database Integration TODO

1. **Authentication**: Add JWT tokens and password hashing
2. **Database**: Connect MongoDB/PostgreSQL instead of in-memory arrays
3. **Validation**: Add request validation middleware
4. **Error Handling**: Add comprehensive error handling
5. **Logging**: Add logging for debugging
6. **Testing**: Add unit and integration tests
7. **Pagination**: Implement proper database pagination
8. **Transactions**: Handle multi-table operations atomically

---

## API Testing

Use tools like:
- Postman
- REST Client VS Code Extension
- Thunder Client
- Insomnia

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error
