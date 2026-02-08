# Simple CRM

A modern Customer Relationship Management (CRM) application built with Next.js, PocketBase, Tailwind CSS, and Shadcn/UI.

## Features

- 📊 **Dashboard**: Overview of your CRM data with statistics
- 👥 **Contacts Management**: Add, view, and manage your contacts
- 🏢 **Companies Management**: Track companies and their information
- 💰 **Deals Management**: Monitor sales deals and their status
- 🎨 **Modern UI**: Built with Tailwind CSS and Shadcn/UI components
- ⚡ **Fast & Responsive**: Powered by Next.js 15 with App Router
- 🗄️ **Backend**: PocketBase for easy database management

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Backend**: PocketBase SDK
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ installed
- PocketBase downloaded and running (get it from [pocketbase.io](https://pocketbase.io))

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/arsyadbruh/simple-crm-byme.git
cd simple-crm-byme
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PocketBase

1. Download PocketBase from [pocketbase.io](https://pocketbase.io)
2. Extract and run PocketBase:
   ```bash
   ./pocketbase serve
   ```
3. Open PocketBase Admin UI at `http://127.0.0.1:8090/_/`
4. Create an admin account
5. Create the following collections:

   **Contacts Collection:**
   - name: `contacts`
   - Fields:
     - `name` (Text, Required)
     - `email` (Email, Required)
     - `phone` (Text)
     - `company` (Text)

   **Companies Collection:**
   - name: `companies`
   - Fields:
     - `name` (Text, Required)
     - `industry` (Text)
     - `website` (URL)

   **Deals Collection:**
   - name: `deals`
   - Fields:
     - `title` (Text, Required)
     - `amount` (Number, Required)
     - `status` (Select: prospect, negotiation, won, lost)
     - `company` (Text)

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your PocketBase URL:

```
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
simple-crm-byme/
├── app/
│   ├── contacts/        # Contacts page
│   ├── companies/       # Companies page
│   ├── deals/          # Deals page
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Dashboard page
│   └── globals.css     # Global styles
├── components/
│   └── ui/             # Shadcn/UI components
├── lib/
│   ├── pocketbase.ts   # PocketBase client
│   └── utils.ts        # Utility functions
└── public/             # Static assets
```

## Usage

### Adding a Contact

1. Navigate to the Contacts page
2. Click "Add Contact"
3. Fill in the contact information
4. Click "Create Contact"

### Adding a Company

1. Navigate to the Companies page
2. Click "Add Company"
3. Fill in the company information
4. Click "Create Company"

### Adding a Deal

1. Navigate to the Deals page
2. Click "Add Deal"
3. Fill in the deal information
4. Select the deal status
5. Click "Create Deal"

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC