import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedColors, setSelectedColors] = useState({});

  // Number of products to show per slide
  const productsPerSlide = 4;

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data.products);

        // Initialize selected colors (default to 'yellow')
        const initialColors = {};
        data.products.forEach((product, index) => {
          initialColors[index] = "yellow";
        });
        setSelectedColors(initialColors);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle color selection
  const handleColorChange = (productIndex, color) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productIndex]: color,
    }));
  };

  // Calculate total slides needed
  const totalSlides = Math.ceil(products.length / productsPerSlide);

  // Navigate carousel
  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Handle touch events for mobile swiping
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  // Color options
  const colorOptions = [
    { key: "yellow", label: "Yellow Gold", color: "#E6CA97" },
    { key: "white", label: "White Gold", color: "#D9D9D9" },
    { key: "rose", label: "Rose Gold", color: "#E1A4A9" },
  ];

  // Render stars for popularity score
  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="star filled">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      );
    }

    const remainingStars = 5 - Math.ceil(score);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star empty">
          ☆
        </span>
      );
    }

    return stars;
  };

  // Group products into slides
  const getProductsForSlide = (slideIndex) => {
    const startIndex = slideIndex * productsPerSlide;
    const endIndex = startIndex + productsPerSlide;
    return products.slice(startIndex, endIndex);
  };

  // Progress bar'ı mouse ile kaydırmak için
  const progressRef = React.useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newIndex = Math.floor(percent * totalSlides);
    setCurrentSlideIndex(newIndex);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newIndex = Math.floor(percent * totalSlides);
    setCurrentSlideIndex(newIndex);
  };

  React.useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error loading products</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="carousel-container">
        <div className="header">
          <h1 className="avenir-book-45">Product List</h1>
        </div>
        <div className="carousel-wrapper">
          <button className="carousel-btn prev" onClick={prevSlide}>
            ‹
          </button>

          <div
            className="carousel"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="carousel-slide">
                  <div className="products-grid">
                    {getProductsForSlide(slideIndex).map(
                      (product, productIndex) => {
                        const globalIndex =
                          slideIndex * productsPerSlide + productIndex;
                        return (
                          <div key={globalIndex} className="product-card">
                            <div className="product-image-container">
                              <img
                                src={
                                  product.images[
                                    selectedColors[globalIndex] || "yellow"
                                  ]
                                }
                                alt={product.name}
                                className="product-image"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="image-error"
                                style={{ display: "none" }}
                              >
                                <span>Image not available</span>
                              </div>
                            </div>

                            <div className="product-info">
                              <h3 className="product-title montserrat-medium-15">
                                {product.name}
                              </h3>
                              <p className="product-price montserrat-regular-15">
                                ${product.price.toFixed(2)} USD
                              </p>

                              <div className="color-picker">
                                <div className="color-options">
                                  {colorOptions.map((option) => (
                                    <button
                                      key={option.key}
                                      className={`color-option ${
                                        selectedColors[globalIndex] ===
                                        option.key
                                          ? "selected"
                                          : ""
                                      }`}
                                      style={{ backgroundColor: option.color }}
                                      onClick={() =>
                                        handleColorChange(
                                          globalIndex,
                                          option.key
                                        )
                                      }
                                      title={option.label}
                                    />
                                  ))}
                                </div>
                                <span className="color-label avenir-book-12">
                                  {colorOptions.find(
                                    (opt) =>
                                      opt.key === selectedColors[globalIndex]
                                  )?.label || "Yellow Gold"}
                                </span>
                              </div>

                              <div className="popularity-score">
                                <div className="stars">
                                  {renderStars(product.popularityScoreOutOf5)}
                                </div>
                                <span className="score-text avenir-book-14">
                                  {product.popularityScoreOutOf5}/5
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="carousel-btn next" onClick={nextSlide}>
            ›
          </button>
        </div>

        <div className="carousel-progress">
          <div
            className="progress-track"
            ref={progressRef}
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
            style={{ cursor: "pointer" }}
          >
            <div
              className="progress-bar"
              style={{
                width: `${(1 / totalSlides) * 100}%`,
                transform: `translateX(${
                  (currentSlideIndex / totalSlides) * 100 * totalSlides
                }%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
