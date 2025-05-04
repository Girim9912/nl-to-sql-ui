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
