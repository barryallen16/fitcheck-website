import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Shirt, 
  Sparkles, 
  User, 
  Upload, 
  Menu,
  Settings
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  garmentCount: number;
}

const navItems = [
  { id: 'today', label: "Today's Pick", icon: Sparkles },
  { id: 'wardrobe', label: 'My Wardrobe', icon: Shirt },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'persona', label: 'Persona', icon: User },
];

export function Navigation({ activeTab, onTabChange, garmentCount }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl hidden sm:inline">FitCheck</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.id === 'wardrobe' && garmentCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {garmentCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className="justify-start gap-3"
                    onClick={() => {
                      onTabChange(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {item.id === 'wardrobe' && garmentCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {garmentCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
              <div className="border-t my-2" />
              <Button variant="ghost" className="justify-start gap-3">
                <Settings className="w-5 h-5" />
                Settings
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Settings Button (Desktop) */}
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
