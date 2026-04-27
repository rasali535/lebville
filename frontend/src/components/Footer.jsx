import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Music2 } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative bg-espresso text-bone overflow-hidden mt-32">
      <div className="grain absolute inset-0" />
      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10 py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <h3 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-6">
            Where elegance<br /><em className="text-terracotta">meets</em> exclusivity.
          </h3>
          <p className="text-bone/70 max-w-md text-sm font-light leading-relaxed">
            Lebville Boutique & Spa is Gaborone's destination for considered fashion, NORA cosmetics, and quiet
            wellness. Curated. Made for confidence.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="overline text-bone/50 mb-5">Shop</p>
          <ul className="space-y-3 text-sm font-light">
            <li><Link to="/shop" className="hover:text-terracotta transition-colors">All products</Link></li>
            <li><Link to="/shop?category=clothing" className="hover:text-terracotta">Clothing</Link></li>
            <li><Link to="/shop?category=makeup" className="hover:text-terracotta">NORA Cosmetics</Link></li>
            <li><Link to="/shop?category=skincare" className="hover:text-terracotta">Skincare</Link></li>
            <li><Link to="/shop?tag=clearance" className="hover:text-terracotta">Clearance</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="overline text-bone/50 mb-5">Account</p>
          <ul className="space-y-3 text-sm font-light">
            <li><Link to="/login" className="hover:text-terracotta">Sign in</Link></li>
            <li><Link to="/register" className="hover:text-terracotta">Create account</Link></li>
            <li><Link to="/orders" className="hover:text-terracotta">My orders</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="overline text-bone/50 mb-5">Connect</p>
          <ul className="space-y-3 text-sm font-light">
            <li><a href="https://wa.me/26773011600" target="_blank" rel="noreferrer" className="hover:text-terracotta">+267 73 011 600</a></li>
            <li><a href="mailto:info@lebvilleboutique.com" className="hover:text-terracotta break-all">info@lebvilleboutique.com</a></li>
            <li className="text-bone/60">Gaborone, Botswana</li>
          </ul>
          <div className="flex gap-4 mt-6">
            <a href="https://www.instagram.com/lebville/" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-terracotta"><Instagram size={18} /></a>
            <a href="https://www.facebook.com/lebvilleinvestments" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-terracotta"><Facebook size={18} /></a>
            <a href="https://www.tiktok.com/@lebville.boutique" target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-terracotta"><Music2 size={18} /></a>
          </div>
        </div>
      </div>
      <div className="relative border-t border-bone/10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bone/50">
          <p>© {new Date().getFullYear()} Lebville Boutique & Spa. All rights reserved.</p>
          <p className="overline">Crafted for elegance.</p>
        </div>
      </div>
    </footer>
  );
}
