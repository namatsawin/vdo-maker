export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <p>&copy; 2024 VDO Maker. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="hover:text-foreground transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
