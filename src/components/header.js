"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa';

const Header = () => {
    const [categories, setCategories] = useState([]);
    const router = useRouter();

    // Fetch categories and pages
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                console.log('API Response:', data);
                
                // Filter out any categories that have no published pages
                const publishedCategories = data.categories.filter(category => 
                    category.pages.some(page => page.status === 'published')
                );
                console.log('Published Categories:', publishedCategories);
                
                // For the remaining categories, only include their published pages
                const categoriesWithPublishedPages = publishedCategories.map(category => ({
                    ...category,
                    pages: category.pages.filter(page => page.status === 'published')
                }));
                console.log('Categories with Published Pages:', categoriesWithPublishedPages);
                
                setCategories(categoriesWithPublishedPages);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        router.push('/auth/login');
    };

    return (
        <header>
            <div className="header">
                <div className="logo-div">
                    <img src="/logo.jpg" alt="Logo" className="logo" />
                </div>
                <nav className="nav">
                    <ul className="nav-list">
                        {categories.map((category) => (
                            <li key={category.id} className="category-item">
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
                <div className="logout">
                    <button onClick={handleLogout} className="logout-btn">
                        <FaSignOutAlt className="logout-icon" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;