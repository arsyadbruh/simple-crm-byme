# CRM & Forecasting System - Setup Guide

This guide will walk you through setting up the complete CRM & Forecasting System from scratch.

## Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Git** installed
- **PocketBase** downloaded ([Download](https://pocketbase.io/docs/))

## Step-by-Step Setup

### 1. Project Setup

#### 1.1 Clone the Repository
```bash
git clone https://github.com/arsyadbruh/simple-crm-byme.git
cd simple-crm-byme
```

#### 1.2 Install Dependencies
```bash
npm install
```

This will install:
- Next.js 15 & React 19
- TanStack Query (React Query)
- React Hook Form & Zod
- Recharts
- Shadcn/UI components
- PocketBase SDK
- And all other dependencies

### 2. PocketBase Setup

#### 2.1 Download and Extract PocketBase

**For Windows:**
1. Download `pocketbase_windows_amd64.zip` from [pocketbase.io](https://pocketbase.io/docs/)
2. Extract to a folder (e.g., `C:\PocketBase\`)
3. Open Command Prompt in that folder

**For macOS:**
```bash
# Download
wget https://github.com/pocketbase/pocketbase/releases/download/v0.x.x/pocketbase_darwin_amd64.zip
unzip pocketbase_darwin_amd64.zip
```

**For Linux:**
```bash
# Download
wget https://github.com/pocketbase/pocketbase/releases/download/v0.x.x/pocketbase_linux_amd64.zip
unzip pocketbase_linux_amd64.zip
```

#### 2.2 Run PocketBase

**Windows:**
```cmd
pocketbase.exe serve
```

**macOS/Linux:**
```bash
./pocketbase serve
```

You should see:
```
Server started at: http://127.0.0.1:8090
  - REST API: http://127.0.0.1:8090/api/
  - Admin UI: http://127.0.0.1:8090/_/
```

#### 2.3 Create Admin Account

1. Open your browser and go to `http://127.0.0.1:8090/_/`
2. Create an admin email and password
3. Click "Create and Login"

#### 2.4 Import Database Schema

The project includes a `pb_schema.json` file with all the necessary collections.

**Option A: Import via UI (Recommended)**
1. In PocketBase Admin UI, go to **Settings** (gear icon)
2. Click **"Import collections"**
3. Click **"Load from JSON file"**
4. Select `pb_schema.json` from the project root
5. Review the collections
6. Click **"Confirm and import"**

**Option B: Manual Creation**

If import doesn't work, you'll need to create these collections manually:

1. **users** (already exists - just add custom field):
   - Add field: `job_title` (Text, optional)

2. **programs**:
   - `name` (Text, required)
   - `code` (Text, optional)
   - `description` (Editor, optional)
   - `is_active` (Bool, default: true)

3. **sub_programs**:
   - `name` (Text, required)
   - `code` (Text, optional)
   - `program_id` (Relation to programs, required)
   - `description` (Text, optional)
   - `is_active` (Bool, default: true)

4. **products**:
   - `name` (Text, required)
   - `code` (Text, optional)
   - `sub_program_id` (Relation to sub_programs, required)
   - `price` (Number, optional)
   - `unit` (Text, optional)
   - `description` (Text, optional)
   - `is_active` (Bool, default: true)

5. **institutions**:
   - `name` (Text, required)
   - `type` (Select: School, Foundation, Government, Private, Other)
   - `status` (Select: New, Existing Customer, Blacklist)
   - `address`, `city`, `province` (Text, all optional)
   - `phone`, `email`, `website` (Text, all optional)
   - `notes` (Editor, optional)

6. **contacts**:
   - `institution_id` (Relation to institutions, required)
   - `name` (Text, required)
   - `job_title` (Text, optional)
   - `phone`, `email`, `whatsapp` (Text, all optional)
   - `is_primary` (Bool, default: false)
   - `notes` (Text, optional)

7. **forecasts**:
   - `user_id` (Relation to users, required)
   - `institution_id` (Relation to institutions, required)
   - `program_id` (Relation to programs, required)
   - `sub_program_id` (Relation to sub_programs, optional)
   - `product_id` (Relation to products, optional)
   - `project_title` (Text, required)
   - `target_month` (Text, required, format: YYYY-MM)
   - `target_week` (Number, optional, 1-4)
   - `target_amount` (Number, required)
   - `status` (Select: Planning, Approaching, Negotiation, Closed Won, Closed Lost)
   - `fix_omset` (Number, optional - actual revenue)
   - `closing_date` (Date, optional)
   - `probability` (Number, optional, 0-100)
   - `notes` (Editor, optional)

8. **activities**:
   - `user_id` (Relation to users, required)
   - `institution_id` (Relation to institutions, required)
   - `forecast_id` (Relation to forecasts, optional)
   - `contact_id` (Relation to contacts, optional)
   - `activity_type` (Select: Call, Visit, Meeting, Email, WhatsApp, Other)
   - `subject` (Text, required)
   - `description` (Editor, optional)
   - `activity_date` (Date, required)
   - `next_action_date` (Date, optional)

9. **global_targets**:
   - `year` (Number, required)
   - `month` (Number, required, 1-12)
   - `target_revenue` (Number, required)
   - `description` (Text, optional)

#### 2.5 Create Sample Data

To test the system, create some sample data:

**1. Create a User (Sales Rep)**
- Go to Users collection
- Click "New record"
- Set email, password, name
- Set role to "Sales Rep"
- Save

**2. Create Programs**
- Go to programs collection
- Add programs like:
  - "Digitalization" (code: DIG)
  - "Training & Development" (code: TRN)
  - "Consulting Services" (code: CON)

**3. Create Sub Programs** (for each program)
For "Digitalization":
  - "Learning Management System" (code: LMS)
  - "School Information System" (code: SIS)
  - "E-Library" (code: ELIB)

**4. Create Products** (for each sub program)
For "Learning Management System":
  - "LMS Basic Package" (price: 50000000)
  - "LMS Pro Package" (price: 100000000)
  - "LMS Enterprise Package" (price: 200000000)

**5. Create Institutions**
- "SMA Negeri 1 Jakarta" (type: School, status: New)
- "Universitas Indonesia" (type: School, status: Existing Customer)
- "Yayasan Pendidikan ABC" (type: Foundation, status: New)

**6. Create Global Targets**
For each month of 2026:
- January 2026: 500,000,000
- February 2026: 600,000,000
- etc.

### 3. Environment Configuration

#### 3.1 Create Environment File

In the project root, the `.env.local` file should already exist with:
```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

If it doesn't exist, create it with the above content.

#### 3.2 Verify Configuration

Ensure:
- PocketBase is running on port 8090
- URL matches in `.env.local`
- You can access PocketBase Admin UI

### 4. Run the Application

#### 4.1 Start Development Server
```bash
npm run dev
```

You should see:
```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in Xms
```

#### 4.2 Access the Application

Open your browser and navigate to: `http://localhost:3000`

You'll be redirected to `/login`

### 5. First Login

#### 5.1 Create User Account

Since this is the first login, you'll need a user account in the `users` collection:

1. Go to PocketBase Admin UI: `http://127.0.0.1:8090/_/`
2. Navigate to **Collections** → **users**
3. Click **"New record"**
4. Fill in:
   - **email**: `sales@company.com`
   - **password**: `password123` (or your choice)
   - **passwordConfirm**: (same as password)
   - **name**: `Sales Rep`
   - **role**: `Sales Rep` (or Admin)
   - **job_title**: `Senior Sales Executive`
5. Click **Save**

#### 5.2 Login to CRM

1. Go back to `http://localhost:3000`
2. Enter the credentials:
   - Email: `sales@company.com`
   - Password: `password123`
3. Click **Sign in**

You'll be redirected to `/dashboard`

## 6. Using the System

### 6.1 Dashboard Overview

The dashboard shows:
- **Global Target**: Monthly revenue goal
- **Total Forecast**: Sum of active forecasts (Planning + Approaching + Negotiation)
- **Realized Revenue**: Sum of Closed Won forecasts
- **Achievement**: Percentage of target met
- **Monthly Chart**: Last 6 months performance
- **Program Distribution**: Revenue breakdown by program

### 6.2 Creating Your First Forecast

1. Click **"Forecasts"** in the navigation
2. Click **"New Forecast"** button
3. Fill in the form:
   - **Institution**: Select an institution
   - **Project Title**: e.g., "LMS Implementation for School X"
   - **Program**: Select a program (Required)
   - **Sub Program**: Optional - can be filled later
   - **Product**: Optional - can be filled later
   - **Target Month**: Select month (e.g., 2026-03)
   - **Target Week**: Optional (1-4)
   - **Target Amount**: e.g., 100000000
   - **Status**: Planning (default)
4. Click **"Create Forecast"**

### 6.3 The Cascading Dropdown Feature

When creating a forecast:
1. Select **Program** → This enables Sub Program dropdown
2. Sub Programs are filtered to show only those under selected Program
3. Select **Sub Program** → This enables Product dropdown
4. Products are filtered to show only those under selected Sub Program

**Why Optional?**
- Sales reps might only know the Program category initially
- They can specify exact Product later when closing the deal
- Provides flexibility in the sales process

### 6.4 Closing a Deal

1. Go to **Forecasts** page
2. Find a forecast with status other than Closed
3. Click **"Close Deal"** button
4. In the dialog:
   - **Status**: Select "Closed Won" or "Closed Lost"
   - If **Closed Won**:
     - Enter **Actual Revenue** (fix_omset)
     - Select **Product** if not already specified
     - Set **Closing Date**
   - Add **Closing Notes**
5. Click **"Mark as Closed Won"**

### 6.5 Managing Institutions

1. Go to **Institutions** page
2. Click **"New Institution"**
3. Fill in details:
   - Name, Type, Status
   - Contact information
   - Address details
4. Save
5. Click on an institution to view:
   - Contact list
   - Related forecasts
   - Activity timeline
   - Quick stats

### 6.6 Logging Activities

1. Go to **Activities** page
2. Click **"Log Activity"**
3. Select:
   - Activity Type (Call, Visit, Meeting, etc.)
   - Institution
   - Contact (optional)
   - Subject and Description
   - Activity Date
   - Next Action Date (for follow-up)
4. Save

## 7. Production Deployment

### 7.1 Build for Production
```bash
npm run build
```

### 7.2 Start Production Server
```bash
npm start
```

### 7.3 PocketBase Production

For production:
1. Host PocketBase on a server (VPS, cloud, etc.)
2. Use a domain with HTTPS
3. Update `.env.local` with production URL:
   ```env
   NEXT_PUBLIC_POCKETBASE_URL=https://api.yourcompany.com
   ```
4. Configure PocketBase backups
5. Set up proper authentication rules

## 8. Troubleshooting

### Issue: "Failed to fetch"
**Solution**: Ensure PocketBase is running on port 8090

### Issue: "Authentication required"
**Solution**: Create a user account in PocketBase Admin UI

### Issue: "Collection not found"
**Solution**: Import `pb_schema.json` or create collections manually

### Issue: Cascading dropdown not working
**Solution**: 
- Check that sub_programs have `program_id` set
- Check that products have `sub_program_id` set
- Verify `is_active` is true for all items

### Issue: Dashboard shows zero data
**Solution**:
- Create global targets in PocketBase
- Create at least one forecast
- Mark at least one forecast as "Closed Won"

## 9. Next Steps

1. **Customize**: Modify the code to fit your specific needs
2. **Add Features**: Extend with additional functionality
3. **Integrate**: Connect with other systems via PocketBase API
4. **Scale**: Deploy to production with proper hosting

## 10. Support

For issues or questions:
- Check the main [README.md](README.md)
- Review PocketBase documentation: [pocketbase.io/docs](https://pocketbase.io/docs/)
- Open an issue on GitHub

## 11. Quick Reference

**PocketBase Admin UI**: `http://127.0.0.1:8090/_/`
**Application**: `http://localhost:3000`
**API Endpoint**: `http://127.0.0.1:8090/api/`

**Default Ports**:
- Next.js: 3000
- PocketBase: 8090

**Key Files**:
- `pb_schema.json` - Database schema
- `.env.local` - Environment configuration
- `lib/pocketbase-types.ts` - TypeScript types
- `components/forecast-form-dialog.tsx` - Cascading dropdown implementation

Happy CRM-ing! 🚀
