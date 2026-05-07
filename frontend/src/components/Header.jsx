import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { totalQty, setOpen } = useCart();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/shop?category=clothing", label: "Clothing" },
    { to: "/shop?category=makeup", label: "Beauty" },
    { to: "/shop?category=skincare", label: "Skincare" },
  ];

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-bone/85 border-b border-espresso/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-6">
        <button
          data-testid="mobile-menu-btn"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden text-espresso p-1"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" data-testid="logo-link" className="flex items-center gap-2 select-none group">
          <img src="/assets/logo.png" alt="Lebville" className="h-10 sm:h-12 w-auto transition-transform duration-500 group-hover:scale-105" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-link-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `overline transition-colors hover:text-terracotta ${
                  isActive && item.to === "/" ? "text-terracotta" : "text-espresso"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/orders" data-testid="orders-link" className="overline hover:text-terracotta">
                Orders
              </Link>
              <button data-testid="logout-btn" onClick={logout} className="overline hover:text-terracotta">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" data-testid="login-link" className="hidden sm:inline overline hover:text-terracotta">
              Sign in
            </Link>
          )}
          <Link to="/login" data-testid="account-icon" className="sm:hidden text-espresso">
            <User size={18} />
          </Link>
          <button
            data-testid="cart-trigger"
            onClick={() => setOpen(true)}
            className="relative text-espresso hover:text-terracotta transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {totalQty > 0 && (
              <span
                data-testid="cart-count"
                className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-terracotta text-bone text-[10px] font-medium flex items-center justify-center rounded-full"
              >
                {totalQty}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div data-testid="mobile-menu" className="lg:hidden bg-bone border-t border-espresso/10">
          <div className="flex flex-col px-6 py-6 gap-5">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="overline text-espresso hover:text-terracotta">
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/orders" className="overline">Orders</Link>
                <button onClick={logout} className="overline text-left">Sign out</button>
              </>
            ) : (
              <Link to="/login" className="overline">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
