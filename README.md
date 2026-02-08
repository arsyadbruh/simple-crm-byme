# CRM & Forecasting System

A comprehensive Account-Based CRM & Forecasting System built specifically for B2B/Education sector businesses. Unlike traditional CRMs focused on random leads, this system emphasizes targeting specific Institutions (Schools/Foundations) and tracking revenue realization through a structured forecasting approach.

## 🎯 Core Concept: Account-Based Forecasting

This CRM is designed around the principle of **targeting specific accounts** (institutions) rather than chasing random leads. Sales representatives plan their monthly/weekly targets by institution, track the sales pipeline through defined stages, and ultimately close deals with actual revenue tracking.

## ✨ Key Features

### 1. **Dashboard - Command Center**
- **KPI Cards**: Compare Global Target vs Total Forecast vs Realized Revenue
- **Monthly Performance Chart**: Bar chart showing Target vs Actual Achievement over 6 months
- **Revenue Distribution**: Breakdown by Program Segment (uses Recharts)
- **Quick Stats**: Institutions count, active forecasts, total pipeline, average deal size
- **Real-time Metrics**: Achievement rate calculation and visualization

### 2. **Forecasting Module (The "Plan")**
- **Datatable View**: Group forecasts by Target Month or Status
- **Cascading Dropdowns** (Core Feature):
  - **Level 1**: Program (Required) - e.g., "Digitalization"
  - **Level 2**: Sub Program (Optional) - e.g., "Learning Management"
  - **Level 3**: Product (Optional) - e.g., "LMS Gold Package"
  - Smart filtering: Sub Programs filtered by Program, Products filtered by Sub Program
- **Optional Hierarchy**: Sales reps can start with just Program selection and specify exact Product upon closing
- **Status Management**: Planning → Approaching → Negotiation → Closed Won/Lost
- **Target Tracking**: Set target amount, month, and week for each forecast

### 3. **Closing Flow (The "Result")**
- **Structured Process**: When changing status to "Closed Won":
  - Requires `fix_omset` (Actual Revenue) input
  - Requires Product selection if not previously specified
  - Sets closing_date automatically
- **Flexibility**: Allows Sub Program/Product to be unspecified initially
- **Validation**: Ensures complete data before marking deals as won

### 4. **Institutions Management (Account-Based)**
- **Institution Profiles**: Schools, Foundations, Government entities
- **Status Tracking**: New, Existing Customer, Blacklist
- **Contact Information**: Address, phone, email, website
- **Related Data**: View all contacts, forecasts, and activities per institution
- **Quick Stats**: Total pipeline, active forecasts per institution

### 5. **Contacts Management**
- **Decision Makers**: Track key contacts per institution
- **Primary Contact**: Flag primary decision maker
- **Contact Details**: Name, job title, phone, email, WhatsApp
- **Institution Linking**: Each contact linked to parent institution

### 6. **Activity Log (The "Execution")**
- **Activity Types**: Call, Visit, Meeting, Email, WhatsApp, Other
- **Timeline View**: Chronological history of interactions per institution
- **Quick Logging**: Minimal friction for sales reps to log activities
- **Next Action**: Set follow-up dates for future activities
- **Context**: Link activities to specific forecasts or institutions

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, React 19
- **UI Library**: Shadcn/UI (Radix primitives), Tailwind CSS, Lucide React
- **Backend**: PocketBase (Self-hosted, local database)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Authentication**: PocketBase Auth with context provider

## 📊 Database Schema

The system uses PocketBase with the following collections:

### 1. **Users** (Authentication)
```typescript
- id: string
- email: string
- name: string
- role: 'Admin' | 'Manager' | 'Sales Rep'
- job_title: string
```

### 2. **Programs** (Hierarchy Level 1)
```typescript
- id: string
- name: string
- code: string
- description: string
- is_active: boolean
```

### 3. **Sub_Programs** (Hierarchy Level 2)
```typescript
- id: string
- name: string
- code: string
- program_id: relation → programs
- is_active: boolean
```

### 4. **Products** (Hierarchy Level 3)
```typescript
- id: string
- name: string
- code: string
- sub_program_id: relation → sub_programs
- price: number
- unit: string
- is_active: boolean
```

### 5. **Institutions** (Target Accounts)
```typescript
- id: string
- name: string
- type: 'School' | 'Foundation' | 'Government' | 'Private'
- status: 'New' | 'Existing Customer' | 'Blacklist'
- address, city, province: string
- phone, email, website: string
```

### 6. **Contacts** (Decision Makers)
```typescript
- id: string
- institution_id: relation → institutions
- name: string
- job_title: string
- phone, email, whatsapp: string
- is_primary: boolean
```

### 7. **Forecasts** (The Central Table)
```typescript
- id: string
- user_id: relation → users
- institution_id: relation → institutions
- program_id: relation → programs (Required)
- sub_program_id: relation → sub_programs (Optional)
- product_id: relation → products (Optional)
- project_title: string
- target_month: string (YYYY-MM)
- target_week: number (1-4)
- target_amount: number
- status: 'Planning' | 'Approaching' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
- fix_omset: number (Actual revenue when won)
- closing_date: string
```

### 8. **Activities** (CRM Logs)
```typescript
- id: string
- user_id: relation → users
- institution_id: relation → institutions
- forecast_id: relation → forecasts (Optional)
- contact_id: relation → contacts (Optional)
- activity_type: 'Call' | 'Visit' | 'Meeting' | 'Email' | 'WhatsApp'
- subject: string
- description: string
- activity_date: string
- next_action_date: string
```

### 9. **Global_Targets** (Monthly Goals)
```typescript
- id: string
- year: number
- month: number
- target_revenue: number
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PocketBase (Download from [pocketbase.io](https://pocketbase.io))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arsyadbruh/simple-crm-byme.git
cd simple-crm-byme
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PocketBase**

Download and extract PocketBase, then run:
```bash
./pocketbase serve
```

Access the PocketBase Admin UI at `http://127.0.0.1:8090/_/`

4. **Import Database Schema**

The project includes `pb_schema.json` file. Import it in PocketBase Admin UI:
- Go to Settings → Import collections
- Upload the `pb_schema.json` file
- This will create all necessary collections with proper relationships

5. **Configure Environment Variables**

Create a `.env.local` file:
```bash
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

6. **Create Initial Data (Optional)**

In PocketBase Admin UI, create:
- At least one user account (for login)
- Sample programs (e.g., "Digitalization", "Training")
- Sample sub-programs and products
- Sample institutions
- Monthly global targets

7. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
simple-crm-byme/
├── app/
│   ├── dashboard/              # Dashboard with KPIs and charts
│   ├── forecasts/              # Forecast list with cascading forms
│   ├── institutions/           # Institution management
│   │   └── [id]/              # Institution detail page
│   ├── contacts/               # Contact management
│   ├── activities/             # Activity log timeline
│   ├── login/                  # Login page
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home redirect page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Shadcn/UI components
│   ├── navigation.tsx         # Main navigation bar
│   ├── forecast-form-dialog.tsx  # Forecast create/edit with cascading
│   └── close-forecast-dialog.tsx # Deal closing flow
├── lib/
│   ├── pocketbase.ts          # PocketBase client & utilities
│   ├── pocketbase-types.ts    # TypeScript type definitions
│   ├── auth-context.tsx       # Authentication context
│   ├── react-query-provider.tsx # TanStack Query setup
│   └── utils.ts               # Utility functions
├── pb_schema.json             # PocketBase collection schema
└── README.md                  # This file
```

## 🎨 Key UI Components

### Cascading Dropdown Implementation
The cascading dropdown is implemented in [forecast-form-dialog.tsx](components/forecast-form-dialog.tsx):

```typescript
// When Program changes, load Sub Programs
useEffect(() => {
  if (formData.program_id) {
    loadSubPrograms(formData.program_id);
  }
}, [formData.program_id]);

// When Sub Program changes, load Products
useEffect(() => {
  if (formData.sub_program_id) {
    loadProducts(formData.sub_program_id);
  }
}, [formData.sub_program_id]);
```

### PocketBase Expand Feature
```typescript
// Fetch forecasts with all related data
const forecasts = await pb.collection('forecasts').getFullList({
  expand: 'user_id,institution_id,program_id,sub_program_id,product_id',
  sort: '-created',
});

// Access expanded data
forecast.expand?.institution_id?.name  // Institution name
forecast.expand?.program_id?.name      // Program name
```

## 🔐 Authentication

The system uses PocketBase authentication with role-based access:
- Login page at `/login`
- Auth context provider tracks user state
- Protected routes redirect to login if not authenticated
- User roles: Admin, Manager, Sales Rep

## 📈 Business Flow

1. **Planning Phase**
   - Sales rep identifies target institution
   - Creates forecast with Program selection
   - Sets target amount and month
   - Status: "Planning"

2. **Execution Phase**
   - Updates status to "Approaching"
   - Logs activities (calls, visits, meetings)
   - Moves to "Negotiation"
   - Optionally specifies Sub Program/Product

3. **Closing Phase**
   - Uses "Close Deal" dialog
   - Selects "Closed Won" or "Closed Lost"
   - For Won: Enters actual revenue and selects Product
   - System records closing_date

4. **Reporting**
   - Dashboard shows achievement vs target
   - Monthly charts track performance
   - Revenue distribution by program segment

## 🛠️ Development

### Available Scripts
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Adding New Features

The modular structure makes it easy to extend:
- Add new pages in `app/` directory
- Create new components in `components/`
- Define new types in `lib/pocketbase-types.ts`
- Add collections in PocketBase Admin UI

## 🔄 Data Flow

1. **Client-side**: React components with TanStack Query
2. **PocketBase SDK**: Direct API calls with TypeScript types
3. **Real-time**: PocketBase provides real-time subscriptions (optional)
4. **Expansion**: Use `expand` parameter to fetch related data in single query

## 🎯 Why Account-Based?

Traditional CRMs focus on individual leads, but in B2B/Education:
- Decisions are made by institutions, not individuals
- Sales cycles are longer and relationship-driven
- Multiple contacts per account (decision makers)
- Forecasting by account provides better revenue visibility
- Activities are tracked per institution, not per lead

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.