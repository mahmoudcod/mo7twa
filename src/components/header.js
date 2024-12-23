"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeProduct, setActiveProduct] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const router = useRouter();

    // Fetch user data and set active product
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.products) {
            setProducts(userData.products);
            const active = userData.products.find(p => p.isActive && !p.isExpired);
            setActiveProduct(active);
        }
    }, []);

    // Fetch categories and pages without product access check
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://ub.mo7tawa.store/api/categories', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                
                // Only filter for published pages, not by product access
                const categoriesWithPublishedPages = data.categories.map(category => ({
                    ...category,
                    pages: category.pages.filter(page => page.status === 'published')
                })).filter(category => category.pages.length > 0);
                
                setCategories(categoriesWithPublishedPages);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Switch active product
    const handleProductSwitch = (productId) => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedProducts = userData.products.map(p => ({
            ...p,
            isActive: p.productId === productId
        }));
        
        const updatedUserData = {
            ...userData,
            products: updatedProducts
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        setProducts(updatedProducts);
        setActiveProduct(updatedProducts.find(p => p.productId === productId));
        
        // Refresh the current page to update content based on new active product
        router.refresh();
    };

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
    };

    return (
        <header className="responsive-header">
            <div className="header">
                <div className="header-main">
                    <div className="logo-div">
                        <img src="/logo.jpg" alt="Logo" className="logo" />
                    </div>
                    <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
                <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
                    <ul className="nav-list">
                        {categories.map((category) => (
                            <li key={category._id} className="category-item">
                                <div 
                                    className="category-header"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeCategoryId === category._id) {
                                            setActiveCategoryId(null);
                                        } else {
                                            setActiveCategoryId(category._id);
                                        }
                                    }}
                                >
                                    {category.name}
                                    <span className="dropdown-arrow">▼</span>
                                </div>
                                <ul className={`dropdown ${activeCategoryId === category._id ? 'dropdown-open' : ''}`}>
                                    {category.pages.map((page) => (
                                        <li
                                            key={page._id}
                                            className="dropdown-item"
                                            onClick={() => {
                                                router.push(`/pages/${page._id}`);
                                                setIsMenuOpen(false);
                                                setActiveCategoryId(null);
                                            }}
                                        >
                                            {page.name}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="user-controls">
                    <button onClick={handleLogout} className="logout-btn">
                        <FaSignOutAlt className="logout-icon" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .responsive-header {
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .header {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem;
                }

                .header-main {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo {
                    height: 40px;
                    width: auto;
                }

                .menu-toggle {
                    display: none;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #333;
                    padding: 0.5rem;
                }

                .nav {
                    margin-top: 1rem;
                }

                .nav-list {
                    display: flex;
                    gap: 2rem;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .category-item {
                    position: relative;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    transition: color 0.3s;
                }

                .category-item:hover {
                    color: #007bff;
                }

                .dropdown {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-radius: 4px;
                    min-width: 200px;
                    z-index: 1000;
                }

                .dropdown-item {
                    padding: 0.75rem 1rem;
                    transition: background-color 0.3s;
                }

                .dropdown-item:hover {
                    background-color: #f8f9fa;
                }

                .user-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .logout-btn {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: #666;
                    transition: color 0.3s;
                }

                .logout-btn:hover {
                    color: #dc3545;
                }

                .logout-icon {
                    font-size: 1.2rem;
                }

                @media (min-width: 769px) {
                    .category-item:hover .dropdown {
                        display: block;
                    }
                }

                @media (max-width: 768px) {
                    .header {
                        padding: 0.5rem 1rem;
                    }

                    .menu-toggle {
                        display: block;
                    }

                    .nav {
                        display: none;
                        width: 100%;
                        margin-top: 1rem;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        padding: 1rem;
                        transition: all 0.3s ease;
                    }

                    .nav-open {
                        display: block;
                    }

                    .nav-list {
                        flex-direction: column;
                        gap: 0;
                    }

                    .category-item {
                        border-bottom: 1px solid #eee;
                        padding: 0;
                    }

                    .category-item:last-child {
                        border-bottom: none;
                    }

                    .category-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1rem;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }

                    .category-header:hover {
                        background-color: #f8f9fa;
                    }

                    .dropdown {
                        display: none;
                        position: static;
                        background: #f8f9fa;
                        margin: 0;
                        transition: all 0.3s ease;
                    }

                    .dropdown-open {
                        display: block;
                    }

                    .dropdown-item {
                        padding: 0.75rem 2rem;
                        border-top: 1px solid #eee;
                        font-size: 0.95rem;
                        background-color: #fff;
                        transition: background-color 0.3s ease;
                    }

                    .dropdown-item:hover {
                        background-color: #e9ecef;
                    }

                    .dropdown-arrow {
                        font-size: 0.8rem;
                        transition: transform 0.3s ease;
                    }

                    .category-item:has(.dropdown-open) .dropdown-arrow {
                        transform: rotate(180deg);
                    }

                    .user-controls {
                        margin-top: 1rem;
                        justify-content: flex-end;
                        border-top: 1px solid #eee;
                        padding-top: 1rem;
                    }
                }
            `}</style>
        </header>
    );
};

export default Header;
