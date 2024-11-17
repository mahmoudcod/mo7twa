'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/header';

function Pages() {
  const params = useParams();
  const pageId = params.id;
  const outputRef = useRef();
  
  const [pageData, setPageData] = useState({ name: '', description: '', image: '', instructions: '' });
  const [selectedOption, setSelectedOption] = useState('copyPaste');
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState(null);
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPageData = async () => {
      if (!pageId) return;

      try {
        const response = await axios.get(`https://mern-ordring-food-backend.onrender.com/api/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPageData({
          name: response.data.name,
          description: response.data.description,
          image: response.data.image,
          instructions: response.data.userInstructions,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchPageData();
  }, [pageId]);

  const handleGenerate = () => {
    setLoading(true);
    const endpoint = 'https://mern-ordring-food-backend.onrender.com/api/pages/generate';
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    let data;
    if (selectedOption === 'copyPaste') {
      data = { userInput: promptText, instructions: pageData.instructions };
    } else {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', pageData.instructions);
      data = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    axios
      .post(endpoint, data, { headers })
      .then((response) => {
        setAiOutput(response.data.aiOutput);
      })
      .catch((error) => {
        console.error('Error generating AI output:', error);
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

  return (
    <div className="container">
      <Header />

      <section className="section-one">
        <h1>{pageData.name}</h1>
        {pageData.image && <img src={`${pageData.image}`} alt="Content" className="page-image" />}
        <ReactMarkdown className="des">{pageData.description}</ReactMarkdown>
      </section>

      <section className="section-two">
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              value="copyPaste"
              checked={selectedOption === 'copyPaste'}
              onChange={() => setSelectedOption('copyPaste')}
            />
            Copy & Paste Prompt
          </label>

          <label className="radio-label">
            <input
              type="radio"
              value="upload"
              checked={selectedOption === 'upload'}
              onChange={() => setSelectedOption('upload')}
            />
            Upload
          </label>
        </div>

        {selectedOption === 'copyPaste' && (
          <div>
            <label htmlFor="prompt" className="input-label">
              Enter your prompt
            </label>
            <textarea
              id="prompt"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste your prompt here"
              className="textarea-field"
            ></textarea>
          </div>
        )}

        {selectedOption === 'upload' && (
          <div>
            <label htmlFor="fileUpload" className="input-label">
              Upload your file
            </label>
            <input
              type="file"
              id="fileUpload"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
          </div>
        )}

        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate'}
        </button>

        {aiOutput && (
          <div className="ai-output" ref={outputRef}>
            <div className="output-header">
              <h2>AI Output:</h2>
              <button onClick={handleExportPDF} className="export-btn">
                Export as PDF
              </button>
            </div>
            <div className="ai-output-box">{formatAiOutput(aiOutput)}</div>
          </div>
        )}
      </section>
      <style jsx>{`
        .container {
          margin: auto;
          padding: 0 2rem;
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
        }

        .section-one {
          padding: 2rem;
          text-align: center;
        }

        .page-image {
          width: 100%;
          aspect-ratio: 9/4;
          height: auto;
          margin-top: 1rem;
        }

        .section-two {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .export-btn {
          background-color: #007bff;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .export-btn:hover {
          background-color: #0056b3;
        }

        .input-label {
          font-size: 1rem;
          font-weight: 600;
        }

        .input-field,
        .textarea-field,
        .file-input {
          padding: 0.8rem;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .textarea-field {
          min-height: 100px;
        }

        .radio-group {
          display: flex;
          gap: 1rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          font-size: 1rem;
        }

        .generate-btn {
          background-color: #28a745;
          color: white;
          padding: 0.8rem 1.2rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .generate-btn:hover {
          background-color: #218838;
        }

        .generate-btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .ai-output h2 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .formatted-output {
          font-family: Arial, sans-serif;
        }

        .formatted-output h2 {
          color: #2c3e50;
          font-size: 24px !important;
          margin-top: 20px;
          margin-bottom: 15px;
        }

        .formatted-output h3 {
          color: #34495e;
          font-size: 20px;
          margin-top: 15px;
          margin-bottom: 10px;
        }

        .formatted-output p {
          color: #333;
          line-height: 1.6;
          margin-bottom: 10px;
        }

        .section {
          margin-bottom: 20px;
        }

        .ai-output-box {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-top: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
          .nav {
            justify-content: center;
          }
          
          .output-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default Pages;