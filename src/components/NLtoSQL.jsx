<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import axios from "axios";
import backgroundImage from "../assets/BackgroundIMG.png"; // ✅ background image #

function NLtoSQL() {
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sql, setSql] = useState("");
  const [results, setResults] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dbSchema, setDbSchema] = useState([]);
  const [examples, setExamples] = useState([
    "Show me all data",
    "Count the number of rows in each table",
    "Find the top 5 records with highest values",
    "Calculate the average of numeric columns"
  ]);
  const [queryHistory, setQueryHistory] = useState([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem('nlsql_history');
    if (savedHistory) {
      setQueryHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleFileUpload = async () => {
    if (!file) return alert("Please choose a file first.");
    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:8000/upload", formData);
      setSessionId(response.data.session_id);
      setError("");
      
      // After successful upload, fetch schema information
      if (response.data.session_id) {
        fetchSchema(response.data.session_id);
      }
      
      alert("✅ Upload successful!");
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchema = async (sid) => {
    try {
      const response = await axios.get(`http://localhost:8000/schemas/${sid}`);
      if (response.data.success) {
        setDbSchema(response.data.tables);
        
        // Generate better examples based on the schema
        const newExamples = generateExamples(response.data.tables);
        if (newExamples.length > 0) {
          setExamples(newExamples);
        }
      }
    } catch (err) {
      console.error("Schema fetch error:", err);
    }
  };

  const generateExamples = (tables) => {
    if (!tables || tables.length === 0) return [];
    
    const examples = [];
    const mainTable = tables.find(t => t.name !== 'sqlite_sequence') || tables[0];
    
    if (mainTable) {
      examples.push(`Show all records from ${mainTable.name}`);
      
      // Find a numeric column for aggregation example
      const numericColumn = mainTable.columns.find(c => 
        ['int', 'integer', 'number', 'decimal', 'float', 'double'].some(t => 
          c.type.toLowerCase().includes(t)
        )
      );
      
      if (numericColumn) {
        examples.push(`What is the average ${numericColumn.name} in ${mainTable.name}?`);
        examples.push(`Find the highest ${numericColumn.name} in ${mainTable.name}`);
      }
      
      // Find a text column for filtering example
      const textColumn = mainTable.columns.find(c => 
        ['text', 'varchar', 'char', 'string'].some(t => 
          c.type.toLowerCase().includes(t)
        )
      );
      
      if (textColumn) {
        examples.push(`Search for records where ${textColumn.name} contains "example"`);
      }
    }
    
    return examples;
  };

  const handleQuerySubmit = async () => {
    if (!query || !sessionId) {
      setError("Please upload a file and enter a query.");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:8000/generate-sql", {
        query,
        session_id: sessionId,
      });
      
      setSql(response.data.sql);
      setResults(response.data.results || []);
      setError("");
      
      // Add to history
      const newHistoryItem = {
        query,
        sql: response.data.sql,
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [newHistoryItem, ...queryHistory].slice(0, 10);
      setQueryHistory(updatedHistory);
      localStorage.setItem('nlsql_history', JSON.stringify(updatedHistory));
      
    } catch (err) {
      console.error("Query error:", err);
      setError("Error generating SQL. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const useExample = (example) => {
    setQuery(example);
  };

  const useHistoryItem = (item) => {
    setQuery(item.query);
    setSql(item.sql);
  };

  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem('nlsql_history');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8 drop-shadow-l">NLtoSQL AI Converter</h1>
      <p className="text-lg md:text-xl text-white text-center mb-12 max-w-2xl mx-auto drop-shadow-sm">Upload your database file and ask questions in natural language. Let AI convert it into SQL!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow-xl rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">📁 Upload Your Data</h2>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <input
                type="file"
                accept=".csv,.txt,.xls,.xlsx,.db"
                onChange={(e) => setFile(e.target.files[0])}
                className="flex-grow"
              />
              <button
                onClick={handleFileUpload}
                disabled={isLoading || !file}
                className={`px-4 py-2 rounded font-semibold ${
                  isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                {isLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
            
            {sessionId && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded">
                File uploaded successfully! Session ID: {sessionId.slice(0, 8)}...
              </div>
            )}
          </div>

          <div className="bg-white shadow-xl rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">🗣️ Ask your question</h2>
            <textarea
              rows="4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., List all employees hired after 2020"
              className="w-full border p-3 rounded mb-4 text-lg"
            />

            <button
              onClick={handleQuerySubmit}
              disabled={isLoading || !sessionId}
              className={`px-5 py-3 rounded font-semibold ${
                isLoading || !sessionId
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              } text-white w-full md:w-auto`}
            >
              {isLoading ? "Generating..." : "Generate SQL"}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
                ❌ {error}
              </div>
            )}
          </div>

          {sql && (
            <div className="bg-white shadow-xl rounded-xl p-6 mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">Generated SQL:</h3>
                <button
                  onClick={() => copyToClipboard(sql)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Copy SQL
                </button>
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{sql}</pre>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="bg-white shadow-xl rounded-xl p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Results:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(results[0]).map((col, idx) => (
                        <th key={idx} className="border px-3 py-2 text-left">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="border px-3 py-2">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-xl rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Example Queries</h3>
            <ul className="space-y-2">
              {examples.map((example, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-blue-50 rounded cursor-pointer"
                  onClick={() => useExample(example)}
                >
                  {example}
                </li>
              ))}
            </ul>
          </div>

          {dbSchema.length > 0 && (
            <div className="bg-white shadow-xl rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Database Schema</h3>
              <div className="space-y-4">
                {dbSchema.map((table, idx) => (
                  <div key={idx} className="border-b pb-2 last:border-b-0">
                    <h4 className="font-semibold text-lg">{table.name}</h4>
                    <ul className="ml-4 text-sm">
                      {table.columns.map((col, cidx) => (
                        <li key={cidx}>
                          {col.name} <span className="text-gray-500">({col.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queryHistory.length > 0 && (
            <div className="bg-white shadow-xl rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Query History</h3>
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-2">
                {queryHistory.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => useHistoryItem(item)}
                  >
                    <div className="font-medium">{item.query}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  
  );

}

export default NLtoSQL;
=======
import React, { useState } from "react";
import axios from "axios";
import backgroundImage from "../assets/BackgroundIMG.png"; // ✅ background image

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NLtoSQL = () => {
  const [file, setFile] = useState(null);
  const [tableSchema, setTableSchema] = useState("");
  const [query, setQuery] = useState("");
  const [sqlResult, setSqlResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTableSchema(response.data.schema);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/query`, { query });
      setSqlResult(response.data.result);
    } catch (err) {
      setError("Failed to run query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center p-4 text-white"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-black bg-opacity-60 rounded-xl max-w-4xl mx-auto p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">NL to SQL Converter</h1>

        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="mb-2 block w-full text-black"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload
          </button>
        </div>

        {tableSchema && (
          <div className="bg-gray-900 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">Detected Table Schema:</h2>
            <pre className="whitespace-pre-wrap">{tableSchema}</pre>
          </div>
        )}

        <div className="mb-4">
          <textarea
            placeholder="Enter your natural language query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded text-black"
          />
          <button
            onClick={handleQuery}
            className="mt-2 bg-green-600 px-4 py-2 rounded hover:bg-green-700"
          >
            Run Query
          </button>
        </div>

        {sqlResult && (
          <div className="bg-gray-900 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">SQL Result:</h2>
            <pre className="whitespace-pre-wrap">{sqlResult}</pre>
          </div>
        )}

        {error && <div className="text-red-400 mt-2">{error}</div>}
        {loading && <div className="text-yellow-300 mt-2">Loading...</div>}
      </div>
    </div>
  );
};

export default NLtoSQL;
>>>>>>> c767129a4e45671021ac35b1768e054d530ce684
