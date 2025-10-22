// Mock database for development when Couchbase is unavailable
class MockDatabase {
  constructor() {
    this.data = {
      users: new Map(),
      products: new Map(),
      orders: new Map(),
      chats: new Map(),
      messages: new Map(),
      assets: new Map(),
      scans: new Map(),
      carts: new Map()
    };
    console.log('🧪 Mock Database initialized for offline development');
  }

  // Mock collection interface
  collection(name) {
    return {
      get: async (id) => {
        const item = this.data[name].get(id);
        if (!item) throw new Error('Document not found');
        return { content: item };
      },
      
      upsert: async (id, doc) => {
        this.data[name].set(id, doc);
        return { cas: Date.now() };
      },
      
      insert: async (id, doc) => {
        if (this.data[name].has(id)) throw new Error('Document already exists');
        this.data[name].set(id, doc);
        return { cas: Date.now() };
      },
      
      remove: async (id) => {
        if (!this.data[name].has(id)) throw new Error('Document not found');
        this.data[name].delete(id);
        return { cas: Date.now() };
      }
    };
  }

  // Mock query interface
  async query(statement) {
    console.log('🔍 Mock query:', statement);
    return { rows: [] };
  }
}

const mockDb = new MockDatabase();

module.exports = {
  connect: async () => {
    console.log('🧪 Using Mock Database (Couchbase unavailable)');
    return {
      users: mockDb.collection('users'),
      products: mockDb.collection('products'),
      orders: mockDb.collection('orders'),
      chats: mockDb.collection('chats'),
      messages: mockDb.collection('messages'),
      assets: mockDb.collection('assets'),
      scans: mockDb.collection('scans'),
      carts: mockDb.collection('carts')
    };
  },
  getCluster: () => mockDb
};
