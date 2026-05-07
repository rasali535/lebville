import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { Search, ChevronDown } from "lucide-react";

const CATEGORY_LABELS = {
  all: "All products",
  clothing: "Clothing",
  makeup: "HL/SKIN Beauty",
  skincare: "Skincare",
  accessories: "Accessories",
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const tag = params.get("tag") || "";
  const sort = params.get("sort") || "";
  const search = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (category && category !== "all") q.set("category", category);
    if (tag) q.set("tag", tag);
    if (sort) q.set("sort", sort);
    if (search) q.set("search", search);
    api.get(`/products?${q.toString()}`).then(({ data }) => {
      setProducts(data.items || []);
      setLoading(false);
    });
  }, [category, tag, sort, search]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    updateParam("search", searchInput.trim());
  };

  const categories = ["all", "clothing", "makeup", "skincare"];

  return (
    <div className="pt-32 pb-24 max-w-[1400px] mx-auto px-6 sm:px-10">
      <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="overline text-terracotta mb-3">The Boutique</p>
          <h1 className="font-serif text-5xl sm:text-6xl text-espresso">{CATEGORY_LABELS[category] || "Shop"}.</h1>
        </div>
        <form onSubmit={onSearchSubmit} className="flex items-center border-b border-espresso/20 min-w-[260px]">
          <Search size={16} className="text-muted-foreground" />
          <input
            data-testid="shop-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the boutique"
            className="flex-1 bg-transparent py-3 px-3 text-sm font-light focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button data-testid="shop-search-btn" className="overline text-espresso hover:text-terracotta">Go</button>
        </form>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 border-y border-espresso/10 py-5 mb-12">
        <div className="flex items-center gap-6 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              data-testid={`filter-cat-${c}`}
              onClick={() => updateParam("category", c === "all" ? "" : c)}
              className={`overline transition-colors ${
                category === c ? "text-terracotta underline underline-offset-[6px]" : "text-espresso hover:text-terracotta"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="overline text-muted-foreground">Sort</span>
          <div className="relative">
            <select
              data-testid="shop-sort"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="appearance-none bg-transparent border-b border-espresso/20 py-2 pr-8 pl-2 text-sm font-light focus:outline-none cursor-pointer"
            >
              <option value="">Default</option>
              <option value="price_asc">Price · Low to high</option>
              <option value="price_desc">Price · High to low</option>
              <option value="recent">Most recent</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-light text-center py-20">Curating your selection…</p>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-3xl text-espresso mb-3">Nothing found.</p>
          <p className="text-sm text-muted-foreground font-light">Try a different search or category.</p>
        </div>
      ) : (
        <div data-testid="product-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-14">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
