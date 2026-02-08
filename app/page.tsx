"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Simple CRM</h1>
            <nav className="flex gap-4">
              <Link href="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/contacts">
                <Button variant="ghost">Contacts</Button>
              </Link>
              <Link href="/companies">
                <Button variant="ghost">Companies</Button>
              </Link>
              <Link href="/deals">
                <Button variant="ghost">Deals</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contacts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No contacts yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Companies
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No companies yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Deals
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No deals yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                Total revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your CRM</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href="/contacts">
              <Button>Add Contact</Button>
            </Link>
            <Link href="/companies">
              <Button variant="outline">Add Company</Button>
            </Link>
            <Link href="/deals">
              <Button variant="outline">Add Deal</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Configure PocketBase to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Install PocketBase</h3>
              <p className="text-sm text-muted-foreground">
                Download PocketBase from{" "}
                <a href="https://pocketbase.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  pocketbase.io
                </a>{" "}
                and run it locally or on your server.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Create Collections</h3>
              <p className="text-sm text-muted-foreground">
                Create the following collections in PocketBase admin panel:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li><strong>contacts</strong>: name (text), email (email), phone (text), company (relation to companies)</li>
                <li><strong>companies</strong>: name (text), industry (text), website (url)</li>
                <li><strong>deals</strong>: title (text), amount (number), status (select), company (relation to companies)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Configure Environment</h3>
              <p className="text-sm text-muted-foreground">
                Create a <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file with:
              </p>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
                NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
