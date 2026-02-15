import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Tag,
  Globe,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const partnerInfo = {
  name: "IMK Cargo & Logistics",
  tagline: "Clearing & Forwarding LLC",
  headline: "Trusted clearing, forwarding, and cargo support.",
  phone: "+232-76-123-456",
  email: "info@imkmarket.com",
  website: "https://imkmarket.com",
};

const adSlides = [
  {
    id: "fast",
    title: "Fast Delivery",
    description: "Get products delivered quickly with priority shipping.",
    cta: "Shop Fast",
    href: "/products",
  },
  {
    id: "global",
    title: "Global Shipping",
    description: "Door-to-door delivery in 14-30 days worldwide.",
    cta: "See Regions",
    href: "/about",
  },
  {
    id: "deals",
    title: "Weekly Deals",
    description: "Save up to 35% on top categories every week.",
    cta: "View Deals",
    href: "/products",
  },
  {
    id: "verified",
    title: "Verified Sellers",
    description: "Shop confidently with trusted merchants and secure payments.",
    cta: "Learn More",
    href: "/about",
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "Chat with IMK-Market support anytime you need help.",
    cta: "Contact Us",
    href: "/contact",
  },
];

const routeHighlights = [
  {
    id: "dubai",
    tag: "Dubai Express",
    title: "Dubai to Sierra Leone",
    description: "Priority air and sea lanes with fast customs clearance.",
  },
  {
    id: "china",
    tag: "China Supply",
    title: "China to Sierra Leone",
    description: "Factory-direct inventory with reliable shipping windows.",
  },
  {
    id: "uk",
    tag: "UK Market",
    title: "UK to Sierra Leone",
    description: "Quality goods shipped weekly with secure packaging.",
  },
];

const partnerStats = [
  { value: "10,000+", label: "Products" },
  { value: "25,000+", label: "Customers" },
  { value: "98%", label: "Satisfaction" },
];

const routePerformance = [
  { id: "dubai", onTime: "98%", coverage: "96%" },
  { id: "china", onTime: "95%", coverage: "91%" },
  { id: "uk", onTime: "93%", coverage: "88%" },
];

const longSlides = [
  { id: "partners", label: "Partner Logistics Group" },
  { id: "routes", label: "Global Routes Group" },
  { id: "more-info", label: "Other Information Group" },
  { id: "overview", label: "Classic Overview Group" },
] as const;

export function HeroBanner() {
  const [activeLongSlide, setActiveLongSlide] = useState(0);
  const [activeAdSlide, setActiveAdSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const activePromo = adSlides[activeAdSlide];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    if ("addEventListener" in media) {
      media.addEventListener("change", update);
    } else {
      // @ts-expect-error legacy API fallback
      media.addListener(update);
    }
    return () => {
      if ("removeEventListener" in media) {
        media.removeEventListener("change", update);
      } else {
        // @ts-expect-error legacy API fallback
        media.removeListener(update);
      }
    };
  }, []);

  const longSlideInterval = isMobile ? 6400 : 5000;
  const adInterval = isMobile ? 4300 : 3200;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveLongSlide((current) => (current + 1) % longSlides.length);
    }, longSlideInterval);
    return () => window.clearInterval(timer);
  }, [longSlideInterval]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAdSlide((current) => (current + 1) % adSlides.length);
    }, adInterval);
    return () => window.clearInterval(timer);
  }, [adInterval]);

  const showPreviousLongSlide = () => {
    setActiveLongSlide((current) => (current - 1 + longSlides.length) % longSlides.length);
  };

  const showNextLongSlide = () => {
    setActiveLongSlide((current) => (current + 1) % longSlides.length);
  };

  return (
    <section className="relative overflow-hidden bg-primary min-h-[260px]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1549492423-400259a2e574?w=1920&h=800&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />

      <div className="relative mx-auto w-full max-w-[1880px] px-3 md:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="grid md:grid-cols-[0.8fr_1.2fr] lg:grid-cols-[0.68fr_1.32fr] gap-2.5 lg:gap-3.5 items-start md:items-center py-1.5 lg:py-2.5">
          <div className="space-y-1.5 text-center lg:text-left animate-slide-up">
            <h1 className="text-xl md:text-2xl lg:text-[2.05rem] font-bold tracking-tight text-primary-foreground leading-tight">
              Welcome To
              <span className="block">
                <span className="text-primary-foreground">IMK-</span>
                <span className="text-accent">Market</span>
              </span>
            </h1>

            <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl mx-auto lg:mx-0">
              Your international marketplace connecting buyers and sellers across borders.
              Buy and sell with secure transactions and reliable delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start">
              <Link to="/order">
                <Button variant="hero" size="sm" className="gap-1.5">
                  <ShoppingBag className="h-4 w-4" />
                  Order Products
                </Button>
              </Link>
              <Link to="/sell">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5"
                >
                  <Tag className="h-4 w-4" />
                  Sell Your Products
                </Button>
              </Link>
            </div>

            <div className="flex justify-center lg:justify-start gap-3 pt-0.5">
              {partnerStats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-base md:text-lg font-bold text-accent">{stat.value}</p>
                  <p className="text-xs md:text-sm text-primary-foreground/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="relative h-[202px] sm:h-[216px] md:h-[230px] lg:h-[242px] rounded-3xl overflow-hidden bg-card shadow-2xl">
              <div className="absolute right-1.5 top-1.5 z-20 flex items-center gap-1">
                <button
                  type="button"
                  onClick={showPreviousLongSlide}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNextLongSlide}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  activeLongSlide === 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-primary/85 to-accent/45" />
              <div className="relative h-full grid grid-cols-[1.04fr_0.96fr] gap-1.5 p-2">
                <div className="rounded-2xl border border-accent/25 bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-foreground flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        <Truck className="h-3 w-3" />
                        Partner Logistics
                      </p>
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        IMK Brand
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm sm:text-base font-bold leading-tight">{partnerInfo.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{partnerInfo.tagline}</p>
                    <p className="mt-1 text-[11px] text-foreground/80 leading-tight">{partnerInfo.headline}</p>
                  </div>

                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {partnerStats.map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-primary/10 px-1 py-0.5">
                        <p className="text-[11px] font-bold text-accent leading-none">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1 py-0.5 text-foreground/80">
                      <Phone className="h-3.5 w-3.5 text-accent" />
                      {partnerInfo.phone}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1 py-0.5 text-foreground/80">
                      <Mail className="h-3.5 w-3.5 text-accent" />
                      {partnerInfo.email}
                    </span>
                    <a
                      href={partnerInfo.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1 py-0.5 text-accent hover:text-accent/80"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Visit Website
                    </a>
                  </div>
                </div>

                <div className="grid grid-rows-[1.2fr_0.8fr] gap-1.5 min-h-0">
                  <div className="min-h-0 rounded-2xl border border-primary/20 bg-gradient-to-br from-white/95 to-primary/10 p-2.5 shadow-xl overflow-y-auto">
                    <div className="flex items-center justify-between gap-1">
                      <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        Route Coverage
                      </p>
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                        Live
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {routeHighlights.map((route, index) => (
                        <div key={route.id} className="rounded-lg bg-primary/10 px-1.5 py-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] font-semibold text-foreground leading-tight">{route.tag}</p>
                            <span className="text-[9px] font-semibold text-primary">
                              {routePerformance[index]?.onTime ?? "95%"} on-time
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className="text-[9px] text-muted-foreground leading-tight">{route.title}</p>
                            <span className="text-[8px] font-semibold text-foreground/70">
                              {routePerformance[index]?.coverage ?? "90%"} coverage
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/25 via-accent/10 to-primary/15 p-2.5 shadow-xl overflow-y-auto">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        IMK-Market Promo
                      </p>
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-foreground leading-tight">{activePromo.title}</h3>
                    <p className="mt-0.5 text-[11px] text-foreground/80 leading-tight">{activePromo.description}</p>
                    <Link
                      to={activePromo.href}
                      className="inline-block text-[11px] font-semibold text-accent hover:text-accent/80 mt-1"
                    >
                      {activePromo.cta} -&gt;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  activeLongSlide === 1 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              <div className="absolute inset-0">
                <img
                  src="/branding/world-map.svg"
                  alt="World map routes"
                  className="w-full h-full object-cover opacity-95"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
              </div>

              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1000 500"
                preserveAspectRatio="none"
              >
                <path
                  d="M220 170 C300 190, 360 220, 420 260"
                  stroke="hsl(var(--accent))"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8 10"
                  opacity="0.85"
                  className="route-dash route-fast"
                />
                <path
                  d="M450 140 C450 190, 440 225, 420 260"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="7 12"
                  opacity="0.75"
                  className="route-dash route-mid"
                />
                <path
                  d="M570 200 C535 220, 485 240, 420 260"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="7 12"
                  opacity="0.7"
                  className="route-dash route-slow"
                />
                <path
                  d="M700 190 C640 210, 520 240, 420 260"
                  stroke="hsl(var(--accent))"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="8 12"
                  opacity="0.7"
                  className="route-dash route-mid"
                />
                <g className="route-pulse">
                  <circle cx="220" cy="170" r="6" fill="hsl(var(--accent))" />
                  <circle cx="220" cy="170" r="12" fill="hsl(var(--accent))" opacity="0.2" />
                </g>
                <g className="route-pulse route-delay-1">
                  <circle cx="450" cy="140" r="6" fill="hsl(var(--primary))" />
                  <circle cx="450" cy="140" r="12" fill="hsl(var(--primary))" opacity="0.2" />
                </g>
                <g className="route-pulse route-delay-2">
                  <circle cx="570" cy="200" r="6" fill="hsl(var(--primary))" />
                  <circle cx="570" cy="200" r="12" fill="hsl(var(--primary))" opacity="0.2" />
                </g>
                <g className="route-pulse route-delay-3">
                  <circle cx="700" cy="190" r="6" fill="hsl(var(--accent))" />
                  <circle cx="700" cy="190" r="12" fill="hsl(var(--accent))" opacity="0.2" />
                </g>
                <g className="route-pulse route-delay-4">
                  <circle cx="420" cy="260" r="7" fill="hsl(var(--accent))" />
                  <circle cx="420" cy="260" r="14" fill="hsl(var(--accent))" opacity="0.22" />
                </g>
              </svg>

              <div className="relative h-full p-2.5 text-white flex flex-col justify-between overflow-y-auto">
                <div>
                  <h3 className="text-sm sm:text-lg font-bold">Global Routes to Sierra Leone</h3>
                  <p className="text-xs sm:text-sm text-white/85 mt-1">
                    Dubai, China, USA and UK shipping lanes with fast clearance.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-1.5">
                  {routeHighlights.map((route) => (
                    <div key={route.id} className="rounded-xl bg-black/40 backdrop-blur px-2.5 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-accent">{route.tag}</p>
                      <p className="text-[11px] font-semibold mt-1">{route.title}</p>
                      <p className="text-[10px] text-white/75 mt-1">{route.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  activeLongSlide === 2 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-secondary/80 to-accent/40" />
              <div className="relative h-full p-2.5 text-white flex flex-col overflow-y-auto">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/80 font-semibold">
                    Other Information
                  </p>
                  <h3 className="text-sm sm:text-lg font-bold mt-1">IMK-Market Highlights</h3>
                  <p className="text-xs sm:text-sm text-white/85 mt-1">
                    All the remaining marketplace updates in one slide.
                  </p>
                </div>

                <div className="mt-1.5 flex gap-1 overflow-x-auto pb-1 pr-1">
                  {adSlides.map((ad) => (
                    <div
                      key={ad.id}
                      className="min-w-[140px] sm:min-w-[156px] rounded-xl bg-black/35 backdrop-blur px-2 py-1.5 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-accent">
                          IMK-Market Promo
                        </p>
                        <p className="text-[11px] font-semibold mt-1">{ad.title}</p>
                        <p className="text-[10px] text-white/80 mt-1">{ad.description}</p>
                      </div>
                      <Link to={ad.href} className="text-[10px] font-semibold text-accent mt-1.5">
                        {ad.cta} -&gt;
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  activeLongSlide === 3 ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/75" />
              <div className="relative h-full p-2.5 text-white">
                <div className="h-full rounded-2xl bg-black/20 backdrop-blur px-2.5 py-2 flex flex-col overflow-y-auto">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-accent font-semibold">
                        Overview
                      </p>
                      <h3 className="text-sm sm:text-base font-bold mt-0.5">Route + Promo Summary</h3>
                    </div>
                    <div className="text-right text-[10px] text-white/80">
                      <p>{partnerInfo.phone}</p>
                      <p>{partnerInfo.email}</p>
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-white/85 mt-1">
                    Partner details and quick stats were moved to the Partners slide for cleaner viewing.
                  </p>

                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] flex-1 min-h-0">
                    <div className="rounded-lg bg-white/10 p-2 overflow-y-auto">
                      <p className="uppercase tracking-wide text-accent font-semibold">
                        Route Highlights
                      </p>
                      <div className="mt-1 space-y-1">
                        {routeHighlights.map((route) => (
                          <div key={route.id}>
                            <p className="font-semibold">{route.title}</p>
                            <p className="text-white/75">{route.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/10 p-2 overflow-y-auto">
                      <p className="uppercase tracking-wide text-accent font-semibold">
                        IMK-Market Promo
                      </p>
                      <div className="mt-1 space-y-1">
                        {adSlides.map((ad) => (
                          <p key={ad.id} className="text-white/90 leading-tight">
                            <span className="font-semibold">{ad.title}:</span> {ad.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

