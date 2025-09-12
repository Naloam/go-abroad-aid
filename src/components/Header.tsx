import { Button } from "@/components/ui/button";
import { BookOpen, User, Menu } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">留学助手</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
            功能介绍
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
            价格方案
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
            联系我们
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            登录
          </Button>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-primary hover:opacity-90">
            免费注册
          </Button>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};