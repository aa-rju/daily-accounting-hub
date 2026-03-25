# Backend Development Setup Guide

## Project Structure

```
your-project/
├── client/                    # React Frontend
│   ├── pages/                 # Page components
│   ├── components/            # React components
│   ├── lib/
│   │   └── api.ts            # API integration helper
│   └── App.tsx               # Route definitions
│
├── server/                    # Express Backend
│   ├── routes/
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── parties.ts        # Party management
│   │   ├── products.ts       # Product management
│   │   ├── accounts.ts       # Account management
│   │   ├── sales.ts          # Sales/Invoices
│   │   ├── purchase.ts       # Purchase orders
│   │   ├── dailyReport.ts    # Daily reports
│   │   ├── inventory.ts      # Inventory tracking
│   │   └── ledger.ts         # Party ledgers
│   ├── index.ts              # Main server file
│   └── node-build.ts         # Build config
│
├── shared/
│   └── api.ts                # Shared types (used by frontend & backend)
│
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Frontend build config
└── BACKEND_API.md            # API documentation
```

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
# This starts both frontend (port 5173) and backend (port 3000)
pnpm dev
```

### 3. Test Backend APIs
- Frontend: http://localhost:5173
- API Health Check: http://localhost:5173/api/ping
- Use REST client or Postman to test endpoints

---

## Backend Architecture

### Current State (In-Memory)
All data is stored in memory using JavaScript arrays. This is perfect for development and testing.

### What to Implement

#### 1. Database Layer
Replace in-memory arrays with actual database:

**Option A: MongoDB (Recommended for quick setup)**
```bash
pnpm add mongoose
```

**Option B: PostgreSQL**
```bash
pnpm add pg prisma
pnpm exec prisma init
```

#### 2. Example: Converting Parties Route to MongoDB

**Before (In-Memory):**
```typescript
let parties: Party[] = [];

export const getParties: RequestHandler = (req, res) => {
  // Returns from memory array
};
```

**After (MongoDB):**
```typescript
import mongoose from "mongoose";

const partySchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  type: String,
  openingBalance: Number,
});

const PartyModel = mongoose.model("Party", partySchema);

export const getParties: RequestHandler = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  
  const parties = await PartyModel.find()
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize));
  
  res.json({
    success: true,
    data: parties,
    total: await PartyModel.countDocuments(),
  });
};
```

---

## Using the API Helper

### In Your React Components

**Example: Create a new party**

```typescript
import { partyAPI } from "@/lib/api";
import { useState } from "react";

export function CreateParty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await partyAPI.create({
        name: "New Company",
        phone: "+880-1234-5678",
        address: "Dhaka",
        type: "customer",
        openingBalance: 25000,
      });

      if (result.success) {
        console.log("Party created:", result.data);
        // Refresh party list, show success message, etc.
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Party"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

**Example: Get all parties with error handling**

```typescript
import { partyAPI } from "@/lib/api";
import { useEffect, useState } from "react";

export function PartiesList() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const result = await partyAPI.getAll(1, 10, "customer");
        if (result.success) {
          setParties(result.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      {parties.map((party) => (
        <div key={party.id}>
          <h3>{party.name}</h3>
          <p>{party.phone}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## API Response Types

All responses include TypeScript types defined in `shared/api.ts`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Environment Variables

Create `.env` file in root directory:

```env
# Backend
PING_MESSAGE=Server is running
NODE_ENV=development
PORT=3000

# Database (when you add it)
MONGO_URI=mongodb://localhost:27017/business-accounting
DATABASE_URL=postgresql://user:password@localhost:5432/business-accounting

# JWT (when you add authentication)
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
```

---

## Development Workflow

### 1. Create New Route
Create file in `server/routes/`:
```typescript
// server/routes/myroute.ts
import { RequestHandler } from "express";
import { ApiResponse } from "@shared/api";

export const getMyData: RequestHandler = (req, res) => {
  // Your logic here
  res.json({ success: true, message: "Success", data: {} } as ApiResponse<any>);
};
```

### 2. Register Route in Server
```typescript
// server/index.ts
import * as myRoutes from "./routes/myroute";

// In createServer():
app.get("/api/mydata", myRoutes.getMyData);
```

### 3. Create API Helper Function
```typescript
// client/lib/api.ts
export const myDataAPI = {
  getAll: (page = 1) => apiCall<ApiListResponse<any>>(`/mydata?page=${page}`),
  // ... other CRUD methods
};
```

### 4. Use in React Component
```typescript
import { myDataAPI } from "@/lib/api";

const data = await myDataAPI.getAll(1);
```

---

## Common Issues & Fixes

### Issue: 403 Forbidden
**Solution:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Issue: CORS Errors
**Already configured in server/index.ts:**
```typescript
app.use(cors()); // Allows all origins
```

### Issue: API Returns 404
1. Check route path in `server/index.ts`
2. Verify method (GET, POST, etc.)
3. Check request URL in frontend

### Issue: Type Errors
Make sure types are exported in `shared/api.ts` and imported in components.

---

## Testing APIs Locally

### Using REST Client Extension (VS Code)

Create `api.rest` file:

```rest
### Get all parties
GET http://localhost:5173/api/parties?page=1&pageSize=10

### Create new party
POST http://localhost:5173/api/parties
Content-Type: application/json

{
  "name": "Test Company",
  "phone": "+880-1234-5678",
  "address": "Dhaka",
  "type": "customer",
  "openingBalance": 50000
}

### Get specific party
GET http://localhost:5173/api/parties/1
```

Then use the "Send Request" button above each endpoint.

---

## Next Steps for Backend Development

1. **Add Database**: MongoDB or PostgreSQL
2. **Implement Authentication**: JWT tokens, password hashing
3. **Add Validation**: Request validation middleware
4. **Error Handling**: Comprehensive error middleware
5. **Logging**: Request/response logging
6. **Testing**: Unit and integration tests with Jest
7. **Transactions**: Multi-table atomic operations (accounting requires this!)
8. **Reports**: SQL queries for complex financial reports

---

## File Structure Reference

### Adding New Entity

1. **Type Definition** → `shared/api.ts`
2. **API Routes** → `server/routes/entity.ts`
3. **Register Routes** → `server/index.ts`
4. **API Helper** → `client/lib/api.ts`
5. **React Component** → `client/pages/Entity.tsx`

---

## Debugging

### Enable Detailed Logging
```typescript
// In server/index.ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Check Network Requests
Open DevTools → Network tab → Filter by XHR

### Backend Logs
Look at terminal where you ran `pnpm dev`

---

## Database Recommendations

For accounting system, you need:
- **Relational database** (PostgreSQL recommended)
- **Transactions support** for financial operations
- **Strong data constraints** for accuracy
- **Indexes** for performance

### MongoDB vs PostgreSQL

| Feature | MongoDB | PostgreSQL |
|---------|---------|-----------|
| Transactions | ✓ (v4.0+) | ✓✓ (best) |
| ACID Compliance | ✓ | ✓✓ |
| Complex Queries | ✓ | ✓✓ |
| For Accounting | ⚠ | ✓✓ (better) |

---

## Production Deployment

### Build
```bash
pnpm build
pnpm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/accounting
JWT_SECRET=your-secure-random-key
```

---

## Support

- **API Docs**: See `BACKEND_API.md`
- **Frontend Integration**: See `client/lib/api.ts`
- **Types**: See `shared/api.ts`

Happy coding! 🚀
