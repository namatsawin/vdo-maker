export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <p>&copy; 2024 AI Video Studio. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-6">
            <a 
              href="#" 
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
