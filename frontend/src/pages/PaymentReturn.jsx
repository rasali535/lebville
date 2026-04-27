import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import { useCart } from "../context/CartContext";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatBWP } from "../lib/format";

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId") || params.get("CompanyRef");
  const transToken = params.get("TransactionToken") || params.get("TransToken") || "";
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");
  const { clear } = useCart();

  useEffect(() => {
    if (!orderId || !transToken) {
      setStatus("error");
      setErr("Missing order or token");
      return;
    }
    api
      .post("/payment/verify", { order_id: orderId, trans_token: transToken })
      .then(({ data }) => {
        setOrder(data.order);
        if (data.ok && data.status === "paid") {
          setStatus("success");
          clear();
          try { sessionStorage.removeItem("lebville_pending_order"); } catch {}
        } else {
          setStatus("failed");
        }
      })
      .catch((e) => {
        setStatus("error");
        setErr(formatApiError(e));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, transToken]);

  return (
    <div className="pt-40 pb-24 max-w-[700px] mx-auto px-6 text-center">
      {status === "verifying" && (
        <div data-testid="payment-verifying">
          <Loader2 size={42} className="animate-spin text-terracotta mx-auto mb-6" />
          <h1 className="font-serif text-5xl text-espresso mb-3">Confirming your payment…</h1>
          <p className="text-muted-foreground font-light">A moment, please.</p>
        </div>
      )}

      {status === "success" && order && (
        <div data-testid="payment-success">
          <CheckCircle2 size={56} className="text-terracotta mx-auto mb-6" />
          <p className="overline text-terracotta mb-3">Order confirmed</p>
          <h1 className="font-serif text-5xl text-espresso mb-4">Thank you.</h1>
          <p className="text-muted-foreground font-light mb-8">
            Your order <span className="text-espresso">{order.order_number}</span> has been received.
            We'll be in touch shortly with delivery details.
          </p>
          <div className="bg-sand/30 border border-espresso/10 p-6 text-left max-w-md mx-auto mb-8">
            <p className="overline mb-3">Summary</p>
            <div className="flex justify-between text-sm font-light"><span>Items</span><span>{order.items.length}</span></div>
            <div className="flex justify-between text-sm font-light"><span>Total paid</span><span className="font-medium">{formatBWP(order.total)}</span></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/orders" data-testid="view-orders-link" className="btn-sharp bg-espresso text-bone px-8 py-4 hover:bg-terracotta">View my orders</Link>
            <Link to="/shop" className="btn-sharp text-espresso underline underline-offset-4">Continue shopping</Link>
          </div>
        </div>
      )}

      {(status === "failed" || status === "error") && (
        <div data-testid="payment-failed">
          <XCircle size={56} className="text-destructive mx-auto mb-6" />
          <h1 className="font-serif text-5xl text-espresso mb-4">Payment didn't complete.</h1>
          <p className="text-muted-foreground font-light mb-8">{err || "Please try again or contact support."}</p>
          <Link to="/checkout" className="btn-sharp bg-espresso text-bone px-8 py-4 hover:bg-terracotta">Try again</Link>
        </div>
      )}
    </div>
  );
}
