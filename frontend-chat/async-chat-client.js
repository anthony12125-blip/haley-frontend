/**
 * Async Chat Client - Vanilla JavaScript
 * Connects to async message queue backend
 * Supports multiple messages while streaming
 */

class AsyncChatClient {
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:8081';
    this.conversationId = config.conversationId || this.generateConversationId();
    this.userId = config.userId || 'default_user';
    this.onMessage = config.onMessage || (() => {});
    this.onError = config.onError || ((error) => console.error(error));
    this.onStatusChange = config.onStatusChange || (() => {});
    
    this.activeStreams = new Map(); // messageId -> EventSource
    this.messages = []; // Local message history
  }
  
  /**
   * Generate a unique conversation ID
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Submit a message (returns immediately)
   * 
   * @param {string} messageText - The message to send
   * @param {object} options - Optional parameters
   * @returns {Promise<object>} - Message IDs
   */
  async submitMessage(messageText, options = {}) {
    try {
      // Add user message to local history immediately
      const userMessage = {
        role: 'user',
        content: messageText,
        status: 'done',
        timestamp: new Date().toISOString()
      };
      this.messages.push(userMessage);
      this.onMessage(userMessage);
      
      // Submit to backend
      const response = await fetch(`${this.apiBaseUrl}/chat/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: this.conversationId,
          message: messageText,
          user_id: this.userId,
          intent: options.intent || 'chat.message',
          provider: options.provider || null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add assistant placeholder to local history
      const assistantMessage = {
        id: data.assistant_message_id,
        role: 'assistant',
        content: '',
        status: 'queued',
        timestamp: data.queued_at
      };
      this.messages.push(assistantMessage);
      this.onMessage(assistantMessage);
      
      // Start streaming response
      this.streamMessage(data.assistant_message_id);
      
      return data;
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  /**
   * Stream assistant message tokens via SSE
   * 
   * @param {string} messageId - Assistant message ID to stream
   */
  streamMessage(messageId) {
    // Don't create duplicate streams
    if (this.activeStreams.has(messageId)) {
      return;
    }
    
    const eventSource = new EventSource(
      `${this.apiBaseUrl}/chat/stream/${messageId}`
    );
    
    this.activeStreams.set(messageId, eventSource);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'status':
          this.updateMessageStatus(messageId, data.status);
          break;
          
        case 'token':
          this.appendToken(messageId, data.content);
          break;
          
        case 'done':
          this.finalizeMessage(messageId, data);
          eventSource.close();
          this.activeStreams.delete(messageId);
          break;
          
        case 'error':
          this.handleStreamError(messageId, data.error);
          eventSource.close();
          this.activeStreams.delete(messageId);
          break;
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Stream error:', error);
      this.handleStreamError(messageId, 'Connection error');
      eventSource.close();
      this.activeStreams.delete(messageId);
    };
  }
  
  /**
   * Update message status in local history
   */
  updateMessageStatus(messageId, status) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      this.onStatusChange(message);
    }
  }
  
  /**
   * Append token to message content
   */
  appendToken(messageId, token) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.content += token;
      this.onMessage(message);
    }
  }
  
  /**
   * Finalize message when streaming completes
   */
  finalizeMessage(messageId, data) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = 'done';
      message.metadata = data.result;
      this.onMessage(message);
    }
  }
  
  /**
   * Handle streaming errors
   */
  handleStreamError(messageId, error) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = 'failed';
      message.content = `Error: ${error}`;
      this.onMessage(message);
      this.onError(error);
    }
  }
  
  /**
   * Get conversation history from backend
   */
  async getConversationHistory(limit = null) {
    try {
      let url = `${this.apiBaseUrl}/chat/conversation/${this.conversationId}/messages`;
      if (limit) {
        url += `?limit=${limit}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.messages;
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  /**
   * Get queue status for current conversation
   */
  async getQueueStatus() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/chat/queue/${this.conversationId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get queue status: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  /**
   * Get message status by ID
   */
  async getMessageStatus(messageId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/chat/message/${messageId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  /**
   * Close all active streams
   */
  closeAllStreams() {
    for (const [messageId, eventSource] of this.activeStreams) {
      eventSource.close();
    }
    this.activeStreams.clear();
  }
  
  /**
   * Get local message history
   */
  getMessages() {
    return [...this.messages];
  }
  
  /**
   * Clear local message history
   */
  clearMessages() {
    this.closeAllStreams();
    this.messages = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsyncChatClient;
}
