"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';

const Header = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeProduct, setActiveProduct] = useState(null);
    const router = useRouter();

    // Fetch user data and set active product
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                if (!userData || !userData.id) {
                    return;
                }
                const response = await fetch(`https://ub.mo7tawa.store/api/auth/users/${userData.id}/product-access`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.productAccess) {
                    setProducts(data.productAccess.map(access => ({
                        ...access,
                        productId: access.productId._id,
                        productName: access.productId.name
                    })));
                    const active = data.productAccess.find(p => p.isActive && !p.isExpired);
                    setActiveProduct(active);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
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
    const handleProductSwitch = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (!userData || !userData.id) {
                return;
            }
            
            // Update product access on the server
            await Promise.all(products.map(async (product) => {
                await fetch(`https://ub.mo7tawa.store/api/auth/admin/users/${userData.id}/product-access/${product.productId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        isActive: product.productId === productId
                    })
                });
            }));

            // Fetch updated user data
            const response = await fetch(`https://ub.mo7tawa.store/api/auth/users/${userData.id}/product-access`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
             if (data.productAccess) {
                    setProducts(data.productAccess.map(access => ({
                        ...access,
                        productId: access.productId._id,
                        productName: access.productId.name
                    })));
                    const active = data.productAccess.find(p => p.isActive && !p.isExpired);
                    setActiveProduct(active);
                }
            
            // Refresh the current page to update content based on new active product
            router.refresh();
        } catch (error) {
            console.error('Error switching product:', error);
        }
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
                <div className="logo-div">
                    <img src="/logo.jpg" alt="Logo" className="logo" />
                </div>
                <nav className="nav">
                    <ul className="nav-list">
                        {categories.map((category) => (
                            <li key={category._id} className="category-item">
                                {category.name}
                                <ul className="dropdown">
                                    {category.pages.map((page) => (
                                        <li
                                            key={page._id}
                                            className="dropdown-item"
                                            onClick={() => router.push(`/pages/${page._id}`)}
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
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo {
                    height: 40px;
                    width: auto;
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

                .category-item:hover .dropdown {
                    display: block;
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

                .product-switcher {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .product-select {
                    padding: 0.5rem 2rem 0.5rem 1rem;
                    border: 1px solid #e1e1e1;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.9rem;
                    appearance: none;
                    cursor: pointer;
                }

                .switch-icon {
                    position: absolute;
                    right: 0.5rem;
                    pointer-events: none;
                    color: #666;
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

                @media (max-width: 768px) {
                    .header {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .nav-list {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .dropdown {
                        position: static;
                        box-shadow: none;
                        display: none;
                    }

                    .category-item:hover .dropdown {
                        display: block;
                    }

                    .user-controls {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .product-select {
                        width: 100%;
                    }
                }
            `}</style>
        </header>
    );
};

export default Header;
