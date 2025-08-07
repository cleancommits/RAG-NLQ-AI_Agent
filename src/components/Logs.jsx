import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Logs() {
  const [logs, setLogs] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/logs`);
        console.log('Fetched logs:', process.env.REACT_APP_API_URL);
        setLogs(response.data.logs);
      } catch (error) {
        setLogs(`Error fetching logs: ${error.message}`);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">System Logs</h2>
      <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto h-48 text-sm font-mono">
        {logs}
      </pre>
    </div>
  );
}