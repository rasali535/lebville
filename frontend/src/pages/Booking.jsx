import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatBWP } from "../lib/format";
import { Calendar, Clock, Sparkles, MapPin } from "lucide-react";

export default function Booking() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products?category=service")
      .then(({ data }) => setServices(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-16">
        <p className="overline text-terracotta mb-4">Reservations</p>
        <h1 className="font-serif text-5xl sm:text-7xl text-espresso mb-6 leading-tight">Curated<br/>Experiences.</h1>
        <p className="text-muted-foreground font-light max-w-2xl text-lg leading-relaxed">
          Experience the pinnacle of African luxury. From bespoke styling to advanced skincare rituals, 
          every service is a journey tailored to your unique essence.
        </p>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-2 border-terracotta rounded-full animate-spin mb-4" />
          <p className="overline text-muted-foreground">Consulting the artisans…</p>
        </div>
      ) : services.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-espresso/10">
          <p className="font-serif text-3xl text-espresso">No services available.</p>
          <p className="text-muted-foreground font-light mt-2">Please check back later for our new seasonal menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {services.map((s) => (
            <div key={s.id} className="group flex flex-col border border-espresso/5 bg-white overflow-hidden transition-all duration-500 hover:border-terracotta/20 hover:shadow-2xl hover:shadow-terracotta/5">
              <div className="relative aspect-[16/9] overflow-hidden">
                 <img src={s.image} alt={s.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-espresso/20 group-hover:bg-espresso/0 transition-colors duration-700" />
                 <div className="absolute top-6 left-6">
                   <span className="overline text-[10px] bg-white/90 backdrop-blur-md text-espresso px-3 py-1.5 shadow-sm">
                     {s.tag || "Exclusive"}
                   </span>
                 </div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex justify-between items-baseline mb-6">
                   <h3 className="font-serif text-3xl text-espresso group-hover:text-terracotta transition-colors">{s.name}</h3>
                   <p className="font-serif text-2xl text-espresso/60">{formatBWP(s.price)}</p>
                </div>
                <p className="text-base text-muted-foreground font-light leading-relaxed mb-8 flex-1">
                  {s.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[11px] text-muted-foreground overline mb-10 pb-8 border-b border-espresso/5">
                   <span className="flex items-center gap-2 text-espresso"><Clock size={14} className="text-terracotta"/> {s.sizes[0]}</span>
                   <span className="flex items-center gap-2 text-espresso"><MapPin size={14} className="text-terracotta"/> In-Studio</span>
                   <span className="flex items-center gap-2 text-espresso"><Sparkles size={14} className="text-terracotta"/> Premium</span>
                </div>
                <button className="w-full bg-espresso text-white py-5 px-8 hover:bg-terracotta transition-all duration-500 overline tracking-[0.3em] text-xs font-medium relative overflow-hidden group/btn">
                  <span className="relative z-10">Reserve Session</span>
                  <div className="absolute inset-0 bg-terracotta translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking FAQ / Info Section */}
      <div className="mt-32 pt-24 border-t border-espresso/10 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h4 className="font-serif text-2xl text-espresso mb-4">Arrival & Preparation</h4>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            We recommend arriving 15 minutes prior to your scheduled session to immerse yourself in the Lebville atmosphere.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-2xl text-espresso mb-4">Cancellation Policy</h4>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            We require 24 hours notice for any rescheduling or cancellations to honor the time of our specialist artisans.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-2xl text-espresso mb-4">Private Bookings</h4>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            For group sessions, bridal parties, or private editorial events, please contact our concierge directly.
          </p>
        </div>
      </div>
    </div>
  );
}
