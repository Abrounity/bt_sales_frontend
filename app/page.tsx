'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { useProducts } from '@/hooks/useProducts';

const heroImages = [
  {
    src: '/images/banner_1.webp',
    alt: 'Smartphone featured in a premium product banner',
  },
  {
    src: '/images/banner_2.webp',
    alt: 'Modern smartphone showcasing its full-screen display',
  },
  {
    src: '/images/banner_3.webp',
    alt: 'Premium laptop for work, creativity, and entertainment',
  },
];




const spotlightProducts = [
  {
    id: "iphone-18-pro",
    title: "Apple iPhone 18 Pro",
    description:
      "Estimated listing for the iPhone 18 Pro. Price and specifications are indicative; please confirm current availability and details before purchase.",
    price: 149900,
    image: "/images/spotlight/iphone-18-pro.webp",
  },
  {
    id: "lg-oled-c3",
    title: 'LG OLED evo C3 55" Smart TV',
    description:
      "Experience picture and sound quality refined by decade-long OLED expertise. Enjoy breathtaking clarity, deep blacks, and a lightning-fast gaming response rate.",
    price: 114990,
    image: "/images/spotlight/lg-oled-tv.webp",
  },
  {
    id: "airpods-pro",
    title: "Apple AirPods Pro (2nd Gen)",
    description:
      "AirPods Pro feature up to 2x more Active Noise Cancellation, plus Adaptive Audio and Transparency mode to hear the world around you.",
    price: 24900,
    image: "/images/spotlight/airpods-pro.webp",
  },
];


export default function HomePage() {
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products, loading, error } = useProducts();

  const spotlightProductIds = ['p13', 'p4', 'p7'];
  const spotlightProducts = spotlightProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);
  const bestSellers = products.filter((product) => product.isBestSeller);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* Hero Banner Slider */}
      <section className="hero-section w-full">
  <div
    className="relative w-full overflow-hidden"
    role="region"
    aria-roledescription="carousel"
    aria-label="Featured product banners"
  >
    {heroImages.map((image, index) => (
      <div
        key={image.src}
        className={`w-full transition-opacity duration-700 ease-in-out ${
          index === activeHeroImage
            ? "relative opacity-100 visible"
            : "absolute inset-0 opacity-0 invisible"
        }`}
        aria-hidden={index !== activeHeroImage}
      >
        <img
          src={image.src}
          alt={image.alt}
          className="block w-full h-auto object-cover"
        />
      </div>
    ))}

    
    <div className="absolute bottom-3 md:bottom-5 left-1/2 
    -translate-x-1/2 z-10 flex items-center gap-2">
      {heroImages.map((image, index) => (
        <button
          key={image.src}
          type="button"
          onClick={() => setActiveHeroImage(index)}
          className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            index === activeHeroImage
              ? "w-7 bg-white"
              : "w-2.5 bg-white/60 hover:bg-white"
          }`}
          aria-label={`Show banner ${index + 1}`}
        />
      ))}
    </div>
  </div>
</section>

      {/* Featured Categories Grid */}
      <section id="categories" className="categories-section container">
        <div className="section-header"  style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-title" style={{ margin: '0 auto' }}>
            <h2>Explore Core Categories</h2>
            <p>Select a category to view authorized stock and best regional pricing</p>
          </div>
        </div>

        <div className="category-cards-grid">
          <Link href="/shop?category=phones" className="cat-card">
            <div className="cat-icon"><i className="fa-solid fa-mobile-screen-button"></i></div>
            <h3>Smartphones & Tablets</h3>
            <p>Apple, Samsung, OnePlus, Vivo, Xiaomi</p>
            <span className="cat-cta">Shop Devices &rarr;</span>
          </Link>



          <Link href="/shop?category=appliances" className="cat-card">
            <div className="cat-icon"><i className="fa-solid fa-soap"></i></div>
            <h3>Home Appliances</h3>
            <p>Bosch, LG, Samsung front & top loaders</p>
            <span className="cat-cta">Shop Home Appliances &rarr;</span>
          </Link>

          <Link href="/shop?category=accessories" className="cat-card">
            <div className="cat-icon"><i className="fa-solid fa-headphones"></i></div>
            <h3>Accessories</h3>
            <p>AirPods, Sony XM5, Bose & Studio Gear</p>
            <span className="cat-cta">Shop Accessories &rarr;</span>
          </Link>

          
        </div>
      </section>

      {/* Trending Devices Spotlight */}
      {/* <section className="spotlight-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="section-title" style={{ margin: '0 auto' }}>
              <h2>Trending Flagship Spotlight</h2>
              <p>Explore our latest flagship listings</p>
            </div>
          </div>

          <div className="spotlight-grid">
            {loading && <p role="status">Loading featured products...</p>}
            {error && <p role="alert">Unable to load products: {error}</p>}
            {spotlightProducts.map((product) => (
              <div className="spotlight-card" key={product.id}>
                <div className="spotlight-badge">{product.badge ?? 'Featured'}</div>
                <div className="spotlight-visual">
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="spotlight-info">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="spotlight-price">
                    ₹{product.price.toLocaleString('en-IN')}
                  </div>
                  <Link
                    href={`/shop?search=${encodeURIComponent(product.title)}`}
                    className="btn btn-outline"
                    style={{ marginTop: '12px', width: '100%', textAlign: 'center' }}
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}


{/* Trending Devices Spotlight */}
<section className="spotlight-section py-12 md:py-16">
  <div className="container mx-auto px-4">

    {/* Section Heading */}
    <div className="text-center mb-10 md:mb-12">
      <div className="section-title">
        <h2>Trending Flagship Spotlight</h2>
        <p>Explore our latest flagship listings</p>
      </div>
    </div>

    {/* Product Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-7 !mt-10">

      {spotlightProducts.map((product) => (
        <div
          key={product.id}
          className="relative flex flex-col items-center text-center
          bg-white border  border-gray-200 rounded-[26px]
          !p-5 sm:p-7 md:p-6 lg:!p-8
          shadow-sm hover:shadow-lg
          transition-all duration-300 hover:-translate-y-1 "
        >

          {/* Product Image */}
          <div className="w-full h-[180px] sm:h-[240px] md:h-[220px]
            lg:h-[200px] flex items-center justify-center mb-5">

            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain"
            />

          </div>

          {/* Product Details */}
          <div className="flex flex-col flex-1 w-full">

            <h3 className="text-xl md:text-lg lg:text-[22px]
              font-bold text-gray-900 mb-4">
              {product.title}
            </h3>

            <p className="text-base md:text-[15px] lg:text-[15px]
              leading-relaxed text-gray-700 mb-2">
              {product.description}
            </p>

            {/* Price */}
            <div className="text-xl font-bold text-red-600 mb-6">
              ₹{product.price.toLocaleString("en-IN")}
            </div>

            {/* View Product Button */}
            <Link
              href={`/shop?search=${encodeURIComponent(product.title)}`}
              className="mt-auto w-full border border-gray-200
              !rounded-xl !py-2 px-4 text-gray-900 font-semibold
              text-[15px] hover:bg-red-600 hover:!text-white
              hover:border-red-600 transition-all duration-300 !mt-4 md:!py-2"
            >
              View Product
            </Link>

          </div>

        </div>
      ))}

    </div>
  </div>
</section>







      {/* Best Sellers Section */}
      <section id="best-sellers" className="container best-sellers-section">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-title" style={{ margin: '0 auto' }}>
            <h2>Best Sellers</h2>
            <p>Our top-rated products handpicked for you</p>
          </div>
        </div>

        <div className="product-grid best-sellers-grid">
          {loading && <p role="status">Loading products...</p>}
          {error && <p role="alert">Unable to load products: {error}</p>}
          {bestSellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={setSelectedProduct}
            />
          ))}
        </div>
      </section>

      {/* Services & Protection Promo */}
      <section className="services-promo-section">
        <div className="container promo-banner-grid">
          <div className="promo-text">
            <span className="promo-tag">Certified Service Center</span>
            <h2>Doorstep Repair & Old Device Exchange Program</h2>
            <p>
              Got a broken display, degraded battery, or wanting to upgrade to the latest phone?
              Our certified technicians offer doorstep repair pick-ups and instant valuation
              for your old gadgets across Greater Noida and Noida.
            </p>
            <div className="promo-buttons">
              <Link href="/contact" className="btn btn-primary">
                Contact Us About Repairs
              </Link>
              <Link href="/contact" className="btn btn-outline" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                Visit Store
              </Link>
            </div>
          </div>
          <div className="promo-features">
            <div className="promo-feat-card">
              <i className="fa-solid fa-screwdriver-wrench"></i>
              <h4>Genuine OEM Parts</h4>
              <p>Original screens, batteries & ICs with 90-day warranty</p>
            </div>
            <div className="promo-feat-card">
              <i className="fa-solid fa-hand-holding-dollar"></i>
              <h4>Instant Buyback</h4>
              <p>Exchange old devices directly toward your new purchase</p>
            </div>
            <div className="promo-feat-card">
              <i className="fa-solid fa-certificate"></i>
              <h4>Brand Authorized</h4>
              <p>Official warranty stamps & GST invoice for claim support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Customer Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-title" style={{ margin: '0 auto' }}>
              <h2>What Our Customers Say</h2>
              <p>Verified reviews from electronics shoppers in Greater Noida and Delhi NCR</p>
            </div>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars" style={{ color: '#f59e0b', marginBottom: '12px' }}>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Bought my iPhone 15 Pro and a Bosch washing machine from BT Sales.
                The staff gave me a direct discount better than online platforms and
                setup doorstep delivery within 4 hours. Highly recommended!"
              </p>
              <div className="testimonial-author">
                <h4>Amit Rawat</h4>
                <span>Greater Noida Customer</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars" style={{ color: '#f59e0b', marginBottom: '12px' }}>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Best exchange valuation for my old Galaxy phone. The estimator on
                their website gave an accurate price, and they deducted it immediately
                at the counter. Seamless experience!"
              </p>
              <div className="testimonial-author">
                <h4>Pooja Sharma</h4>
                <span>Noida Customer</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars" style={{ color: '#f59e0b', marginBottom: '12px' }}>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
              <p className="testimonial-text">
                "Got my OnePlus screen replaced in under 2 hours with a genuine screen
                and official bill. It's a huge relief having an authentic store in
                Commercial Belt Omega 1."
              </p>
              <div className="testimonial-author">
                <h4>Karan Pandey</h4>
                <span>Ghaziabad Customer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Features Banner */}
      <section className="features-footer">
        <div className="container features-footer-grid">
          <div className="feat-foot-item">
            <div className="feat-foot-icon"><i className="fa-solid fa-box-open"></i></div>
            <div className="feat-foot-info">
              <h4>100% Original Products</h4>
              <p>Direct authorized brand supply</p>
            </div>
          </div>
          <div className="feat-foot-item">
            <div className="feat-foot-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="feat-foot-info">
              <h4>Doorstep Repair Service</h4>
              <p>Fast turnaround certified repairs</p>
            </div>
          </div>
          <div className="feat-foot-item">
            <div className="feat-foot-icon"><i className="fa-solid fa-credit-card"></i></div>
            <div className="feat-foot-info">
              <h4>Zero-Down Payment EMI</h4>
              <p>Easy financing on all products</p>
            </div>
          </div>
          <div className="feat-foot-item">
            <div className="feat-foot-icon"><i className="fa-solid fa-arrow-up-right-dots"></i></div>
            <div className="feat-foot-info">
              <h4>Upgrade & Exchange</h4>
              <p>Best buyback price guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
