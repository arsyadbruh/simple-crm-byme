"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Globe, Tag } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";

interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const records = await pb.collection('companies').getFullList<Company>({
        sort: '-created',
      });
      setCompanies(records);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await pb.collection('companies').create(formData);
      setFormData({ name: "", industry: "", website: "" });
      setIsFormOpen(false);
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error creating company. Make sure PocketBase is running and the companies collection exists.');
    }
  }

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
          <h2 className="text-3xl font-bold">Companies</h2>
          <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Add Company Form */}
        {isFormOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Company</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Inc"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Company</Button>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Companies List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No companies yet. Click "Add Company" to create your first company.
                </p>
              </CardContent>
            </Card>
          ) : (
            companies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {company.industry && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Tag className="h-4 w-4 mr-2" />
                      {company.industry}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 mr-2" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {company.website}
                      </a>
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
