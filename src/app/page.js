'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
  const [pageData, setPageData] = useState({ name: '', description: '', image: '', instructions: '' });
  const [selectedOption, setSelectedOption] = useState('copyPaste');
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState(null);
  const [aiOutput, setAiOutput] = useState('');

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve the token from localStorage
        const response = await axios.get('https://mern-ordring-food-backend.onrender.com/api/pages/6704dd0fc7a795da55f7ccce', {
          headers: {
            Authorization: `Bearer ${token}`,  // Pass the token in the Authorization header
          }
        });

        const page = response.data;  // Adjust this if the response structure is different
        setPageData({
          name: page.name,
          description: page.description,
          image: page.image,
          instructions: page.userInstructions
        });
        console.log(instructions)
      } catch (error) {
        console.error('Error fetching page details:', error);
      }
    };

    fetchPageData(); // Call the function to fetch the data
  }, []);

  const handleGenerate = () => {
    if (selectedOption === 'copyPaste' && promptText) {
      // Call the /generate API with user input and instructions
      axios.post('https://mern-ordring-food-backend.onrender.com/api/pages/generate', {
        userInput: promptText,
        instructions: pageData.instructions  // Include instructions
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`  // Assuming token is stored in localStorage
        }
      })
        .then(response => {
          setAiOutput(response.data.aiOutput);  // Display AI output
        })
        .catch(error => {
          console.error('Error generating AI output:', error);
        });
    } else if (selectedOption === 'upload' && file) {
      // Handle file upload and AI interaction
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', pageData.instructions);  // Include instructions in the formData

      axios.post('https://mern-ordring-food-backend.onrender.com/api/pages/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(response => {
          setAiOutput(response.data.aiOutput);  // Display AI output
        })
        .catch(error => {
          console.error('Error generating AI output from file:', error);
        });
    }
  };

  return (
    <div className="container">
      {/* Navigation */}
      <nav className="nav">
        <div className="logo">
          <img src="/logo.jpg" alt="Logo" className="logo" />
        </div>
      </nav>

      {/* Section 1: Page Name, Description, Image */}
      <section className="section-one">
        <h1>{pageData.name}</h1>
        <p>{pageData.description}</p>
        {pageData.image && <img src={`${pageData.image}`} alt="Content" className="page-image" />}
      </section>

      {/* Section 2: Company Name, Selection (Copy & Paste / Upload) */}
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

        {/* Conditional Rendering */}
        {selectedOption === 'copyPaste' && (
          <div>
            <label htmlFor="prompt" className="input-label">Enter your prompt</label>
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
            <label htmlFor="fileUpload" className="input-label">Upload your file</label>
            <input
              type="file"
              id="fileUpload"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
          </div>
        )}

        <button className="generate-btn" onClick={handleGenerate}>Generate</button>

        {/* Display AI Output */}
        {aiOutput && (
          <div className="ai-output">
            <h3>AI Output:</h3>
            <p>{aiOutput}</p>
          </div>
        )}
      </section>

      <style jsx>{
        `

        .container {
          margin: auto;
        padding: 0 2rem;
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        }

        .nav {
          display: flex;
        justify-content: flex-end;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        background-color: #ffffff;
        }

        .logo {
          max-width:200px
        }

        .section-one {
          padding: 2rem;
        text-align: center;
        }

        .page-image {
          width:100%;
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

        .input-label {
          font - size: 1rem;
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
          min - height: 100px;
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
          background - color: #0070f3;
        color: white;
        padding: 0.8rem 1.2rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
        }

        .generate-btn:hover {
          background - color: #005bb5;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav {
          justify - content: center;
          }
        }
      `}</style>
    </div>

  );

}
export default Home;