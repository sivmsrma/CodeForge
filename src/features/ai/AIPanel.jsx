import React, { useState, useRef, useEffect } from 'react';

function AIPanel({ activeFile, editorCode, onApplyCode }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI coding assistant. I can help you write code, fix bugs, explain code, and more. What would you like to work on?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      selectedImages.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [selectedImages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      images: selectedImages
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      if (!window.codeforge?.askAI) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'AI bridge is not available in this runtime. Open the Electron app to use local Ollama edits.'
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }

      if (!editorCode?.trim()) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'Open a file first, then ask me to change or explain that code.'
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }

      const updatedCode = await window.codeforge.askAI({
        instruction: userMessage.content || 'Improve this file while preserving behavior.',
        code: editorCode
      });

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Generated an offline Ollama edit for ${activeFile || 'the active file'}. Review it, then apply it to the editor.`,
        suggestedCode: updatedCode
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Error: ${error.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const canSend = (input.trim().length > 0 || selectedImages.length > 0) && !isLoading;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file)
      }));

    setSelectedImages((prev) => [...prev, ...imageFiles].slice(0, 8));
    event.target.value = '';
  };

  const removeImage = (imageId) => {
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== imageId);
    });
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-message ${message.type}`}
          >
            {message.content}
            {message.suggestedCode && (
              <div className="ai-suggestion-actions">
                <button
                  type="button"
                  className="ai-apply-button"
                  onClick={() => onApplyCode?.(message.suggestedCode)}
                >
                  Apply to Editor
                </button>
              </div>
            )}
            {message.images?.length > 0 && (
              <div className="ai-message-images">
                {message.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.name}
                    className="ai-message-image"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="ai-message ai">
            <em>Thinking...</em>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="ai-input-container">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="ai-image-input"
          onChange={handleImageSelect}
          disabled={isLoading}
        />
        <div className="ai-input-wrap">
          <textarea
            className="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your code..."
            rows={3}
            disabled={isLoading}
          />
          <button
            className="ai-upload-button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
            type="button"
            title="Upload image"
          >
            <span className="codicon codicon-cloud-upload" aria-hidden="true" />
          </button>
          {canSend && (
            <button
              className="ai-send-arrow"
              onClick={handleSendMessage}
              type="button"
              title="Send"
            >
              <span className="codicon codicon-send" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {selectedImages.length > 0 && (
        <div className="ai-upload-preview">
          {selectedImages.map((image) => (
            <div key={image.id} className="ai-upload-chip">
              <img src={image.url} alt={image.name} className="ai-upload-thumb" />
              <span className="ai-upload-name">{image.name}</span>
              <button
                type="button"
                className="ai-upload-remove"
                onClick={() => removeImage(image.id)}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIPanel;
