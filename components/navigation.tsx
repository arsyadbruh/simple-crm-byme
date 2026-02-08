'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Users,
  HandshakeIcon,
  Target,
  Layers,
  ListTree,
  Package,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Forecasts', href: '/forecasts', icon: Target },
  { name: 'Activities', href: '/activities', icon: HandshakeIcon },
];

const programNavigation = [
  { name: 'Programs', href: '/programs', icon: Layers },
  { name: 'Sub Programs', href: '/sub-programs', icon: ListTree },
  { name: 'Products', href: '/products', icon: Package },
];

const peopleNavigation = [
  { name: 'Institutions', href: '/institutions', icon: Building2 },
  { name: 'Contacts', href: '/contacts', icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programMenuOpen, setProgramMenuOpen] = useState(false);
  const [peopleMenuOpen, setPeopleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileProgramMenuOpen, setMobileProgramMenuOpen] = useState(false);
  const [mobilePeopleMenuOpen, setMobilePeopleMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const displayName = user.username?.trim() || 'User';

  const isGroupActive = (items: { href: string }[]) =>
    items.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'));

  const closeDesktopMenus = () => {
    setProgramMenuOpen(false);
    setPeopleMenuOpen(false);
    setUserMenuOpen(false);
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Target className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CRM System</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    setProgramMenuOpen((open) => !open);
                    setPeopleMenuOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isGroupActive(programNavigation)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Programs
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {programMenuOpen && (
                  <div className="absolute left-0 z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="py-1">
                      {programNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={closeDesktopMenus}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    setPeopleMenuOpen((open) => !open);
                    setProgramMenuOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isGroupActive(peopleNavigation)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  People
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {peopleMenuOpen && (
                  <div className="absolute left-0 z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="py-1">
                      {peopleNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={closeDesktopMenus}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setProgramMenuOpen(false);
                  setPeopleMenuOpen(false);
                }}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span className="font-medium flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                  </div>
                  {displayName}
                </span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeDesktopMenus();
                        logout();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="inline h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <div>
              <button
                type="button"
                onClick={() => setMobileProgramMenuOpen((open) => !open)}
                className={`flex w-full items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isGroupActive(programNavigation)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center">
                  <Layers className="mr-3 h-5 w-5" />
                  Programs
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileProgramMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileProgramMenuOpen && (
                <div className="ml-6 space-y-1">
                  {programNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center pr-4 py-2 text-sm ${
                          isActive
                            ? 'text-indigo-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileProgramMenuOpen(false);
                        }}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setMobilePeopleMenuOpen((open) => !open)}
                className={`flex w-full items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isGroupActive(peopleNavigation)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center">
                  <Users className="mr-3 h-5 w-5" />
                  People
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobilePeopleMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobilePeopleMenuOpen && (
                <div className="ml-6 space-y-1">
                  {peopleNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center pr-4 py-2 text-sm ${
                          isActive
                            ? 'text-indigo-700'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobilePeopleMenuOpen(false);
                        }}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 space-y-1">
              <button
                type="button"
                onClick={() => setMobileUserMenuOpen((open) => !open)}
                className="flex w-full items-center justify-between text-base font-medium text-gray-800"
              >
                <span>{displayName}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {mobileUserMenuOpen && (
              <div className="mt-3 px-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileUserMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
