'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt } from 'react-icons/fa'; // Import the logout icon

const Header = () => {
    const [categories, setCategories] = useState([]);
    const router = useRouter();

    // Fetch categories and pages
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('https://mern-ordring-food-backend.onrender.com/api/categories');
                const data = await response.json();
                setCategories(data.categories);
                console.log(data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Assuming 'authToken' is the key used for storing the token
        router.push('/auth/login'); // Redirect to login page
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
                        <FaSignOutAlt className="logout-icon" /> {/* Use the logout icon */}
                    </button>
                </div>
            </div>
        </header>
    );      
};

export default Header;
