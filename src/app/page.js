import React from "react";
import Header from "@/components/header";

const products = [
  {
    id: 1,
    name: "Product 1",
    description: "This is a great product.",
    price: "$30",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    id: 2,
    name: "Product 2",
    description: "This product is awesome.",
    price: "$40",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "Product 3",
    description: "You'll love this product.",
    price: "$50",
    imageUrl: "https://via.placeholder.com/150",
  },
];

const ProductsPage = () => {
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.imageUrl} alt={product.name} className="product-image" />
            <h2 className="product-name">{product.name}</h2>
            <p className="product-description">{product.description}</p>
            <p className="product-price">{product.price}</p>
            <button className="add-to-cart-button">Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;
