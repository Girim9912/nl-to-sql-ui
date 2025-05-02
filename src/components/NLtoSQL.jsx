import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, Upload, Sparkles } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

const NLtoSQL = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [sql, setSQL] = useState("");
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Setup Speech Recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (e) => {
      console.error("Speech error:", e);
      setIsRecording(false);
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery((prev) => `${prev} ${transcript}`);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleVoice = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_BASE}/generate-sql`, { query });
      setSQL(res.data.sql);
      setResult(res.data.results || []);
      setHistory([{ query, sql: res.data.sql }, ...history]);
    } catch (err) {
      console.error("🔥 Error:", err);
      setSQL("-- Error generating SQL");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API_BASE}/upload-db`, formData);
      alert("✅ File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <h1 className="text-3xl font-bold mb-4">NL → SQL AI Playground</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="border p-2 rounded w-full"
          value={query}
          placeholder="Enter your natural language query"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleVoice}
          className={`p-2 rounded ${isRecording ? "bg-red-500" : "bg-gray-300"}`}
        >
          <Mic size={20} />
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          <Sparkles className="inline mr-2" size={18} />
          Generate SQL
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">📁 Upload Your Data</label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.db,.txt"
          onChange={handleFileUpload}
          className="w-full border p-2 rounded"
        />
      </div>

      {sql && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <strong className="block mb-2">Generated SQL:</strong>
          <pre className="whitespace-pre-wrap">{sql}</pre>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="overflow-auto">
          <table className="table-auto border-collapse border border-gray-400 w-full">
            <thead>
              <tr>
                {Object.keys(result[0]).map((key) => (
                  <th className="border px-4 py-2 bg-gray-200" key={key}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td className="border px-4 py-2" key={i}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">🕓 Query History</h2>
          {history.map((entry, i) => (
            <div key={i} className="mb-3 p-3 bg-gray-50 border rounded">
              <p className="font-semibold">🗣️ {entry.query}</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                💾 {entry.sql}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NLtoSQL;
