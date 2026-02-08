"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

interface Deal {
  id: string;
  title: string;
  amount: number;
  status: string;
  company: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    status: "prospect",
    company: "",
  });

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    try {
      const records = await pb.collection('deals').getFullList<Deal>({
        sort: '-created',
      });
      setDeals(records);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await pb.collection('deals').create({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      });
      setFormData({ title: "", amount: "", status: "prospect", company: "" });
      setIsFormOpen(false);
      loadDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Error creating deal. Make sure PocketBase is running and the deals collection exists.');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Deals</h2>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        {/* Add Deal Form */}
        {isFormOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Deal Title</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Q1 Enterprise License"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount ($)</label>
                  <Input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Inc"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Deal</Button>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Deals List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No deals yet. Click "Add Deal" to create your first deal.
                </p>
              </CardContent>
            </Card>
          ) : (
            deals.map((deal) => (
              <Card key={deal.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{deal.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-lg font-bold text-green-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {deal.amount.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deal.status)}`}
                    >
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                    </span>
                  </div>
                  {deal.company && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 mr-2" />
                      {deal.company}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
