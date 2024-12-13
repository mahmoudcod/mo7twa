'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/header';

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

  // Get user and token from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const activeProduct = userData.products?.find(product => product.isActive && !product.isExpired);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!pageId || !activeProduct) {
        setAccessError('No active product found or page ID missing');
        return;
      }

      try {
        const response = await axios.get(`https://ub.mo7tawa.store/api/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { productId: activeProduct.productId }
        });

        setPageData({
          name: response.data.name,
          description: response.data.description,
          image: response.data.image,
          instructions: response.data.userInstructions,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        
        if (error.response && error.response.status === 403) {
          setAccessError('You do not have access to this page');
        } else {
          setAccessError('An error occurred while fetching page data');
        }
      }
    };

    fetchPageData();
  }, [pageId, token, activeProduct?.productId]);

  const handleGenerate = () => {
    // Validate required data
    if (!token) {
      alert('Please log in to use this feature');
      return;
    }

    if (!activeProduct) {
      alert('No active product found');
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
    if (activeProduct.remainingUsage <= 0) {
      alert('You have no remaining usage for this product');
      return;
    }

    setLoading(true);
    const endpoint = 'https://ub.mo7tawa.store/api/pages/generate';
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    let data;
    if (selectedOption === 'copyPaste') {
      data = { 
        userInput: promptText, 
        instructions: pageData.instructions,
        productId: activeProduct.productId,
        pageId: pageId
      };
    } else {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', pageData.instructions);
      formData.append('productId', activeProduct.productId);
      formData.append('pageId', pageId); 
      data = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    axios
      .post(endpoint, data, { headers })
      .then((response) => {
        
        if (response.data) {
          if (response.data.output) {
            setAiOutput(response.data.output);
            
            // Update remaining usage
            if (response.data.remainingUsage !== undefined) {
              setRemainingUsage(response.data.remainingUsage);
              
              // Update localStorage with new remaining usage
              const updatedUserData = {
                ...userData,
                products: userData.products.map(product => 
                  product.productId === activeProduct.productId 
                    ? { ...product, remainingUsage: response.data.remainingUsage }
                    : product
                )
              };
              localStorage.setItem('user', JSON.stringify(updatedUserData));
            }
          } else {
            console.error('Missing output in response:', response.data);
            alert('Server response is missing required data. Check console for details.');
          }
        } else {
          console.error('Empty response received');
          alert('Received empty response from server');
        }
      })
      .catch((error) => {
        console.error('Full error object:', error);
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          alert(`Server error: ${error.response.data.message || 'Unknown error occurred'}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          alert('No response received from server. Check your internet connection.');
        } else {
          console.error('Error setting up request:', error.message);
          alert('Error setting up request: ' + error.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(pageData.name, 20, 20);
      
      // Add timestamp
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      
      // Add content
      doc.setFontSize(12);
      const splitOutput = doc.splitTextToSize(aiOutput.replace(/\*\*/g, '\n'), 170);
      doc.text(splitOutput, 20, 40);
      
      // Save the PDF
      doc.save(`${pageData.name}-output.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const formatAiOutput = (output) => {
    const sections = output.split('**').filter((section) => section.trim() !== '');

    return (
      <div className="formatted-output">
        {sections.map((section, index) => {
          const [title, content] = section.split(':').map((s) => s.trim());
          if (content) {
            return (
              <div key={index} className="section">
                <h3>{title}</h3>
                {content.split('-').map((item, i) => (
                  <p key={i}>{item.trim()}</p>
                ))}
              </div>
            );
          } else {
            return <h2 key={index}>{title}</h2>;
          }
        })}
      </div>
    );
  };

  // If there's an access error, show error message
  if (accessError || !activeProduct) {
    return (
      <div className="error-page">
        <div className="error-content">
          <div className="error-icon-wrapper">
            {accessError ? (
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          
          <h1 className="error-title">
            {accessError ? 'Access Denied' : 'Subscription Required'}
          </h1>
          
          <p className="error-message">
            {accessError ? accessError : 'You need an active subscription to access this feature'}
          </p>
          
          <div className="error-actions">
            <button 
              className="primary-button" 
              onClick={() => router.push(accessError ? '/' : '/')}
            >
              <span>{accessError ? 'View plans' : 'View Plans'}</span>
              <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
          </div>
        </div>

        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
          }

          .error-content {
            background: white;
            padding: 3rem;
            border-radius: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            text-align: center;
            max-width: 480px;
            width: 100%;
            animation: slideUp 0.5s ease-out;
          }

          .error-icon-wrapper {
            background: ${accessError ? '#FEE2E2' : '#E0E7FF'};
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
          }

          .error-icon {
            width: 40px;
            height: 40px;
            color: ${accessError ? '#DC2626' : '#4F46E5'};
          }

          .error-title {
            color: #1F2937;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }

          .error-message {
            color: #6B7280;
            font-size: 1.125rem;
            line-height: 1.75;
            margin-bottom: 2rem;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }

          .error-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .primary-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: #4F46E5;
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
            width: 100%;
          }

          .primary-button:hover {
            background: #4338CA;
            transform: translateY(-2px);
          }

          .secondary-button {
            background: transparent;
            color: #4F46E5;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            border: 2px solid #E5E7EB;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
            width: 100%;
          }

          .secondary-button:hover {
            border-color: #4F46E5;
            background: #F3F4F6;
          }

          .button-icon {
            width: 20px;
            height: 20px;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 640px) {
            .error-content {
              padding: 2rem;
            }

            .error-title {
              font-size: 1.75rem;
            }

            .error-message {
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // If no active product, show product activation message
  if (!activeProduct) {
    return (
      <div className="container">
        <Header />
        <div className="error-container">
          <div className="error-icon">ℹ️</div>
          <h2>Subscription Required</h2>
          <p className="error-message">You need an active subscription to access this feature. Choose a plan that suits your needs.</p>
          <button className="primary-button" onClick={() => router.push('/products')}>
            View Available Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      <section className="section-one">
        <h1 className="page-title">{pageData.name}</h1>
        <img src={pageData.image} alt={pageData.name} className="page-image" />
        <ReactMarkdown 
          className="page-description"
          components={{
            h1: ({node, ...props}) => <h1 style={{color: '#1a1a1a', fontSize: '2rem', fontWeight: 'bold'}} {...props} />,
            h2: ({node, ...props}) => <h2 style={{color: '#333', fontSize: '1.75rem', fontWeight: 'bold'}} {...props} />,
            h3: ({node, ...props}) => <h3 style={{color: '#555', fontSize: '1.5rem', fontWeight: 'bold'}} {...props} />,
            p: ({node, ...props}) => <p style={{color: '#666', fontSize: '1.1rem', lineHeight: '1.6'}} {...props} />,
            a: ({node, ...props}) => <a style={{color: '#007bff', textDecoration: 'underline'}} target="_blank" {...props} />,
            img: ({node, ...props}) => <img style={{maxWidth: '50%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}} {...props} />
          }}
        >{pageData.description}</ReactMarkdown>
      </section>

      <section className="section-two">
        {/* Remaining Usage Display */}
        <div className="usage-info">
          <div className="usage-badge">
            <span>Credits Remaining:</span>
            <span className="usage-count">{activeProduct.remainingUsage || 0}</span>
          </div>
        </div>

        <div className="input-section">
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="copyPaste"
                checked={selectedOption === 'copyPaste'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="radio-input"
              />
              <span className="radio-text">Copy & Paste Text</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="fileUpload"
                checked={selectedOption === 'fileUpload'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="radio-input"
              />
              <span className="radio-text">Upload File</span>
            </label>
          </div>

          {selectedOption === 'copyPaste' ? (
            <div className="input-group">
              <label className="input-label">Enter your text:</label>
              <textarea
                className="textarea-field"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Type or paste your text here..."
              />
            </div>
          ) : (
            <div className="input-group">
              <label className="input-label">Upload your file:</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  {file ? file.name : 'Choose a file'}
                </label>
              </div>
            </div>
          )}

          <button 
            className={`generate-btn ${(loading || (activeProduct.remainingUsage || 0) <= 0) ? 'disabled' : ''}`}
            onClick={handleGenerate} 
            disabled={loading || (activeProduct.remainingUsage || 0) <= 0}
          >
            {loading ? (
              <span className="loading-text">
                <span className="loading-spinner"></span>
                Generating...
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>

        {aiOutput && (
          <div className="output-section">
            <div className="output-header">
              <h2>Generated Output</h2>
              <button className="export-btn" onClick={handleExportPDF}>
                Export as PDF
              </button>
            </div>
            <div className="ai-output-box">
              <div className="formatted-output" ref={outputRef}>
                <ReactMarkdown>{aiOutput}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </section>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .error-container {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 4rem auto;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-message {
          color: #666;
          margin: 1rem 0 2rem;
          line-height: 1.6;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .page-description {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .section-one {
          margin-bottom: 3rem;
          text-align: center;
        }

        .page-image {
          width: 100%;
          max-width: 800px;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .section-two {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .usage-info {
          margin-bottom: 2rem;
        }

        .usage-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8f9fa;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .usage-count {
          font-weight: 600;
          color: #007bff;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .radio-group {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .radio-input {
          width: 1.2rem;
          height: 1.2rem;
        }

        .radio-text {
          font-size: 1rem;
          color: #333;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .textarea-field {
          width: 100%;
          min-height: 150px;
          padding: 1rem;
          border: 2px solid #e1e1e1;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
          resize: vertical;
        }

        .textarea-field:focus {
          border-color: #007bff;
          outline: none;
        }

        .file-upload-container {
          position: relative;
        }

        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
        }

        .file-upload-label {
          display: block;
          padding: 1rem;
          background: #f8f9fa;
          border: 2px dashed #e1e1e1;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .file-upload-label:hover {
          background: #e9ecef;
          border-color: #007bff;
        }

        .generate-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .generate-btn:hover:not(.disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .generate-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .loading-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid #ffffff;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .output-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e1e1e1;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .export-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .export-btn:hover {
          background: #218838;
        }

        .ai-output-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .formatted-output {
          line-height: 1.6;
          color: #333;
        }

        .primary-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .primary-button:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .page-title {
            font-size: 2rem;
          }

          .section-two {
            padding: 1.5rem;
          }

          .radio-group {
            flex-direction: column;
            gap: 1rem;
          }

          .output-header {
            flex-direction: column;
            gap: 1rem;
          }

          .export-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Pages;
