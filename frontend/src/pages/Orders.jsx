import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatBWP } from "../lib/format";
import { Package } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders")
      .then(({ data }) => setOrders(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-12">
        <p className="overline text-terracotta mb-3">My account</p>
        <h1 className="font-serif text-5xl sm:text-6xl text-espresso">Orders.</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-light">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-terracotta mx-auto mb-6" />
          <p className="font-serif text-3xl text-espresso mb-3">No orders yet.</p>
          <p className="text-muted-foreground font-light mb-8">Find something you love.</p>
          <Link to="/shop" className="btn-sharp inline-block bg-espresso text-bone px-8 py-4 hover:bg-terracotta">Browse the shop</Link>
        </div>
      ) : (
        <div data-testid="orders-list" className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} data-testid={`order-${o.id}`} className="border border-espresso/10 bg-bone p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <p className="overline text-terracotta mb-1">Order</p>
                  <p className="font-serif text-2xl text-espresso">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`overline px-3 py-1 ${
                      o.status === "paid"
                        ? "bg-terracotta text-bone"
                        : o.status === "pending_payment"
                        ? "bg-sand text-espresso"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {o.status.replace("_", " ")}
                  </span>
                  <p className="font-serif text-2xl text-espresso mt-2">{formatBWP(o.total)}</p>
                </div>
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {o.items.map((it, idx) => (
                  <li key={idx} className="flex gap-3 items-center">
                    <img src={it.image} alt={it.name} className="w-14 h-16 object-cover" />
                    <div className="text-xs">
                      <p className="font-serif text-base leading-tight text-espresso">{it.name}</p>
                      <p className="text-muted-foreground">×{it.quantity} · {it.size}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
