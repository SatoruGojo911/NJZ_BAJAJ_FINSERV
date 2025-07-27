import { useState } from 'react'
import React from 'react';

import './App.css'
import FileUploadSidebar from './components/organisms/fileUploadSidebar';
import ChatWindow from './components/organisms/chatWindow';
import RAGGraphModal from './components/organisms/ragGraph';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE = 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const App = () => {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [graphData, setGraphData] = useState({});
  const [user, setUser] = useState(null);

  // Fetch chat history on mount
  React.useEffect(() => {
    async function fetchChats() {
      try {
        const res = await axios.get(`${API_BASE}/rag/chats/`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        setChatHistory(res.data.map(chat => ({
          id: chat.id,
          title: chat.name,
          messageCount: 0,
          lastUpdated: chat.created_at
        })));
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchChats();
  }, []);

  // Fetch user info from JWT after login
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ username: decoded.username || decoded.user_name || decoded.email || 'User' });
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleCreateChat = async (chatName) => {
    try {
      const res = await axios.post(`${API_BASE}/rag/chats/`, { name: chatName }, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const chat = res.data;
      setChatHistory(prev => [
        ...prev,
        {
          id: chat.id,
          title: chat.name,
          messageCount: 0,
          lastUpdated: chat.created_at
        }
      ]);
      setSelectedChatId(chat.id);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleFileUpload = (newFiles) => {
    const validFiles = newFiles.filter(file =>
      file.type === 'application/pdf' ||
      file.name.endsWith('.docx')
    );
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
    // In a real app, load the chat history here
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleShowGraph = async () => {
    if (!selectedChatId) return;
    try {
      const res = await axios.get(`${API_BASE}/rag/chats/${selectedChatId}/knowledge_graph/`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      setGraphData(res.data.graph_data || {});
    } catch (err) {
      setGraphData({ error: 'Could not fetch knowledge graph.' });
    }
    setIsGraphModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.reload();
  };

  return (
    <>
      <div className="fixed inset-0 flex w-screen h-screen bg-gray-100">
        <FileUploadSidebar
          files={files}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          chatHistory={chatHistory}
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onCreateChat={handleCreateChat}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            message={currentMessage}
            setMessage={setCurrentMessage}
            onSendMessage={() => { }}
            onFileUpload={handleFileUpload}
            files={files}
            onFileRemove={handleFileRemove}
            onShowGraph={handleShowGraph}
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            disabled={files.length === 0}
            selectedChatId={selectedChatId}
            user={user}
            handleLogout={handleLogout}
          />
        </div>

        <RAGGraphModal
          isOpen={isGraphModalOpen}
          onClose={() => setIsGraphModalOpen(false)}
          graphData={graphData}
        />
      </div>
    </>
  );
};

export default App;
