import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.listeners = new Map();

    // track boards đã join (để re-request khi reconnect)
    this.joinedBoards = new Set();

    // local cache users per board (optional)
    this.usersByBoard = new Map();

    // optional current user (null nếu chưa biết)
    this.currentUser = null;
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

      // Reconnect handlers
      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      this.connection.onreconnected(async () => {
        console.log('SignalR reconnected');
        // re-register callbacks
        this._reRegisterListeners();

        // re-request users snapshot for joined boards
        try {
          const boards = Array.from(this.joinedBoards);
          await Promise.all(
            boards.map(async (b) => {
              try {
                const users = await this.getUsersInBoard(b);
                this.usersByBoard.set(b, users);
                // if there is a listener for snapshot, call it via UsersInBoard event if registered
                const cb = this.listeners.get('UsersInBoard');
                if (cb) cb(users);
              } catch (e) {
                console.warn('Failed to refresh users for board', b, e);
              }
            })
          );
        } catch (e) {
          console.warn('Error refreshing joined boards after reconnect', e);
        }
      });

      this.connection.onclose(() => {
        console.log('SignalR disconnected');
        this.connectionPromise = null;
      });

      // start
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
      this.joinedBoards.clear();
      this.usersByBoard.clear();
      this.currentUser = null;
    }
  }

  // Join vào board group (gọi hub JoinBoard) và ngay sau đó lấy snapshot user từ server
  async joinBoard(boardId) {
    if (!this.connection) throw new Error('No connection');
    await this.connection.invoke('JoinBoard', boardId);
    this.joinedBoards.add(boardId);

    // Thử lấy snapshot user từ server (hub method GetUsersInBoard)
    try {
      const users = await this.getUsersInBoard(boardId);
      this.usersByBoard.set(boardId, users);

      // notify any listener registered for snapshot
      const cb = this.listeners.get('UsersInBoard');
      if (cb) cb(users);
    } catch (err) {
      console.warn('getUsersInBoard failed', err);
    }
  }

  // Leave board group
  async leaveBoard(boardId) {
    if (!this.connection) throw new Error('No connection');
    await this.connection.invoke('LeaveBoard', boardId);
    this.joinedBoards.delete(boardId);
    this.usersByBoard.delete(boardId);
  }

  // **NEW**: trực tiếp invoke hub method trả về danh sách user (snapshot)
  async getUsersInBoard(boardId) {
    if (!this.connection) throw new Error('No connection');
    // hub method GetUsersInBoard(string boardId) phải tồn tại ở server
    const users = await this.connection.invoke('GetUsersInBoard', boardId);
    return users; // array of UserDto
  }

  // Listeners cho các events (giữ nguyên cách bạn đã làm)
  onColumnCreated(callback) { this._addListener('ColumnCreated', callback); }
  onColumnUpdated(callback) { this._addListener('ColumnUpdated', callback); }
  onColumnDeleted(callback) { this._addListener('ColumnDeleted', callback); }
  onColumnsReordered(callback) { this._addListener('ColumnsReordered', callback); }

  onCardCreated(callback) { this._addListener('CardCreated', callback); }
  onCardUpdated(callback) { this._addListener('CardUpdated', callback); }
  onCardDeleted(callback) { this._addListener('CardDeleted', callback); }
  onCardsReordered(callback) { this._addListener('CardsReordered', callback); }
  onCardMoved(callback) { this._addListener('CardMoved', callback); }

  onUserJoined(callback) {
    this._addListener('UserJoined', (d) => {
      // optional: update local cache when user joins
      // server's UserJoined payload should include user and maybe boardId (if not, client uses getUsersInBoard)
      try { this._maybeUpdateCacheOnUserJoined(d); } catch {/* ignore */ }
      callback(d);
    });
  }

  onUserLeft(callback) {
    this._addListener('UserLeft', (d) => {
      try { this._maybeUpdateCacheOnUserLeft(d); } catch { /* ignore */ }
      callback(d);
    });
  }

  // NEW: listener for the snapshot that getUsersInBoard returns.
  // usage: signalRService.onUsersInBoard(users => ...)
  onUsersInBoard(callback) {
    this.listeners.set('UsersInBoard', callback);
    // if we already have cache for a board, caller probably expects to set it.
    // But callback signature receives users array only.
  }

  _addListener(eventName, callback) {
    // luôn lưu callback vào map để có thể re-register sau reconnect
    this.listeners.set(eventName, callback);

    // nếu connection đã sẵn sàng, register thực sự lên connection
    if (this.connection) {
      try {
        // remove existing on the connection first to avoid duplicate handlers
        try { this.connection.off(eventName, callback); } catch {/* ignore */ }
        this.connection.on(eventName, callback);
      } catch (e) {
        console.warn('Failed to register listener on connection', eventName, e);
      }
    }
  }

  _removeListener(eventName) {
    const existingCallback = this.listeners.get(eventName);
    if (existingCallback) {
      if (this.connection) {
        try { this.connection.off(eventName, existingCallback); } catch { /* ignore */ }
      }
      this.listeners.delete(eventName);
    }
  }

  _reRegisterListeners() {
    // re-register all listeners after reconnect (safe when connection exists)
    if (!this.connection) return;
    for (const [eventName, callback] of this.listeners.entries()) {
      try {
        // make sure to remove previous then add to avoid duplicates
        try { this.connection.off(eventName, callback); } catch {/* ignore */ }
        this.connection.on(eventName, callback);
      } catch (e) {
        console.warn('Failed to re-register listener', eventName, e);
      }
    }
  }

  _maybeUpdateCacheOnUserJoined(payload) {
    const { user, boardId } = payload || {};
    if (!user) return;

    // fallback: if server doesn't provide boardId but client only joined one board, use that
    const targetBoardId = boardId || (this.joinedBoards.size === 1 ? Array.from(this.joinedBoards)[0] : null);

    if (!targetBoardId) {
      // as a safe fallback, try to refresh snapshot for all joined boards
      for (const b of Array.from(this.joinedBoards)) {
        this.getUsersInBoard(b).then(users => {
          this.usersByBoard.set(b, users);
          const cb = this.listeners.get('UsersInBoard');
          if (cb) cb(users);
        }).catch(() => {/* ignore */ });
      }
      return;
    }

    const arr = this.usersByBoard.get(targetBoardId) || [];
    if (!arr.some(u => u.id === user.id)) {
      arr.push(user);
      this.usersByBoard.set(targetBoardId, arr);
      const cb = this.listeners.get('UsersInBoard');
      if (cb) cb(arr);
    }
  }

  _maybeUpdateCacheOnUserLeft(payload) {
    const { user, boardId } = payload || {};
    if (!user) return;

    const targetBoardId = boardId || (this.joinedBoards.size === 1 ? Array.from(this.joinedBoards)[0] : null);

    if (!targetBoardId) {
      for (const b of Array.from(this.joinedBoards)) {
        this.getUsersInBoard(b).then(users => {
          this.usersByBoard.set(b, users);
          const cb = this.listeners.get('UsersInBoard');
          if (cb) cb(users);
        }).catch(() => {/* ignore */ });
      }
      return;
    }

    const arr = (this.usersByBoard.get(targetBoardId) || []).filter(u => u.id !== user.id);
    this.usersByBoard.set(targetBoardId, arr);
    const cb = this.listeners.get('UsersInBoard');
    if (cb) cb(arr);
  }


  // optional: allow consumers lấy cache nhanh (sync)
  getCachedUsersForBoard(boardId) {
    return this.usersByBoard.get(boardId) || [];
  }

  // optional small getter
  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(u) {
    this.currentUser = u;
  }
}

export const signalRService = new SignalRService();