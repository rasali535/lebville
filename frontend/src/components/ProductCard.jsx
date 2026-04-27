import React from "react";
import { Link } from "react-router-dom";
import { formatBWP } from "../lib/format";

export default function ProductCard({ product, index = 0 }) {
  const onSale = product.compare_at_price && product.compare_at_price > product.price;
  return (
    <Link
      to={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="product-card group block"
    >
      <div className="relative overflow-hidden bg-muted aspect-[4/5] mb-4">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="product-card-img w-full h-full object-cover"
        />
        {product.tag && (
          <span className="absolute top-3 left-3 bg-bone/90 backdrop-blur px-3 py-1 overline text-espresso">
            {product.tag === "clearance" ? "Sale" : product.tag === "new" ? "New" : product.tag === "bestseller" ? "Best seller" : product.tag}
          </span>
        )}
        {onSale && (
          <span className="absolute top-3 right-3 bg-terracotta text-bone px-3 py-1 overline">−{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%</span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-serif text-xl sm:text-[1.35rem] leading-tight text-espresso group-hover:text-terracotta transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-3">
          <span data-testid={`product-price-${product.slug}`} className="text-sm font-light tracking-wide text-espresso">{formatBWP(product.price)}</span>
          {onSale && (
            <span className="text-xs font-light text-muted-foreground line-through">{formatBWP(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
