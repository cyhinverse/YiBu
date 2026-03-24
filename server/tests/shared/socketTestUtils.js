export const createMockIo = () => {
  const emissions = [];

  return {
    emissions,
    emit(event, payload) {
      emissions.push({ event, payload, target: null });
    },
    to(target) {
      return {
        emit(event, payload) {
          emissions.push({ event, payload, target });
        },
      };
    },
  };
};

export const createMockSocket = (overrides = {}) => {
  const handlers = {};
  const emissions = [];
  const joins = [];
  const leaves = [];
  const broadcasts = [];
  const disconnectCalls = [];

  return {
    id: 'socket-1',
    user: { id: 'user-1' },
    handshake: {
      address: '127.0.0.1',
      auth: {},
      query: {},
      headers: {},
    },
    handlers,
    emissions,
    joins,
    leaves,
    broadcasts,
    disconnectCalls,
    on(event, handler) {
      handlers[event] = handler;
    },
    emit(event, payload) {
      emissions.push({ event, payload });
    },
    join(roomId) {
      joins.push(roomId);
    },
    leave(roomId) {
      leaves.push(roomId);
    },
    to(target) {
      return {
        emit(event, payload) {
          broadcasts.push({ event, payload, target });
        },
      };
    },
    disconnect(force) {
      disconnectCalls.push(force);
    },
    ...overrides,
  };
};
