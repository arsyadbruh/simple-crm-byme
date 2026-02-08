# Technical Documentation - CRM & Forecasting System

This document provides detailed technical information about the implementation, focusing on key features and patterns used in the system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Cascading Dropdowns Implementation](#cascading-dropdowns-implementation)
3. [PocketBase Integration Patterns](#pocketbase-integration-patterns)
4. [Authentication Flow](#authentication-flow)
5. [Type System](#type-system)
6. [State Management](#state-management)
7. [Key Components](#key-components)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Tech Stack Decisions

**Why Next.js 15 App Router?**
- Server-side rendering for better SEO and performance
- File-based routing with layouts
- Server actions for mutations
- React Server Components support

**Why PocketBase?**
- Self-hosted solution (data ownership)
- SQLite backend (simple, portable)
- Built-in authentication
- Real-time subscriptions
- REST API with SDK
- No need for separate backend development

**Why TanStack Query?**
- Efficient data fetching with caching
- Automatic background refetching
- Optimistic updates support
- Better than useEffect chains

### Project Structure Philosophy

```
app/           → Routes (pages)
components/    → Reusable UI components
lib/           → Utilities, contexts, types
```

**Separation of Concerns:**
- `lib/pocketbase.ts` - PocketBase client initialization
- `lib/pocketbase-types.ts` - All TypeScript types
- `lib/auth-context.tsx` - Authentication state management
- `components/` - UI components (presentational)
- `app/` - Pages and routing (container components)

---

## Cascading Dropdowns Implementation

### The Challenge

The system has a three-level hierarchy:
1. **Program** (e.g., "Digitalization")
2. **Sub Program** (e.g., "Learning Management System")
3. **Product** (e.g., "LMS Pro Package")

**Requirements:**
- Program is required
- Sub Program is optional (can be specified later)
- Product is optional (but required when closing as Won)
- Sub Programs filtered by selected Program
- Products filtered by selected Sub Program
- Must work in both Create and Edit modes

### Implementation: forecast-form-dialog.tsx

#### 1. State Management

```typescript
const [programs, setPrograms] = useState<ProgramsRecord[]>([]);
const [subPrograms, setSubPrograms] = useState<SubProgramsRecord[]>([]);
const [products, setProducts] = useState<ProductsRecord[]>([]);

const [formData, setFormData] = useState({
  program_id: '',
  sub_program_id: '',
  product_id: '',
  // ... other fields
});
```

#### 2. Data Loading

**Initial Load (on dialog open):**
```typescript
useEffect(() => {
  if (open) {
    loadInitialData();
  }
}, [open]);

const loadInitialData = async () => {
  // Load all programs (level 1)
  const programsData = await pb.collection('programs').getFullList({
    filter: 'is_active = true',
    sort: 'name',
  });
  setPrograms(programsData);
  
  // If editing, also load the nested data
  if (forecast && forecast.program_id) {
    await loadSubPrograms(forecast.program_id);
  }
};
```

#### 3. Cascading Logic

**When Program changes:**
```typescript
useEffect(() => {
  if (formData.program_id) {
    loadSubPrograms(formData.program_id);
  } else {
    setSubPrograms([]);
    setProducts([]);
  }
}, [formData.program_id]);

const loadSubPrograms = async (programId: string) => {
  const data = await pb.collection('sub_programs').getFullList({
    filter: `program_id = '${programId}' && is_active = true`,
    sort: 'name',
  });
  setSubPrograms(data);
  
  // Reset dependent fields if program changed
  if (!forecast || forecast.program_id !== programId) {
    setFormData(prev => ({ 
      ...prev, 
      sub_program_id: '', 
      product_id: '' 
    }));
  }
};
```

**When Sub Program changes:**
```typescript
useEffect(() => {
  if (formData.sub_program_id) {
    loadProducts(formData.sub_program_id);
  } else {
    setProducts([]);
  }
}, [formData.sub_program_id]);

const loadProducts = async (subProgramId: string) => {
  const data = await pb.collection('products').getFullList({
    filter: `sub_program_id = '${subProgramId}' && is_active = true`,
    sort: 'name',
  });
  setProducts(data);
  
  // Reset product if sub-program changed
  if (!forecast || forecast.sub_program_id !== subProgramId) {
    setFormData(prev => ({ ...prev, product_id: '' }));
  }
};
```

#### 4. UI Implementation

**Select Components with Dynamic States:**

```tsx
{/* Level 1: Program (Required) */}
<Select
  value={formData.program_id}
  onValueChange={(value) => setFormData({ ...formData, program_id: value })}
  required
>
  <SelectTrigger>
    <SelectValue placeholder="Select program" />
  </SelectTrigger>
  <SelectContent>
    {programs.map((program) => (
      <SelectItem key={program.id} value={program.id}>
        {program.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Level 2: Sub Program (Optional) */}
<Select
  value={formData.sub_program_id}
  onValueChange={(value) => setFormData({ ...formData, sub_program_id: value })}
  disabled={!formData.program_id || subPrograms.length === 0}
>
  <SelectTrigger>
    <SelectValue placeholder={
      !formData.program_id 
        ? 'Select program first' 
        : subPrograms.length === 0 
        ? 'No sub-programs available' 
        : 'Select sub program'
    } />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">None</SelectItem>
    {subPrograms.map((subProgram) => (
      <SelectItem key={subProgram.id} value={subProgram.id}>
        {subProgram.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

{/* Level 3: Product (Optional initially, required for closing) */}
<Select
  value={formData.product_id}
  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
  disabled={!formData.sub_program_id || products.length === 0}
>
  <SelectTrigger>
    <SelectValue placeholder={
      !formData.sub_program_id 
        ? 'Select sub program first' 
        : products.length === 0 
        ? 'No products available' 
        : 'Select product'
    } />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">None</SelectItem>
    {products.map((product) => (
      <SelectItem key={product.id} value={product.id}>
        {product.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Key Patterns Used:

1. **Conditional Disabling**: Dropdowns are disabled until parent is selected
2. **Dynamic Placeholders**: Show contextual messages based on state
3. **Reset on Change**: Clear dependent fields when parent changes
4. **Null Option**: Allow "None" selection for optional fields
5. **Edit Mode Preservation**: Pre-load existing selections when editing

---

## PocketBase Integration Patterns

### 1. Typed Client

**lib/pocketbase.ts:**
```typescript
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false); // Prevent request cancellation

export default pb;

export const Collections = {
  Users: 'users',
  Programs: 'programs',
  // ... etc
} as const;
```

### 2. Using Expand Feature

**Single Expand:**
```typescript
const forecast = await pb.collection('forecasts').getOne(id, {
  expand: 'institution_id,program_id',
});

// Access expanded data
const institutionName = forecast.expand?.institution_id?.name;
const programName = forecast.expand?.program_id?.name;
```

**Multiple Levels:**
```typescript
const product = await pb.collection('products').getOne(id, {
  expand: 'sub_program_id.program_id',
});

// Access nested data
const programName = product.expand
  ?.sub_program_id
  ?.expand
  ?.program_id
  ?.name;
```

**List with Expand:**
```typescript
const forecasts = await pb.collection('forecasts').getFullList({
  expand: 'user_id,institution_id,program_id,sub_program_id,product_id',
  sort: '-created',
  filter: 'status != "Closed Lost"',
});
```

### 3. Filtering Patterns

**Simple Filter:**
```typescript
await pb.collection('forecasts').getFullList({
  filter: `status = 'Planning'`,
});
```

**Multiple Conditions:**
```typescript
await pb.collection('forecasts').getFullList({
  filter: `user_id = '${userId}' && status = 'Planning'`,
});
```

**Relation Filter:**
```typescript
await pb.collection('sub_programs').getFullList({
  filter: `program_id = '${programId}' && is_active = true`,
});
```

### 4. Error Handling

```typescript
try {
  const record = await pb.collection('forecasts').create(data);
} catch (error: any) {
  if (error.status === 400) {
    // Validation error
    console.error('Validation failed:', error.data);
  } else if (error.status === 404) {
    // Not found
  } else {
    // Other errors
    console.error('Failed to create:', error);
  }
  throw error;
}
```

---

## Authentication Flow

### Client-Side Auth Context

**lib/auth-context.tsx:**
```typescript
export function AuthProvider({ children }) {
  const [user, setUser] = useState<UsersRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check existing auth
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model as UsersRecord);
    }
    setIsLoading(false);

    // Listen for changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model as UsersRecord | null);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setUser(authData.record as UsersRecord);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Protected Routes Pattern

```typescript
export default function ProtectedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  return <PageContent />;
}
```

---

## Type System

### Base Types

**lib/pocketbase-types.ts:**
```typescript
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

export interface ForecastsRecord extends BaseRecord {
  user_id: string;
  institution_id: string;
  program_id: string;
  sub_program_id?: string; // Optional
  product_id?: string;      // Optional
  project_title: string;
  target_amount: number;
  fix_omset?: number;       // Actual revenue when won
  status: ForecastStatus;
  // ... other fields
}
```

### Expanded Types

```typescript
export interface ForecastsExpanded extends ForecastsRecord {
  expand?: {
    user_id: UsersRecord;
    institution_id: InstitutionsRecord;
    program_id: ProgramsRecord;
    sub_program_id: SubProgramsRecord;
    product_id: ProductsRecord;
  };
}
```

### Usage in Components

```typescript
const [forecasts, setForecasts] = useState<ForecastsExpanded[]>([]);

const loadForecasts = async () => {
  const records = await pb.collection('forecasts').getFullList<ForecastsExpanded>({
    expand: 'institution_id,program_id',
  });
  setForecasts(records);
};

// Type-safe access
forecasts.map(f => (
  <div>
    <h3>{f.project_title}</h3>
    <p>{f.expand?.institution_id?.name}</p>
  </div>
));
```

---

## State Management

### TanStack Query Setup

**lib/react-query-provider.tsx:**
```typescript
export function ReactQueryProvider({ children }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Usage Pattern (Optional)

```typescript
import { useQuery } from '@tanstack/react-query';

function ForecastsList() {
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['forecasts'],
    queryFn: async () => {
      return await pb.collection('forecasts').getFullList({
        expand: 'institution_id,program_id',
      });
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return <ForecastsTable data={forecasts} />;
}
```

---

## Key Components

### 1. Navigation Component

**components/navigation.tsx:**
- Responsive navigation bar
- Mobile menu with hamburger
- User info display
- Logout button
- Active route highlighting

### 2. Forecast Form Dialog

**components/forecast-form-dialog.tsx:**
- Modal dialog for create/edit
- Cascading dropdowns implementation
- Form validation
- Handles optional fields
- Pre-fills data when editing

### 3. Close Forecast Dialog

**components/close-forecast-dialog.tsx:**
- Specialized for closing deals
- Validates required fields for Won status
- Allows product selection if not set
- Calculates actual revenue
- Sets closing date

### 4. Dashboard

**app/dashboard/page.tsx:**
- KPI cards with real-time data
- Recharts integration for monthly performance
- Program segment distribution
- Achievement rate calculation
- Quick stats summary

---

## Best Practices

### 1. PocketBase Queries

**Do:**
```typescript
// Use expand to fetch related data in one query
const records = await pb.collection('forecasts').getFullList({
  expand: 'institution_id,program_id',
});
```

**Don't:**
```typescript
// Avoid N+1 queries
const forecasts = await pb.collection('forecasts').getFullList();
for (const forecast of forecasts) {
  const institution = await pb.collection('institutions').getOne(forecast.institution_id);
}
```

### 2. Type Safety

**Do:**
```typescript
// Use typed interfaces
const forecasts = await pb.collection('forecasts').getFullList<ForecastsExpanded>();
```

**Don't:**
```typescript
// Avoid any types
const forecasts = await pb.collection('forecasts').getFullList() as any;
```

### 3. Error Handling

**Do:**
```typescript
try {
  await pb.collection('forecasts').create(data);
} catch (error) {
  console.error('Failed to create forecast:', error);
  toast.error('Failed to save. Please try again.');
}
```

**Don't:**
```typescript
// Don't swallow errors silently
await pb.collection('forecasts').create(data).catch(() => {});
```

### 4. Cascading State

**Do:**
```typescript
// Reset dependent fields when parent changes
if (formData.program_id !== previousProgramId) {
  setFormData(prev => ({ 
    ...prev, 
    sub_program_id: '', 
    product_id: '' 
  }));
}
```

**Don't:**
```typescript
// Don't leave orphaned selections
// User selects Program A → Sub Program A1 → Product A1a
// User changes to Program B
// Don't keep Sub Program A1 selected (it doesn't belong to Program B)
```

### 5. Loading States

**Do:**
```typescript
if (isLoading) return <LoadingSpinner />;
if (!data) return <EmptyState />;
return <DataDisplay data={data} />;
```

**Don't:**
```typescript
// Don't show incomplete UI
return (
  <div>
    {data && <DataDisplay data={data} />}
  </div>
);
```

---

## Performance Considerations

### 1. PocketBase Queries

- Use `getList()` with pagination for large datasets
- Use `getFullList()` only when needed (it fetches ALL records)
- Leverage filters to reduce data transfer
- Use `expand` to avoid multiple requests

### 2. React Optimization

- Use `React.memo()` for expensive components
- Implement proper key props in lists
- Avoid inline function definitions in render
- Use `useCallback` and `useMemo` appropriately

### 3. Caching Strategy

- TanStack Query provides automatic caching
- Set appropriate `staleTime` values
- Invalidate queries after mutations
- Use optimistic updates for better UX

---

## Extending the System

### Adding a New Collection

1. **Create in PocketBase Admin UI**
2. **Add TypeScript types** in `lib/pocketbase-types.ts`
3. **Add to Collections enum** in `lib/pocketbase.ts`
4. **Create CRUD pages** in `app/`
5. **Add navigation link** in `components/navigation.tsx`

### Adding a New Field to Forecast

1. **Add field in PocketBase** (forecasts collection)
2. **Update type** in `ForecastsRecord` interface
3. **Add to form** in `forecast-form-dialog.tsx`
4. **Update display** in forecast list/detail pages

---

## Common Patterns

### Loading Pattern
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('collection').getFullList();
      setData(records);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### Create/Update Pattern
```typescript
const handleSubmit = async (formData) => {
  try {
    if (editing) {
      await pb.collection('collection').update(id, formData);
    } else {
      await pb.collection('collection').create(formData);
    }
    onSuccess();
  } catch (error) {
    handleError(error);
  }
};
```

### Filter Pattern
```typescript
const [filter, setFilter] = useState<string>('All');

useEffect(() => {
  const loadData = async () => {
    const filterQuery = filter !== 'All' ? `status = '${filter}'` : '';
    const records = await pb.collection('collection').getFullList({
      filter: filterQuery,
    });
    setData(records);
  };
  loadData();
}, [filter]);
```

---

## Troubleshooting Tips

### Cascading Dropdown Not Working

**Check:**
1. Relations are properly set in PocketBase
2. `is_active` field is true
3. Filter syntax is correct
4. State updates are triggering useEffect

**Debug:**
```typescript
console.log('Programs:', programs);
console.log('Selected Program ID:', formData.program_id);
console.log('Sub Programs:', subPrograms);
```

### Type Errors

**Issue:** "Property 'expand' does not exist"
**Solution:** Use `ForecastsExpanded` instead of `ForecastsRecord`

**Issue:** "Property 'name' possibly undefined"
**Solution:** Use optional chaining: `forecast.expand?.institution_id?.name`

### Authentication Issues

**Issue:** User not persisting across refreshes
**Solution:** PocketBase authStore auto-persists to localStorage

**Issue:** 401 Unauthorized errors
**Solution:** Check PocketBase collection rules (API Rules tab)

---

This technical documentation should help developers understand and extend the system. For specific implementation details, refer to the source code files mentioned throughout this document.
