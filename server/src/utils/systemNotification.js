import Notification from '../models/Notification.js';

export const createSystemNotification = async ({
  recipient,
  sender,
  content,
  session = null,
}) => {
  const payload = {
    recipient,
    sender,
    type: 'system',
    content,
  };

  if (session) {
    await Notification.create([payload], { session });
    return;
  }

  await Notification.create(payload);
};
