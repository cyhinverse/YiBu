import { Image, Video, FileText } from 'lucide-react';
import React from 'react';

export const getPostTypeIcon = type => {
  switch (type) {
    case 'image':
      return React.createElement(Image, { size: 16, strokeWidth: 1.5 });
    case 'video':
      return React.createElement(Video, { size: 16, strokeWidth: 1.5 });
    default:
      return React.createElement(FileText, { size: 16, strokeWidth: 1.5 });
  }
};

export const getPostStatusStyle = status => {
  switch (status) {
    case 'active':
      return 'admin-pill-success';
    case 'pending':
      return 'admin-pill-warning';
    case 'hidden':
      return 'admin-pill-muted';
    case 'flagged':
      return 'admin-pill-warning';
    case 'rejected':
      return 'admin-pill-danger';
    case 'deleted':
      return 'admin-pill-danger';
    default:
      return 'admin-pill-muted';
  }
};
