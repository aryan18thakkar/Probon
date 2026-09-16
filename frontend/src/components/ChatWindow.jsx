import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function ChatWindow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default fallback channels if project has no channels yet
  const defaultChannels = [
    { id: "general", name: "General", icon: "💬", count: 4 },
    { id: "development", name: "Development", icon: "💻", count: 0 },
    { id: "ai", name: "AI / ML", icon: "🤖", count: 0 },
    { id: "tasks", name: "Tasks", icon: "✓", count: 0 },
    { id: "announcements", name: "Announcements", icon: "📢", count: 0 },
  ];

  // Load user's projects
  useEffect(() => {
    api.projects.getMy().then((res) => {
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setSelectedProject(res.data[0]);
      } else {
        setProjects([]);
        setSelectedProject(null);
      }
    }).catch(() => {
      setProjects([]);
      setSelectedProject(null);
    });
  }, []);

  // Load channels when selectedProject changes
  useEffect(() => {
    if (!selectedProject) return;

    api.chat.getChannels(selectedProject.id)
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setChannels(res.data);
          setActiveChannel(res.data[0]);
        } else {
          setChannels(defaultChannels);
          setActiveChannel(defaultChannels[0]);
        }
      })
      .catch(() => {
        setChannels(defaultChannels);
        setActiveChannel(defaultChannels[0]);
      });
  }, [selectedProject]);

  // Load messages when activeChannel changes
  useEffect(() => {
    if (!activeChannel || typeof activeChannel.id === "string") {
      // Static mock messages fallback if no DB channel
      setMessages([
        {
          id: 1,
          sender: "Aryan",
          initials: "AR",
          message: "Welcome to the project group! 🚀",
          time: "4:02 PM",
          own: user?.name?.startsWith("Aryan"),
        },
        {
          id: 2,
          sender: "Rahul",
          initials: "RK",
          message: "I have started working on the backend API. I will push the authentication routes soon.",
          time: "4:05 PM",
          own: false,
        },
        {
          id: 3,
          sender: "Priya",
          initials: "PS",
          message: "Great! I will start working on the interview UI and candidate dashboard.",
          time: "4:07 PM",
          own: false,
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.chat.getMessages(activeChannel.id)
      .then((res) => {
        if (res.success) {
          setMessages(
            res.data.map((m) => ({
              ...m,
              own: m.senderId === user?.id,
            }))
          );
        }
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoading(false));
  }, [activeChannel, user]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Optimistic message update
    const tempMsg = {
      id: Date.now(),
      sender: user?.name || "You",
      initials: user?.avatar || "U",
      message: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      own: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    if (activeChannel && typeof activeChannel.id === "number") {
      try {
        await api.chat.sendMessage(activeChannel.id, text.trim());
      } catch (err) {
        console.error("Failed to persist message:", err);
      }
    }
  };

  const members = [
    { name: user?.name || "Aryan", role: "You", initials: user?.avatar || "AT", online: true },
    { name: "Rahul", role: "Backend Developer", initials: "RK", online: true },
    { name: "Priya", role: "Frontend Developer", initials: "PS", online: true },
    { name: "Karan", role: "AI/ML Developer", initials: "KA", online: false },
  ];

  return (
    <div className="chat-layout">
      {/* =========================
          LEFT SIDEBAR
      ========================= */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
            title="Go to Dashboard"
          >
            <div className="project-logo">PH</div>
            <div>
              <h2>ProjectHub</h2>
              <span>Workspace</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "#181326",
              border: "1px solid #3b2a5c",
              color: "#a78bfa",
              borderRadius: "6px",
              padding: "5px 9px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
            }}
            title="Return to Dashboard"
          >
            ← Dashboard
          </button>
        </div>

        <div className="project-section">
          <div className="project-heading">
            <span>PROJECT</span>
          </div>

          <div className="project-info">
            <div className="project-avatar">
              {selectedProject ? selectedProject.name.substring(0, 2).toUpperCase() : "AI"}
            </div>
            <div>
              <strong>{selectedProject?.name || "AI Interview Platform"}</strong>
              <span>Active project</span>
            </div>
          </div>
        </div>

        <div className="channel-section">
          <div className="section-title">
            <span>CHANNELS</span>
          </div>

          {channels.map((channel) => (
            <button
              key={channel.id}
              className={`channel-item ${
                activeChannel?.id === channel.id ? "active" : ""
              }`}
              onClick={() => setActiveChannel(channel)}
            >
              <span className="channel-icon">{channel.icon || "💬"}</span>
              <span className="channel-name">{channel.name}</span>
              {channel.message_count > 0 && (
                <span className="channel-count">{channel.message_count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="members-section">
          <div className="section-title">
            <span>MEMBERS — {members.length}</span>
          </div>

          <div className="member-list">
            {members.map((member) => (
              <div className="member-item" key={member.name}>
                <div className="member-avatar">
                  {member.initials}
                  <span
                    className={`member-status ${
                      member.online ? "online" : "offline"
                    }`}
                  />
                </div>
                <div className="member-details">
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="encryption-status">
            <span>🔒</span>
            <div>
              <strong>Encrypted Group</strong>
              <small>Secure project communication</small>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================
          MAIN CHAT
      ========================= */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="channel-avatar">#</div>
            <div>
              <h1>{activeChannel?.name || "General"}</h1>
              <p>{selectedProject?.name || "AI Interview Platform"}</p>
            </div>
          </div>

          <div className="chat-header-right">
            <div className="online-users">
              <span className="status-dot" />
              3 online
            </div>
            <div className="encrypted-badge">🔒 End-to-end encrypted</div>
          </div>
        </header>

        {/* Security banner */}
        <div className="security-banner">
          <div className="security-icon">🔐</div>
          <div>
            <strong>Messages are encrypted</strong>
            <p>Only members of this project group can access these conversations.</p>
          </div>
        </div>

        {/* Messages */}
        <section className="messages-container">
          <div className="date-divider">
            <span />
            <p>TODAY</p>
            <span />
          </div>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </section>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} />

        <div className="chat-footer">
          ProjectHub secure project communication
        </div>
      </main>
    </div>
  );
}

export default ChatWindow;