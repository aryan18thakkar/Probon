import { useState } from "react";

function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    onSend(message);

    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form
      className="message-input-wrapper"
      onSubmit={handleSubmit}
    >

      <button
        type="button"
        className="input-tool"
        title="Attach file"
      >
        📎
      </button>

      <button
        type="button"
        className="input-tool"
        title="Add emoji"
      >
        😊
      </button>

      <textarea
        value={message}
        onChange={(event) =>
          setMessage(event.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder="Message #general..."
        rows="1"
      />

      <button
        type="button"
        className="input-tool"
        title="Mention someone"
      >
        @
      </button>

      <button
        type="submit"
        className="send-button"
        disabled={!message.trim()}
      >
        ➤
      </button>

    </form>
  );
}

export default ChatInput;