import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import Marquee from "../components/Marquee";

const HERO_IMG = "https://images.unsplash.com/photo-1622444913718-dde4471ce697?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85";
const STORY_IMG = "https://images.pexels.com/photos/4456716/pexels-photo-4456716.jpeg?auto=compress&cs=tinysrgb&w=1200";
const MAKEUP_IMG = "/assets/hlskin-hero.png";
const SPA_IMG = "https://images.pexels.com/photos/36327500/pexels-photo-36327500.jpeg?auto=compress&cs=tinysrgb&w=1200";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    api.get("/products?sort=recent").then(({ data }) => {
      const items = data.items || [];
      setNewArrivals(items.filter((p) => p.tag === "new").slice(0, 4));
      setFeatured(items.filter((p) => p.tag === "bestseller" || p.tag === "clearance").slice(0, 8));
    });
  }, []);

  return (
    <div className="bg-bone">
      {/* HERO */}
      <section data-testid="hero-section" className="relative min-h-[100vh] grid grid-cols-1 lg:grid-cols-12 pt-24 lg:pt-32 px-6 sm:px-10 max-w-[1400px] mx-auto gap-8 lg:gap-12">
        <div className="lg:col-span-6 flex flex-col justify-center reveal">
          <p className="overline text-terracotta mb-6">Lebville Boutique & Spa — Gaborone</p>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] text-espresso tracking-tight">
            Where elegance<br />
            <em className="text-terracotta font-light">meets</em><br />
            exclusivity.
          </h1>
          <p className="mt-8 max-w-md text-base font-light leading-relaxed text-muted-foreground">
            Curated boutique fashion, HL cosmetics, and quiet wellness — designed for the woman
            who knows what she wants, and refuses anything less.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <Link
              to="/shop"
              data-testid="hero-shop-btn"
              className="btn-sharp bg-espresso text-bone px-9 py-4 hover:bg-terracotta transition-colors inline-flex items-center gap-3"
            >
              Explore the shop <ArrowRight size={14} />
            </Link>
            <Link to="/shop?category=cosmetics" className="btn-sharp text-espresso underline underline-offset-[6px] hover:text-terracotta">
              Discover HL/SKIN
            </Link>
          </div>
        </div>
        <div className="lg:col-span-6 relative reveal" style={{ animationDelay: "0.2s" }}>
          <div className="relative aspect-[4/5] lg:aspect-auto lg:h-[78vh] overflow-hidden">
            <img src={HERO_IMG} alt="Editorial fashion" className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:block absolute -left-12 bottom-10 bg-bone py-3 pl-3 pr-6 border-l-2 border-terracotta">
            <p className="overline text-terracotta">Issue 01</p>
            <p className="font-serif text-xl text-espresso">The Couture Edit</p>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="mt-24"><Marquee /></section>

      {/* FEATURED COLLECTIONS — TETRIS */}
      <section data-testid="collections-section" className="max-w-[1400px] mx-auto px-6 sm:px-10 py-24 sm:py-32">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
          <div>
            <p className="overline text-terracotta mb-3">The Edit</p>
            <h2 className="font-serif text-4xl sm:text-6xl text-espresso leading-[0.95]">Categories<br /><em className="text-muted-foreground">worth knowing.</em></h2>
          </div>
          <Link to="/shop" className="btn-sharp text-espresso hover:text-terracotta inline-flex items-center gap-2">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <Link to="/shop?category=clothing" className="group md:col-span-7 md:row-span-2 relative overflow-hidden aspect-[4/5] md:aspect-auto md:min-h-[680px]">
            <img src={STORY_IMG} alt="Clothing" className="absolute inset-0 w-full h-full object-cover product-card-img" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-bone">
              <p className="overline opacity-80 mb-3">01 — Clothing</p>
              <h3 className="font-serif text-4xl sm:text-5xl mb-4">The Wardrobe Curated.</h3>
              <span className="overline group-hover:underline underline-offset-4">Browse →</span>
            </div>
          </Link>
          <Link to="/shop?category=cosmetics" className="group md:col-span-5 relative overflow-hidden aspect-[4/3]">
            <img src={MAKEUP_IMG} alt="NORA Cosmetics" className="absolute inset-0 w-full h-full object-cover product-card-img" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-bone">
              <p className="overline opacity-80 mb-2">02 — Cosmetics</p>
              <h3 className="font-serif text-3xl sm:text-4xl">HL/SKIN Beauty.</h3>
            </div>
          </Link>
          <Link to="/shop?category=cosmetics" className="group md:col-span-5 relative overflow-hidden aspect-[4/3]">
            <img src={SPA_IMG} alt="Spa & Skincare" className="absolute inset-0 w-full h-full object-cover product-card-img" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-bone">
              <p className="overline opacity-80 mb-2">03 — Wellness</p>
              <h3 className="font-serif text-3xl sm:text-4xl">Skincare Rituals.</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <section data-testid="featured-products" className="bg-sand/20 py-24 sm:py-32">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
              <div>
                <p className="overline text-terracotta mb-3">Featured</p>
                <h2 className="font-serif text-4xl sm:text-5xl text-espresso">Most-loved pieces.</h2>
              </div>
              <Link to="/shop" className="btn-sharp text-espresso hover:text-terracotta inline-flex items-center gap-2">
                Shop all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BRAND STORY */}
      <section data-testid="story-section" className="max-w-[1400px] mx-auto px-6 sm:px-10 py-24 sm:py-32 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 md:sticky md:top-32 self-start">
          <p className="overline text-terracotta mb-4">The House</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-espresso leading-[1] mb-6">
            A studio, a sanctuary,<br />a Gaborone original.
          </h2>
        </div>
        <div className="md:col-span-7 space-y-6 text-base font-light leading-relaxed text-foreground/85 dropcap">
          <p>
            Lebville Boutique & Spa was founded with a quiet thesis — that beauty, fashion, and wellness
            should empower individuality, not erase it. Every piece on our floor is selected for its
            ability to make a woman feel unapologetically herself.
          </p>
          <p>
            Our boutique stocks limited-run designer pieces alongside our signature HL/SKIN cosmetics line —
            developed with rich pigments, weightless finishes, and tones engineered to complement African skin.
          </p>
          <p>
            The spa is the soul of the house. Facial care, hands and feet, hair — moments of stillness
            tucked into the rhythm of a busy life.
          </p>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section data-testid="services-section" className="bg-espresso text-bone py-24 sm:py-32">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <p className="overline text-terracotta mb-4">Our Services</p>
              <h2 className="font-serif text-5xl sm:text-7xl leading-tight">The <em className="italic font-light text-terracotta">Sanctuary</em> Experience.</h2>
            </div>
            <p className="max-w-xs text-bone/60 font-light text-sm leading-relaxed">
              From signature manicures to deep-tissue stillness, we offer a curated menu of treatments designed to restore and refine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group reveal" style={{ animationDelay: "0.1s" }}>
              <div className="aspect-[4/5] overflow-hidden mb-6">
                <img src="/assets/service-manicure.png" alt="Signature Manicure" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <p className="overline text-terracotta mb-2">Hands & Feet</p>
              <h3 className="font-serif text-2xl mb-3">Signature Manicures</h3>
              <p className="text-sm text-bone/50 font-light leading-relaxed">Precision shaping, cuticle care, and high-performance lacquer in our signature red or custom shades.</p>
            </div>

            <div className="group reveal" style={{ animationDelay: "0.2s" }}>
              <div className="aspect-[4/5] overflow-hidden mb-6">
                <img src="/assets/service-facial.png" alt="Bespoke Facials" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <p className="overline text-terracotta mb-2">Skin Therapy</p>
              <h3 className="font-serif text-2xl mb-3">Bespoke Facials</h3>
              <p className="text-sm text-bone/50 font-light leading-relaxed">Deep cleansing and hydration treatments tailored to your unique skin profile using premium active botanicals.</p>
            </div>

            <div className="group reveal" style={{ animationDelay: "0.3s" }}>
              <div className="aspect-[4/5] overflow-hidden mb-6">
                <img src="/assets/service-massage.png" alt="Body Wellness" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <p className="overline text-terracotta mb-2">Quiet Wellness</p>
              <h3 className="font-serif text-2xl mb-3">Holistic Massage</h3>
              <p className="text-sm text-bone/50 font-light leading-relaxed">Release tension with our signature hot stone or deep tissue massage in a restorative, dim-lit sanctuary.</p>
            </div>
          </div>
        </div>
      </section>


      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section data-testid="new-arrivals" className="max-w-[1400px] mx-auto px-6 sm:px-10 pb-24 sm:pb-32">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
            <div>
              <p className="overline text-terracotta mb-3">Just In</p>
              <h2 className="font-serif text-4xl sm:text-5xl text-espresso">New arrivals.</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIAL */}
      <section className="relative bg-espresso text-bone py-24 sm:py-32 overflow-hidden">
        <div className="grain absolute inset-0" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="font-serif italic text-3xl sm:text-5xl leading-[1.1] mb-8">
            "Excellent quality, fast delivery, and the most considered selection in Gaborone.
            Lebville never disappoints."
          </p>
          <p className="overline text-bone/60">— Maya K. · Verified customer</p>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 py-24 sm:py-32 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
        <div>
          <p className="overline text-terracotta mb-3">Stay close</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-espresso leading-[1]">
            Letters from the house.
          </h2>
          <p className="mt-6 text-muted-foreground font-light max-w-md">
            New drops, private events, and members-only edits — once a month, never more.
          </p>
        </div>
        <form
          data-testid="newsletter-form"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you. You're on the list.");
          }}
          className="flex items-end gap-4 border-b border-espresso/30 pb-2"
        >
          <input
            type="email"
            required
            placeholder="your@email.com"
            data-testid="newsletter-email"
            className="flex-1 bg-transparent text-base font-light py-3 focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button data-testid="newsletter-submit" className="btn-sharp text-espresso hover:text-terracotta">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
