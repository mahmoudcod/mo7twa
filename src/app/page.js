'use client';

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { useRouter } from 'next/navigation';
import axios from 'axios';

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Please login to view products');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          'http://ub.mo7tawa.store/api/products',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setProducts(response.data.products);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-content">
          <div className="error-icon-wrapper">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="error-title">Access Required</h1>
          <p className="error-message">{error}</p>
          <button className="primary-button" onClick={() => router.push('/auth/login')}>
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-content">
              <h2 className="product-name">{product.name}</h2>
              <p className="product-description">{product.description}</p>
              <p className="product-price">${product.price}</p>
              <button 
                className="action-button buy-product"
                onClick={() => router.push(`/checkout/${product._id}`)}
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .error-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        .error-content {
          text-align: center;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .product-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease;
          padding: 1rem;
          text-align: center;
        }

        .product-card:hover {
          transform: translateY(-4px);
        }

        .product-image-container {
          width: 100%;
          max-width: 300px;
          margin-bottom: 1rem;
        }

        .product-image {
          width: 100%;
          height: auto;
        }

        .product-content {
          text-align: center;
        }

        .product-name {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }

        .product-description {
          color: #666;
          margin-bottom: 0.5rem;
        }

        .product-price {
          font-size: 1.15rem;
          font-weight: 500;
          color: #2563eb;
          margin-bottom: 1rem;
        }

        .action-button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #0070f3;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .action-button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;
