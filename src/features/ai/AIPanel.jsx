import React, { useEffect, useRef, useState } from 'react';
import { VSIcon } from '../../shared/components/VSIcons';

function AIPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I am your local AI coding assistant. Ask me for code changes, debugging, or reviews.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    selectedImages.forEach((file) => URL.revokeObjectURL(file.url));
  }, [selectedImages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const promptText = input.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: promptText,
      images: selectedImages
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const fallbackPrompt = userMessage.images?.length
        ? `Please help with this coding task. I attached ${userMessage.images.length} image(s).`
        : 'Help me with coding.';
      const instruction = promptText || fallbackPrompt;

      let answer = '';
      if (window.codeforge?.askAI) {
        answer = await window.codeforge.askAI({
          instruction,
          code: '',
          model: 'deepseek-coder:6.7b'
        });
      } else {
        answer = `AI bridge unavailable. Request captured: ${instruction}`;
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: String(answer || 'No response generated.')
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          content: `Error: ${error.message}. Please try again.`
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
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

  const canSend = (input.trim().length > 0 || selectedImages.length > 0) && !isLoading;

  return (
    <div className="ai-chat-container">
      <div className="ai-messages">
        {messages.map((message) => (
          <div key={message.id} className={`ai-message ${message.type}`}>
            {message.content}
            {message.images?.length > 0 && (
              <div className="ai-message-images">
                {message.images.map((image) => (
                  <img key={image.id} src={image.url} alt={image.name} className="ai-message-image" />
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
            onChange={(event) => setInput(event.target.value)}
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
            <VSIcon name="VscAdd" size={18} />
          </button>
          {canSend && (
            <button className="ai-send-arrow" onClick={handleSendMessage} type="button" title="Send">
              <VSIcon name="VscArrowUp" size={14} />
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
              <button type="button" className="ai-upload-remove" onClick={() => removeImage(image.id)}>
                <VSIcon name="VscClose" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIPanel;
