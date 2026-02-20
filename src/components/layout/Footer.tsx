import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main footer */}
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-bold text-primary-foreground">IMK</span>
              <span className="text-2xl font-bold text-accent">-MARKET</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4">
              Your trusted international marketplace connecting buyers and sellers across borders. 
              Serving Somalia, UAE, China, USA, UK, and more.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 bg-primary-foreground/10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/solutions" className="hover:text-accent transition-colors">Solutions</Link></li>
              <li><Link to="/protections" className="hover:text-accent transition-colors">Protections</Link></li>
              <li><Link to="/partners" className="hover:text-accent transition-colors">Partners</Link></li>
              <li><Link to="/suppliers" className="hover:text-accent transition-colors">Suppliers</Link></li>
              <li><Link to="/manufacturers" className="hover:text-accent transition-colors">Manufacturers</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-accent transition-colors">Shop Now</Link></li>
              <li><Link to="/sell" className="hover:text-accent transition-colors">Sell Products</Link></li>
              <li><Link to="/market-prices" className="hover:text-accent transition-colors">Market Prices</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/help" className="hover:text-accent transition-colors">Help Center</Link></li>
              <li><Link to="/policies" className="hover:text-accent transition-colors">Policies & Procedures</Link></li>
              <li><Link to="/shipping" className="hover:text-accent transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-accent transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/track" className="hover:text-accent transition-colors">Track Order</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Dubai, United Arab Emirates</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+232-76-123-456</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@imkmarket.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Connect with us */}
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-primary-foreground/60">
              © 2024 IMK-MARKET. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-primary-foreground/60">
              <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
