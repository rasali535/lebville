import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Package, Calendar, User, Settings, ChevronRight } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();

  const menuItems = [
    { to: "/dashboard/orders", label: "My Orders", icon: <Package size={18} /> },
    { to: "/dashboard/booking", label: "Bookings", icon: <Calendar size={18} /> },
    { to: "/dashboard/profile", label: "Profile", icon: <User size={18} /> },
    { to: "/dashboard/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="pt-32 pb-24 max-w-[1440px] mx-auto px-6 sm:px-10 min-h-screen flex flex-col lg:flex-row gap-12">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 flex-shrink-0">
        <div className="sticky top-40">
          <div className="mb-10">
            <p className="overline text-terracotta mb-2">Member Dashboard</p>
            <h2 className="font-serif text-3xl text-espresso italic">The Atelier.</h2>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between p-4 border-b border-espresso/5 group transition-all ${
                    isActive 
                      ? "bg-espresso text-bone" 
                      : "text-espresso hover:bg-espresso/5"
                  }`
                }
              >
                <div className="flex items-center gap-4">
                  <span className="opacity-70 group-hover:text-terracotta transition-colors">
                    {item.icon}
                  </span>
                  <span className="overline text-[11px] font-medium tracking-widest uppercase">
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={14} className={`opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
              </NavLink>
            ))}
          </nav>
          
          <div className="mt-12 p-8 bg-terracotta/5 border border-terracotta/10">
            <p className="font-serif text-xl text-espresso mb-3">Loyalty Program</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              You are 450 points away from becoming a <span className="text-terracotta font-medium italic">Gold Member</span>.
            </p>
            <div className="h-1 bg-espresso/5 overflow-hidden">
               <div className="h-full bg-terracotta w-2/3" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="bg-white/40 backdrop-blur-sm border border-espresso/5 p-8 sm:p-12 lg:p-16 min-h-[600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
