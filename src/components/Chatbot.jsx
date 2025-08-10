import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid';
import FileUpload from './FileUpload';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState({});
  const [clarification, setClarification] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Fetch table schemas on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(`${API_URL}/tables`);
        setTables(response.data.tables || {});
      } catch (error) {
        console.error('Error fetching table schemas:', error);
      }
    };
    fetchTables();
  }, [API_URL]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const queryText = clarification && selectedColumn
        ? `${input} (search in column: ${selectedColumn})`
        : input;

      // IMPORTANT: send { query: ... } to match backend
      const response = await axios.post(
        `${API_URL}/query`,
        { query: queryText },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data || {};
      // If server sends a clarification type (you may implement this server-side later)
      if (data.type === 'clarification_needed') {
        // Attempt to parse column list if present inside result text
        let cols = [];
        try {
          const match = data.result && data.result.match(/\[.*?\]/);
          if (match && match[0]) {
            cols = match[0].slice(1, -1).split(',').map(c => c.replace(/'/g, '').trim());
          }
        } catch (err) {
          console.warn('Failed to parse columns from clarification message', err);
        }
        setClarification({
          message: data.result,
          table: data.table,
          columns: cols
        });
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', type: 'clarification_needed', content: data.result }
        ]);
      } else {
        setClarification(null);
        setSelectedColumn('');
        const botMessage = {
          role: 'assistant',
          type: data.type || 'RAG',
          content: (data.result || '').replace(/^"|"$/g, '').trim(),
          sql: data.sql,
          source_documents: data.source_documents || [],
          latency: data.latency || {}
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Query error', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.response?.data?.detail || error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleColumnSelect = (e) => {
    setSelectedColumn(e.target.value);
  };

  return (
    <div className="flex flex-col mt-2 h-[calc(100vh-15rem)]">
      {/* Chat Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p className="text-lg">Start a conversation...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 py-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-[70%] ml-auto'
                    : 'text-gray-800 dark:text-gray-100 w-full'
                }`}
              >
                {msg.role === 'assistant' && msg.type === 'RAG' ? (
                  <div>
                    <p><strong>Type:</strong> RAG</p>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.source_documents && msg.source_documents.length > 0 && (
                      <>
                        <p><strong>Source Documents:</strong></p>
                        <ul className="list-disc pl-5">
                          {msg.source_documents.map((doc, i) => (
                            <li key={i}>
                              {typeof doc === 'string' ? doc : doc.filename || JSON.stringify(doc)}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ) : msg.role === 'assistant' && msg.type === 'NLQ' ? (
                  <div>
                    <p><strong>Type:</strong> NLQ</p>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {/* {msg.sql && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{msg.sql}</pre>
                    )} */}
                    {msg.latency && (
                      <p className="mt-2 text-xs"><strong>Latency:</strong> {msg.latency.total?.toFixed(3)}s</p>
                    )}
                  </div>
                ) : msg.role === 'assistant' && msg.type === 'clarification_needed' ? (
                  <div>
                    <p><strong>Type:</strong> Clarification Needed</p>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans">{msg.content}</pre>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Clarification Dropdown */}
      {clarification && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 max-w-4xl mx-auto">
          <p className="text-gray-800 dark:text-gray-100 mb-2">{clarification.message}</p>
          <select
            value={selectedColumn}
            onChange={handleColumnSelect}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="">Select a column</option>
            {clarification.columns && clarification.columns.map((col, idx) => (
              <option key={idx} value={col}>{col}</option>
            ))}
          </select>
          <button
            onClick={handleSubmit}
            disabled={!selectedColumn || isLoading}
            className="mt-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            Submit
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Processing...</span>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="relative flex items-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute left-2 bottom-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Upload files"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-3 pl-3 pr-3 rounded-3xl border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none scrollbar-none"
              placeholder="Ask a question (e.g., 'sales in Q3' or 'summarize document')..."
              rows={4}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 bottom-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-lg">
            <FileUpload onClose={() => setIsModalOpen(false)} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}