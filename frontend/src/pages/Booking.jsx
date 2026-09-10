import React, { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import { formatBWP } from "../lib/format";
import { Calendar, Clock, Sparkles, MapPin } from "lucide-react";

export default function Booking() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", preferred_date: "", preferred_time: "", guests: 1, notes: "" });

  useEffect(() => {
    api.get("/products?category=service")
      .then(({ data }) => setServices(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const submitBooking = async (e) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const { data } = await api.post("/bookings", { ...form, email: form.email || null, guests: Number(form.guests), service_id: selected.id, service_name: selected.name });
      window.location.href = data.whatsapp_url;
      setSelected(null);
    } catch (err) { setError(formatApiError(err)); } finally { setSubmitting(false); }
  };

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
                   <span className="flex items-center gap-2 text-espresso"><Clock size={14} className="text-terracotta"/> {s.sizes?.[0] || "By appointment"}</span>
                   <span className="flex items-center gap-2 text-espresso"><MapPin size={14} className="text-terracotta"/> In-Studio</span>
                   <span className="flex items-center gap-2 text-espresso"><Sparkles size={14} className="text-terracotta"/> Premium</span>
                </div>
                <button onClick={() => setSelected(s)} className="w-full bg-espresso text-white py-5 px-8 hover:bg-terracotta transition-all duration-500 overline tracking-[0.3em] text-xs font-medium relative overflow-hidden group/btn">
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

      {selected && <div className="fixed inset-0 z-[80] bg-espresso/60 backdrop-blur-sm p-4 overflow-y-auto">
        <form onSubmit={submitBooking} className="bg-bone max-w-2xl mx-auto my-10 p-6 sm:p-10 relative">
          <button type="button" onClick={()=>setSelected(null)} className="absolute right-5 top-5 text-2xl" aria-label="Close">×</button>
          <p className="overline text-terracotta mb-2">Booking request</p><h2 className="font-serif text-4xl mb-2">{selected.name}</h2><p className="text-muted-foreground mb-8">{formatBWP(selected.price)} · {selected.sizes?.[0] || "By appointment"}</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><label className="overline text-muted-foreground">Your name</label><input required className="luxury-input" value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))}/></div>
            <div><label className="overline text-muted-foreground">WhatsApp number</label><input required className="luxury-input" placeholder="+267 7X XXX XXX" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div><label className="overline text-muted-foreground">Email (optional)</label><input type="email" className="luxury-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label className="overline text-muted-foreground">Number of guests</label><input required min="1" max="30" type="number" className="luxury-input" value={form.guests} onChange={e=>setForm(f=>({...f,guests:e.target.value}))}/></div>
            <div><label className="overline text-muted-foreground">Preferred date</label><input required type="date" min={new Date().toISOString().slice(0,10)} className="luxury-input" value={form.preferred_date} onChange={e=>setForm(f=>({...f,preferred_date:e.target.value}))}/></div>
            <div><label className="overline text-muted-foreground">Preferred time</label><input required type="time" className="luxury-input" value={form.preferred_time} onChange={e=>setForm(f=>({...f,preferred_time:e.target.value}))}/></div>
            <div className="sm:col-span-2"><label className="overline text-muted-foreground">Notes (optional)</label><textarea className="luxury-input min-h-24" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          </div>
          {error && <p className="text-destructive text-sm mt-4">{error}</p>}
          <button disabled={submitting} className="w-full mt-7 bg-[#25D366] text-white py-4 uppercase text-xs tracking-[0.2em] disabled:opacity-50">{submitting ? "Saving booking…" : "Continue to WhatsApp"}</button>
          <p className="text-xs text-muted-foreground mt-3 text-center">Your request is saved first. WhatsApp will open so you can send it directly to Lebville.</p>
        </form>
      </div>}
    </div>
  );
}
