import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../lib/api";
import { formatBWP } from "../lib/format";
import { Lock } from "lucide-react";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    full_name: user?.name || "",
    phone: "",
    email: user?.email || "",
    address_line: "",
    city: "Gaborone",
    country: "Botswana",
    notes: "",
  });

  const shippingCost = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shippingCost;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 max-w-[800px] mx-auto px-6 sm:px-10 text-center">
        <h1 className="font-serif text-5xl text-espresso mb-4">Your bag is empty.</h1>
        <p className="text-muted-foreground font-light mb-10">Add a few pieces to begin checkout.</p>
        <Link to="/shop" className="btn-sharp inline-block bg-espresso text-bone px-10 py-4 hover:bg-terracotta">
          Browse the shop
        </Link>
      </div>
    );
  }

  const placeOrder = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
      }));
      const { data: order } = await api.post("/orders", { items: orderItems, shipping: form });
      const { data: payment } = await api.post("/payment/create", { order_id: order.id });
      // Save in case page reloads
      try { sessionStorage.setItem("lebville_pending_order", order.id); } catch {}
      // Mock mode redirects to our /payment/return; live mode redirects to DPO host
      window.location.href = payment.redirect_url;
      // We'll clear cart on the return page after verify success
      void clear; // referenced
    } catch (e) {
      setErr(formatApiError(e));
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-[1400px] mx-auto px-6 sm:px-10">
      <div className="mb-12">
        <p className="overline text-terracotta mb-3">Checkout</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-espresso">Almost yours.</h1>
      </div>

      <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section data-testid="shipping-section" className="lg:col-span-7 space-y-8">
          <div>
            <p className="overline mb-6">Delivery details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="overline text-muted-foreground">Full name</label>
                <input data-testid="ship-name" required value={form.full_name} onChange={update("full_name")} className="luxury-input" />
              </div>
              <div>
                <label className="overline text-muted-foreground">Phone</label>
                <input data-testid="ship-phone" required value={form.phone} onChange={update("phone")} className="luxury-input" placeholder="+267 7X XXX XXX" />
              </div>
              <div className="sm:col-span-2">
                <label className="overline text-muted-foreground">Email</label>
                <input data-testid="ship-email" type="email" required value={form.email} onChange={update("email")} className="luxury-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="overline text-muted-foreground">Address</label>
                <input data-testid="ship-address" required value={form.address_line} onChange={update("address_line")} className="luxury-input" placeholder="Plot 1234, Phakalane" />
              </div>
              <div>
                <label className="overline text-muted-foreground">City</label>
                <input data-testid="ship-city" required value={form.city} onChange={update("city")} className="luxury-input" />
              </div>
              <div>
                <label className="overline text-muted-foreground">Country</label>
                <input data-testid="ship-country" required value={form.country} onChange={update("country")} className="luxury-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="overline text-muted-foreground">Order notes (optional)</label>
                <input data-testid="ship-notes" value={form.notes} onChange={update("notes")} className="luxury-input" placeholder="Gate code, delivery preference…" />
              </div>
            </div>
          </div>

          <div className="bg-sand/30 p-6 border border-espresso/10 flex items-start gap-4">
            <Lock size={18} className="text-terracotta mt-1 flex-shrink-0" />
            <div className="text-sm font-light">
              <p className="font-medium text-espresso mb-1">Secure payment by DPO Pay</p>
              <p className="text-muted-foreground">You'll be redirected to DPO's secure gateway to complete payment. <span className="text-terracotta">Sandbox/test mode is active.</span></p>
            </div>
          </div>

          {err && <p data-testid="checkout-error" className="text-sm text-destructive">{err}</p>}
        </section>

        <aside data-testid="order-summary" className="lg:col-span-5">
          <div className="bg-bone border border-espresso/10 p-6 sm:p-8 lg:sticky lg:top-32">
            <p className="overline mb-6">Your order</p>
            <ul className="divide-y divide-espresso/10 mb-6">
              {items.map((i) => (
                <li key={`${i.product_id}-${i.size}`} className="py-4 flex gap-3">
                  <img src={i.image} alt={i.name} className="w-16 h-20 object-cover" />
                  <div className="flex-1">
                    <p className="font-serif text-base text-espresso leading-tight">{i.name}</p>
                    <p className="overline text-muted-foreground mt-1">{i.size} · ×{i.quantity}</p>
                  </div>
                  <p className="text-sm font-light">{formatBWP(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm font-light">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatBWP(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{shippingCost === 0 ? "Free" : formatBWP(shippingCost)}</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-espresso/10 flex justify-between font-serif text-2xl text-espresso">
              <span>Total</span><span data-testid="checkout-total">{formatBWP(total)}</span>
            </div>
            <button
              data-testid="place-order-btn"
              type="submit"
              disabled={submitting}
              className="btn-sharp w-full bg-espresso text-bone py-5 mt-8 hover:bg-terracotta disabled:opacity-50 transition-colors"
            >
              {submitting ? "Redirecting to DPO…" : "Pay with DPO Pay"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
