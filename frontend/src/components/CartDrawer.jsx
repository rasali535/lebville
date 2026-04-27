import React from "react";
import { X, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { formatBWP } from "../lib/format";

export default function CartDrawer() {
  const { open, setOpen, items, updateQty, removeItem, subtotal, totalQty } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <>
      <div
        data-testid="cart-overlay"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-espresso/40 z-50 transition-opacity duration-500 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        data-testid="cart-drawer"
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-bone z-50 shadow-2xl transition-transform duration-500 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-espresso/10">
          <h2 className="font-serif text-2xl text-espresso">Your bag <span className="text-muted-foreground text-base font-sans font-light">({totalQty})</span></h2>
          <button data-testid="close-cart" onClick={() => setOpen(false)} aria-label="Close" className="hover:text-terracotta">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-serif text-3xl text-espresso mb-3">Your bag awaits.</p>
              <p className="text-sm font-light text-muted-foreground mb-8">Discover something elegant.</p>
              <button
                data-testid="empty-cart-shop-btn"
                onClick={() => { setOpen(false); navigate("/shop"); }}
                className="btn-sharp bg-espresso text-bone px-8 py-3 hover:bg-terracotta transition-colors"
              >
                Browse the shop
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-espresso/10">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.size}`} data-testid={`cart-item-${item.product_id}`} className="px-6 py-5 flex gap-4">
                  <img src={item.image} alt={item.name} className="w-24 h-32 object-cover" />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-serif text-lg leading-tight text-espresso">{item.name}</h3>
                      <button onClick={() => removeItem(item.product_id, item.size)} className="text-muted-foreground hover:text-terracotta" aria-label="Remove">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="overline text-muted-foreground mt-1">Size · {item.size}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-espresso/15">
                        <button onClick={() => updateQty(item.product_id, item.size, item.quantity - 1)} className="p-2 hover:bg-sand/40" aria-label="Decrease">
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.size, item.quantity + 1)} className="p-2 hover:bg-sand/40" aria-label="Increase">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-light">{formatBWP(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-espresso/10 space-y-4 bg-bone">
            <div className="flex justify-between font-serif text-2xl text-espresso">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatBWP(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {subtotal >= 1000 ? "Complimentary delivery included." : `Add ${formatBWP(1000 - subtotal)} for free delivery.`}
            </p>
            <button
              data-testid="cart-checkout-btn"
              onClick={goCheckout}
              className="btn-sharp w-full bg-espresso text-bone py-4 hover:bg-terracotta transition-colors"
            >
              Continue to checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
