import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ProductCard = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState("yellow");

  const colorOptions = [
    { name: "Yellow Gold", key: "yellow", color: "#E6CA97" },
    { name: "White Gold", key: "white", color: "#D9D9D9" },
    { name: "Rose Gold", key: "rose", color: "#E1A4A9" },
  ];

  const images = [
    product.images.yellow,
    product.images.rose,
    product.images.white,
  ];

  return (
    <div className="product-card">
      {/* Product Image with Swiper */}
      <div className="product-image-container">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="h-full"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <img
                src={image}
                alt={`${product.name} view ${index + 1}`}
                className="product-image"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>

        <div className="product-price">${product.price.toFixed(2)} USD</div>

        {/* Color Selector */}
        <div className="color-picker">
          <p className="color-label">
            {colorOptions.find((c) => c.key === selectedColor)?.name}
          </p>
          <div className="color-options">
            {colorOptions.map((color) => (
              <button
                key={color.key}
                onClick={() => setSelectedColor(color.key)}
                className={`color-option${
                  selectedColor === color.key ? " selected" : ""
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Popularity Rating */}
        <div className="popularity-score">
          <div className="stars">
            <span className="star filled">★</span>
            <span className="score-text">{product.popularityRating}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
