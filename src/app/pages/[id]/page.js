'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Header from '../../../components/header';
import styles from './page.module.css';

function Pages() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id;
  const outputRef = useRef();

  // State variables
  const [pageData, setPageData] = useState({ name: '', description: '', image: '', instructions: '' });
  const [selectedOption, setSelectedOption] = useState('copyPaste');
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState(null);
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [remainingUsage, setRemainingUsage] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Get user and token from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Initialize products and selected product
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!userData || !userData.id) {
          return;
        }
        const response = await fetch(`https://ub.mo7tawa.store/api/auth/users/${userData.id}/product-access`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }
        const data = await response.json();
        if (data.productAccess && isMounted) {
          const activeProducts = data.productAccess.filter(p => !p.isExpired).map(access => ({
            ...access,
            productId: access.productId._id,
            productName: access.productId.name
          }));
          setProducts(activeProducts);

          // Set the active product as selected, or the first available product
          const active = activeProducts.find(p => p.isActive) || activeProducts[0];
          setSelectedProduct(active);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userData?.id]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchPageData = async () => {
      if (!pageId || !selectedProduct) {
        setAccessError('No active product found or page ID missing');
        return;
      }

      try {
        const response = await axios.get(`https://ub.mo7tawa.store/api/pages/${pageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Product-ID': selectedProduct.productId
          },
          signal: controller.signal
        });

        if (isMounted) {
          setPageData({
            name: response.data.name || '',
            description: response.data.description || '',
            image: response.data.image || '',
            instructions: response.data.userInstructions || '',
          });
          setAccessError(null);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching data:', error);

        if (error.response?.status === 403) {
          setAccessError('You do not have access to this page with the selected product');
        } else {
          setAccessError('An error occurred while fetching page data');
        }
      }
    };

    fetchPageData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageId, token, selectedProduct]);

  // Handle product change
  const handleProductChange = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData || !userData.id) {
        return;
      }

      setLoading(true);

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
        throw new Error('HTTP error! status: ' + response.status);
      }
      const data = await response.json();
      if (data.productAccess) {
        const activeProducts = data.productAccess.filter(p => !p.isExpired).map(access => ({
          ...access,
          productId: access.productId._id,
          productName: access.productId.name
        }));
        setProducts(activeProducts);

        // Set the active product as selected, or the first available product
        const active = activeProducts.find(p => p.isActive) || activeProducts[0];
        setSelectedProduct(active);
      }

      // Refresh the current page to update content based on new active product
      router.refresh();
    } catch (error) {
      console.error('Error switching product:', error);
      alert('Failed to switch product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    // Validate required data
    if (!token) {
      alert('Please log in to use this feature');
      return;
    }

    if (!selectedProduct) {
      alert('No product selected');
      return;
    }

    if (selectedOption === 'copyPaste' && !promptText.trim()) {
      alert('Please enter some text before generating');
      return;
    }

    if (selectedOption === 'fileUpload' && !file) {
      alert('Please select a file before generating');
      return;
    }

    if (!pageData.instructions) {
      alert('Page instructions not loaded. Please try again.');
      return;
    }

    // Check remaining usage
    if (selectedProduct.remainingUsage <= 0) {
      alert('You have no remaining usage for this product');
      return;
    }

    setLoading(true);
    const endpoint = 'https://ub.mo7tawa.store/api/pages/generate';
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Product-ID': selectedProduct.productId
    };

    try {
      let data;
      if (selectedOption === 'copyPaste') {
        data = {
          userInput: promptText,
          instructions: pageData.instructions,
          productId: selectedProduct.productId,
          pageId: pageId
        };
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('instructions', pageData.instructions);
        formData.append('productId', selectedProduct.productId);
        formData.append('pageId', pageId);
        data = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }

      const response = await axios.post(endpoint, data, { headers });

      if (response.data) {
        if (response.data.output) {
          setAiOutput(response.data.output);

          // Update remaining usage in state and localStorage
          if (response.data.remainingUsage !== undefined) {
            setRemainingUsage(response.data.remainingUsage);

            // Update localStorage
            const updatedUserData = {
              ...userData,
              products: userData.products?.map(product =>
                product.productId === selectedProduct.productId
                  ? {
                    ...product,
                    remainingUsage: response.data.remainingUsage,
                    usageCount: response.data.usageCount
                  }
                  : product
              ) || []
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));

            // Update products state
            setProducts(prevProducts =>
              prevProducts.map(product =>
                product.productId === selectedProduct.productId
                  ? {
                    ...product,
                    remainingUsage: response.data.remainingUsage,
                    usageCount: response.data.usageCount
                  }
                  : product
              )
            );
          }
        } else {
          console.error('Missing output in response:', response.data);
          alert('Server response is missing required data');
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('An error occurred while generating the response');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(pageData.name || 'Generated Document', 20, 20);

      // Add timestamp
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

      // Add content
      doc.setFontSize(12);
      const splitOutput = doc.splitTextToSize(aiOutput.replace(/\*\*/g, '\n'), 170);
      doc.text(splitOutput, 20, 40);

      // Save the PDF
      doc.save(`${pageData.name || 'generated'}-output.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If there's an access error, show error message
  if (accessError) {
    return (
      <div className={styles.error_page}>
        <div className={styles.error_content}>
          <div className={styles.error_icon_wrapper}>
            <svg className={styles.error_icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className={styles.error_title}>Access Denied</h1>
          <p className={styles.error_message}>{accessError}</p>

          <div className={styles.error_actions}>
            <button className={styles.primary_button} onClick={() => router.push('/')}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while initial data is being fetched
  if (!pageData.name && !accessError) {
    return (
      <div className={styles.loading_container}>
        <div className={styles.loading_spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <section className={styles.section_one}>
        <h1 className={styles.page_title}>{pageData.name}</h1>
        {pageData.image && (
          <img src={pageData.image} alt={pageData.name} className={styles.page_image} />
        )}
        <ReactMarkdown className={styles.page_description}>{pageData.description}</ReactMarkdown>
      </section>

      <section className={styles.section_two}>
        {/* Product Selector */}
        {products.length > 1 && (
          <div className={styles.product_selector}>
            <label htmlFor="product-select">Select Product:</label>
            <select
              id="product-select"
              value={selectedProduct?.productId || ''}
              onChange={(e) => handleProductChange(e.target.value)}
              className={styles.product_select}
              disabled={loading}
            >
              {products.map(product => (
                <option
                  key={product.productId}
                  value={product.productId}
                  disabled={product.isExpired}
                >
                  {product.productName} ({product.remainingUsage} credits)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Remaining Usage Display */}
        <div className={styles.usage_info}>
          <div className={styles.usage_badge}>
            <span>Credits Remaining:</span>
            <span className={styles.usage_count}>
              {selectedProduct?.remainingUsage || 0}
            </span>
          </div>
        </div>

        <div className={styles.input_section}>
          <div className={styles.radio_group}>
            <label className={styles.radio_label}>
              <input
                type="radio"
                value="copyPaste"
                checked={selectedOption === 'copyPaste'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={styles.radio_input}
                disabled={loading}
              />
              <span className={styles.radio_text}>Copy & Paste Text</span>
            </label>
            <label className={styles.radio_label}>
              <input
                type="radio"
                value="fileUpload"
                checked={selectedOption === 'fileUpload'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className={styles.radio_input}
                disabled={loading}
              />
              <span className={styles.radio_text}>Upload File</span>
            </label>
          </div>

          {selectedOption === 'copyPaste' ? (
            <div className={styles.input_group}>
              <label className={styles.input_label}>Enter your text:</label>
              <textarea
                className={styles.textarea_field}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type or paste your text here..."
                disabled={loading}
              />
            </div>
          ) : (
            <div className={styles.input_group}>
              <label className={styles.input_label}>Upload your file:</label>
              <div className={styles.file_upload_container}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className={styles.file_input}
                  id="file-upload"
                  disabled={loading}
                />
                <label htmlFor="file-upload" className={styles.file_upload_label}>
                  {file ? file.name : 'Choose a file'}
                </label>
              </div>
            </div>
          )}

          <button
            className={`${styles.generate_btn} ${(loading || !selectedProduct || selectedProduct.remainingUsage <= 0) ? styles.disabled : ''}`}
            onClick={handleGenerate}
            disabled={loading || !selectedProduct || selectedProduct.remainingUsage <= 0}
          >
            {loading ? (
              <span className={styles.loading_text}>
                <span className={styles.loading_spinner}></span>
                Generating...
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {aiOutput && (
          <div className={styles.output_section}>
            <div className={styles.output_header}>
              <h2>Generated Output</h2>
              <button 
                className={styles.export_btn} 
                onClick={handleExportPDF}
                disabled={loading}
              >
                {loading ? 'Exporting...' : 'Export as PDF'}
              </button>
            </div>
            <div className={styles.ai_output_box}>
              <div className={styles.formatted_output} ref={outputRef}>
                <ReactMarkdown>{aiOutput}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Pages;
