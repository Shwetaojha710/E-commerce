import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  Shop: [
    { label: 'All Products', to: '/products' },
    { label: 'Featured', to: '/products?isFeatured=true' },
    { label: 'New Arrivals', to: '/products?sort=-createdAt' },
    { label: 'Trending', to: '/products?isTrending=true' },
  ],
  Account: [
    { label: 'My Profile', to: '/profile' },
    { label: 'Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Cart', to: '/cart' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Returns', to: '#' },
    { label: 'Track Order', to: '#' },
    { label: 'Contact Us', to: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">S</span>
              </div>
              <span className="text-white">ShopSphere</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop shop for premium products. Quality, speed, and satisfaction guaranteed.
            </p>
            <div className="flex gap-4 mt-4">
              {['M', 'T', 'I', 'Y'].map((s) => (
                <a key={s} href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-primary-600 transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ShopSphere. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
