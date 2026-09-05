import { useState } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

function ChatWindow() {
  const [activeChannel, setActiveChannel] = useState("general");

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Aryan",
      initials: "AR",
      message:
        "Welcome to the AI Interview Platform project group! 🚀",
      time: "4:02 PM",
      own: true,
    },
    {
      id: 2,
      sender: "Rahul",
      initials: "RK",
      message:
        "I've started working on the backend API. I'll push the authentication routes soon.",
      time: "4:05 PM",
      own: false,
    },
    {
      id: 3,
      sender: "Priya",
      initials: "PS",
      message:
        "Great! I'll start working on the interview UI and candidate dashboard.",
      time: "4:07 PM",
      own: false,
    },
    {
      id: 4,
      sender: "Aryan",
      initials: "AR",
      message:
        "Perfect. Let's keep the API structure documented here so everyone can follow along.",
      time: "4:10 PM",
      own: true,
    },
  ]);

  const channels = [
    {
      id: "general",
      name: "General",
      icon: "💬",
      count: 4,
    },
    {
      id: "development",
      name: "Development",
      icon: "💻",
      count: 0,
    },
    {
      id: "ai",
      name: "AI / ML",
      icon: "🤖",
      count: 0,
    },
    {
      id: "tasks",
      name: "Tasks",
      icon: "✓",
      count: 0,
    },
    {
      id: "announcements",
      name: "Announcements",
      icon: "📢",
      count: 0,
    },
  ];

  const members = [
    {
      name: "Aryan",
      role: "Project Owner",
      initials: "AR",
      online: true,
    },
    {
      name: "Rahul",
      role: "Backend Developer",
      initials: "RK",
      online: true,
    },
    {
      name: "Priya",
      role: "Frontend Developer",
      initials: "PS",
      online: true,
    },
    {
      name: "Karan",
      role: "AI/ML Developer",
      initials: "KA",
      online: false,
    },
  ];

  const handleSendMessage = (text) => {
    if (!text.trim()) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      sender: "Aryan",
      initials: "AR",
      message: text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      own: true,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);
  };

  return (
    <div className="chat-layout">

      {/* =========================
          LEFT SIDEBAR
      ========================= */}

      <aside className="chat-sidebar">

        <div className="chat-sidebar-header">
          <div className="project-logo">
            PH
          </div>

          <div>
            <h2>ProjectHub</h2>
            <span>Workspace</span>
          </div>
        </div>

        <div className="project-section">

          <div className="project-heading">
            <span>PROJECT</span>

            <button className="small-icon-button">
              +
            </button>
          </div>

          <div className="project-info">
            <div className="project-avatar">
              AI
            </div>

            <div>
              <strong>AI Interview Platform</strong>
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
                activeChannel === channel.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveChannel(channel.id)
              }
            >
              <span className="channel-icon">
                {channel.icon}
              </span>

              <span className="channel-name">
                {channel.name}
              </span>

              {channel.count > 0 && (
                <span className="channel-count">
                  {channel.count}
                </span>
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
              <div
                className="member-item"
                key={member.name}
              >

                <div className="member-avatar">
                  {member.initials}

                  <span
                    className={`member-status ${
                      member.online
                        ? "online"
                        : "offline"
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
              <small>
                Secure project communication
              </small>
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

            <div className="channel-avatar">
              #
            </div>

            <div>
              <h1>
                {channels.find(
                  (channel) =>
                    channel.id === activeChannel
                )?.name}
              </h1>

              <p>
                AI Interview Platform
              </p>
            </div>

          </div>

          <div className="chat-header-right">

            <div className="online-users">
              <span className="status-dot" />
              3 online
            </div>

            <div className="encrypted-badge">
              🔒 End-to-end encrypted
            </div>

            <button className="chat-header-button">
              🔍
            </button>

            <button className="chat-header-button">
              ⋮
            </button>

          </div>

        </header>

        {/* Security banner */}

        <div className="security-banner">

          <div className="security-icon">
            🔐
          </div>

          <div>
            <strong>
              Messages are encrypted
            </strong>

            <p>
              Only members of this project group
              can access these conversations.
            </p>
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
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}

        </section>

        {/* Input */}

        <ChatInput
          onSend={handleSendMessage}
        />

        <div className="chat-footer">
          ProjectHub secure project communication
        </div>

      </main>

    </div>
  );
}

export default ChatWindow;