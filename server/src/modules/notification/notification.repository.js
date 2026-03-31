import Notification from '../../models/Notification.js';

const applyQueryOptions = (query, options = {}) => {
  const {
    select,
    populate,
    sort,
    skip,
    limit,
    lean = false,
  } = options;

  if (select) {
    query = query.select(select);
  }

  if (populate) {
    const populations = Array.isArray(populate) ? populate : [populate];

    populations.filter(Boolean).forEach(population => {
      query = query.populate(population);
    });
  }

  if (sort) {
    query = query.sort(sort);
  }

  if (typeof skip === 'number') {
    query = query.skip(skip);
  }

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  if (lean) {
    query = query.lean();
  }

  return query;
};

const findOne = (query, options = {}) => {
  return applyQueryOptions(Notification.findOne(query), options);
};

const findById = (id, options = {}) => {
  return applyQueryOptions(Notification.findById(id), options);
};

const findNotifications = (query, options = {}) => {
  return applyQueryOptions(Notification.find(query), options);
};

const countNotifications = query => Notification.countDocuments(query);

const aggregateNotifications = pipeline => Notification.aggregate(pipeline);

const createNotification = payload => Notification.create(payload);

const insertManyNotifications = (payloads, options = {}) => {
  return Notification.insertMany(payloads, options);
};

const findOneAndUpdate = (query, update, options = {}) => {
  return Notification.findOneAndUpdate(query, update, { new: true, ...options });
};

const updateNotificationById = (id, update, options = {}) => {
  return Notification.findByIdAndUpdate(id, update, { new: true, ...options });
};

const updateNotifications = (query, update, options = {}) => {
  return Notification.updateMany(query, update, options);
};

const findOneAndDelete = query => Notification.findOneAndDelete(query);

const deleteNotifications = query => Notification.deleteMany(query);

export default {
  findOne,
  findById,
  findNotifications,
  countNotifications,
  aggregateNotifications,
  createNotification,
  insertManyNotifications,
  findOneAndUpdate,
  updateNotificationById,
  updateNotifications,
  findOneAndDelete,
  deleteNotifications,
};
