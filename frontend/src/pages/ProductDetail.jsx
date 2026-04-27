import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeft, Plus, Minus, Truck, Shield, Sparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatBWP } from "../lib/format";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setProduct(null);
    api.get(`/products/${slug}`).then(({ data }) => {
      setProduct(data);
      if (data.sizes && data.sizes.length) setSize(data.sizes[0]);
    });
  }, [slug]);

  if (!product) {
    return (
      <div className="pt-32 max-w-[1400px] mx-auto px-6 sm:px-10 min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground font-light">Loading…</p>
      </div>
    );
  }

  const onSale = product.compare_at_price && product.compare_at_price > product.price;

  const handleAdd = () => {
    addItem(product, { size, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pt-28 pb-24 max-w-[1400px] mx-auto px-6 sm:px-10">
      <Link to="/shop" data-testid="back-to-shop" className="overline text-muted-foreground hover:text-terracotta inline-flex items-center gap-2 mb-10">
        <ArrowLeft size={14} /> Back to shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="relative bg-muted overflow-hidden aspect-[4/5]">
            <img data-testid="product-image" src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {onSale && (
              <span className="absolute top-4 right-4 bg-terracotta text-bone overline px-3 py-1">
                −{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
          {product.tag && <p className="overline text-terracotta mb-4">{product.tag === "clearance" ? "Clearance" : product.tag === "new" ? "New arrival" : "Best seller"}</p>}
          <h1 data-testid="product-title" className="font-serif text-4xl sm:text-5xl text-espresso leading-[1] mb-6">{product.name}</h1>
          <div className="flex items-baseline gap-4 mb-8">
            <span data-testid="product-price" className="font-serif text-3xl text-espresso">{formatBWP(product.price)}</span>
            {onSale && <span className="text-base font-light text-muted-foreground line-through">{formatBWP(product.compare_at_price)}</span>}
          </div>
          <p className="text-base font-light leading-relaxed text-foreground/85 mb-10">{product.description}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-8">
              <p className="overline mb-4">Size · <span className="text-muted-foreground">{size}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    data-testid={`size-${s}`}
                    onClick={() => setSize(s)}
                    className={`px-4 py-3 border text-sm font-light min-w-[64px] transition-all ${
                      size === s
                        ? "border-espresso bg-espresso text-bone"
                        : "border-espresso/20 hover:border-espresso text-espresso"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <p className="overline mb-4">Quantity</p>
            <div className="inline-flex items-center border border-espresso/20">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-sand/40">
                <Minus size={14} />
              </button>
              <span data-testid="qty-display" className="px-5 text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-sand/40">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            data-testid="add-to-cart-btn"
            onClick={handleAdd}
            className="btn-sharp w-full bg-espresso text-bone py-5 hover:bg-terracotta transition-colors"
          >
            {added ? "Added to bag ✦" : `Add to bag — ${formatBWP(product.price * qty)}`}
          </button>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-light text-muted-foreground">
            <div className="flex items-start gap-2"><Truck size={16} className="text-terracotta mt-0.5" /><span>Free delivery over BWP 1,000</span></div>
            <div className="flex items-start gap-2"><Shield size={16} className="text-terracotta mt-0.5" /><span>14-day easy returns</span></div>
            <div className="flex items-start gap-2"><Sparkles size={16} className="text-terracotta mt-0.5" /><span>Curated by Lebville</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
