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
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState(null);
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (aiOutput) {
      const outputSection = document.getElementById('output-section');
      outputSection?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiOutput]);
  const [remainingUsage, setRemainingUsage] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
          if (active) {
            const prevRemainingUsage = remainingUsage;
            setRemainingUsage(active.remainingUsage);
            if (prevRemainingUsage !== active.remainingUsage) {
              setSelectedProduct(active);
            }
          }
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
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchPageData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageId, token, selectedProduct]);

  // Handle product change
  const handleProductChange = (productId) => {
    const active = products.find(p => p.productId === productId);
    setSelectedProduct(active);
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

    if (!promptText.trim() && !file) {
      alert('Please enter text or select a file before generating');
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
      const formData = new FormData();
      if (promptText.trim()) {
        formData.append('userInput', promptText);
      }
      if (file) {
        formData.append('file', file);
      }
      formData.append('instructions', pageData.instructions);
      formData.append('productId', selectedProduct.productId);
      formData.append('pageId', pageId);
      headers['Content-Type'] = 'multipart/form-data';
      const data = formData;

      const response = await axios.post(endpoint, data, { headers });

      if (response.data) {
        if (response.data.output) {
          setAiOutput(response.data.output);
          setPromptText('');
          setFile(null);

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
              ) || [],
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));

            // Update products state
            setProducts((prevProducts) =>
              prevProducts.map((product) =>
                product.productId === selectedProduct.productId
                  ? {
                      ...product,
                      remainingUsage: response.data.remainingUsage,
                      usageCount: response.data.usageCount,
                    }
                  : product
              )
            );
            // Update selectedProduct with new remainingUsage
            setSelectedProduct(prevSelectedProduct => ({
              ...prevSelectedProduct,
              remainingUsage: response.data.remainingUsage,
              usageCount: response.data.usageCount,
            }));
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
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Get the output element
      const element = outputRef.current;
      if (!element) {
        throw new Error('Output element not found');
      }

      // Create a temporary container with proper styling
      const container = document.createElement('div');
      container.style.cssText = `
        width: 800px;
        padding: 40px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        position: fixed;
        top: 0;
        left: -9999px;
      `;

      // Add title and timestamp
      container.innerHTML = `
        <h1 style="font-size: 20px; margin-bottom: 10px;">${pageData.name || 'Generated Document'}</h1>
        <div style="font-size: 10px; margin-bottom: 20px; color: #666;">Generated on: ${new Date().toLocaleString()}</div>
        <div style="font-size: 12px; line-height: 1.5;">${element.innerHTML}</div>
      `;

      // Add to document for proper rendering
      document.body.appendChild(container);

      // Create PDF with proper dimensions
      const doc = new jsPDF({
        format: 'a4',
        unit: 'px',
        hotfixes: ['px_scaling'],
      });

      // Calculate dimensions
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Function to capture and add page
      const captureAndAddPage = async (element, yOffset = 0) => {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800,
          height: Math.min(element.offsetHeight - yOffset, pdfHeight),
          y: yOffset,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.body.querySelector('div');
            clonedElement.style.transform = '';
            clonedElement.style.webkitTransform = '';
          }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        
        return imgHeight;
      };

      // Capture content in multiple pages if needed
      let yOffset = 0;
      const totalHeight = container.offsetHeight;

      while (yOffset < totalHeight) {
        if (yOffset > 0) {
          doc.addPage();
        }

        const pageHeight = await captureAndAddPage(container, yOffset);
        yOffset += pdfHeight;
      }

      // Clean up
      document.body.removeChild(container);

      // Add searchable text layer (invisible)
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(1);
      const searchableText = element.innerText
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .trim();
      doc.text(searchableText, 0, 0);

      // Save PDF
      doc.save(`${pageData.name || 'generated'}-output.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while initial data is being fetched
  if (isInitialLoading) {
    return (
      <div className={styles.loading_container}>
        <div className={styles.loading_spinner}></div>
      </div>
    );
  }

  // If there's an access error after loading, show error message
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
          <div className={styles.input_group}>
            <label className={styles.input_label}>Enter your text :</label>
            <textarea
              className={styles.textarea_field}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type or paste your text here..."
              disabled={loading}
            />
          </div>

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
              <div className={styles.output_actions}>
                <button 
                  className={`${styles.copy_btn} ${copied ? styles.copied : ''}`}
                  onClick={() => {
                    navigator.clipboard.writeText(aiOutput).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  disabled={loading}
                >
                  {copied ? 'Copied!' : 'Copy Output'}
                </button>
                <button 
                  className={styles.export_btn} 
                  onClick={handleExportPDF}
                  disabled={loading}
                >
                  {loading ? 'Exporting...' : 'Export as PDF'}
                </button>
              </div>
            </div>
            <div className={styles.ai_output_box}>
              <div id="output-section" className={styles.formatted_output} ref={outputRef}>
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
