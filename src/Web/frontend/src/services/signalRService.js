import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.listeners = new Map();
  }

  async connect(token) {
    if (this.connection?.state === 'Connected') {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._createConnection(token);
    return this.connectionPromise;
  }

  async _createConnection(token) {
    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_SIGNALR_HUB_URL}`, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Xử lý reconnect
      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      this.connection.onreconnected(() => {
        console.log('SignalR reconnected');
        this._reRegisterListeners();
      });

      this.connection.onclose(() => {
        console.log('SignalR disconnected');
        this.connectionPromise = null;
      });

      await this.connection.start();
      console.log('SignalR Connected');
      
      return this.connection;
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
      this.listeners.clear();
    }
  }

  // Join vào board group
  async joinBoard(boardId) {
    if (!this.connection) throw new Error('No connection');
    await this.connection.invoke('JoinBoard', boardId);
  }

  // Leave board group
  async leaveBoard(boardId) {
    if (!this.connection) throw new Error('No connection');
    await this.connection.invoke('LeaveBoard', boardId);
  }

  // Listeners cho các events
  onColumnCreated(callback) {
    this._addListener('ColumnCreated', callback);
  }

  onColumnUpdated(callback) {
    this._addListener('ColumnUpdated', callback);
  }

  onColumnDeleted(callback) {
    this._addListener('ColumnDeleted', callback);
  }

  onColumnsReordered(callback) {
    this._addListener('ColumnsReordered', callback);
  }

  onCardCreated(callback) {
    this._addListener('CardCreated', callback);
  }

  onCardUpdated(callback) {
    this._addListener('CardUpdated', callback);
  }

  onCardDeleted(callback) {
    this._addListener('CardDeleted', callback);
  }

  onCardsReordered(callback) {
    this._addListener('CardsReordered', callback);
  }

  onCardMoved(callback) {
    this._addListener('CardMoved', callback);
  }

  onUserJoined(callback) {
    this._addListener('UserJoined', callback);
  }

  onUserLeft(callback) {
    this._addListener('UserLeft', callback);
  }

  _addListener(eventName, callback) {
    if (!this.connection) return;
    
    // Remove existing listener nếu có
    this._removeListener(eventName);
    
    // Add new listener
    this.connection.on(eventName, callback);
    this.listeners.set(eventName, callback);
  }

  _removeListener(eventName) {
    if (!this.connection) return;
    
    const existingCallback = this.listeners.get(eventName);
    if (existingCallback) {
      this.connection.off(eventName, existingCallback);
      this.listeners.delete(eventName);
    }
  }

  _reRegisterListeners() {
    // Re-register all listeners after reconnection
    for (const [eventName, callback] of this.listeners.entries()) {
      this.connection.on(eventName, callback);
    }
  }

  removeAllListeners() {
    for (const eventName of this.listeners.keys()) {
      this._removeListener(eventName);
    }
  }
}

export const signalRService = new SignalRService();