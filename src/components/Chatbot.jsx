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
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/query`,
        { text: input },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const botMessage = {
        role: 'assistant',
        type: response.data.type,
        content: response.data.result.replace(/^"|"$/g, '').trim(), // Remove quotes
        sql: response.data.sql, // For NLQ
        source_documents: response.data.source_documents, // For RAG
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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
                    {msg.source_documents && (
                      <>
                        <p><strong>Source Documents:</strong></p>
                        <ul className="list-disc pl-5">
                          {msg.source_documents.map((doc, i) => (
                            <li key={i}>
                              {doc.filename} (ID: {doc.file_id})
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ) : msg.role === 'assistant' && msg.type === 'NLQ' ? (
                  <div>
                    <p><strong>Type:</strong> NLQ</p>
                    <p><strong>SQL:</strong> {msg.sql}</p>
                    <p><strong>Result:</strong></p>
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