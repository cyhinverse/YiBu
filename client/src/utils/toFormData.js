// Small helper to build FormData from a plain object.
// Used for endpoints that accept multipart/form-data (e.g. profile update with avatar/cover).

const isFileLike = value => {
  if (!value) return false;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  return false;
};

const isFileList = value =>
  typeof FileList !== 'undefined' && value instanceof FileList;

const appendValue = (fd, key, value) => {
  if (value === undefined || value === null) return;

  if (isFileList(value)) {
    Array.from(value).forEach(file => fd.append(key, file));
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return;

    if (value.every(isFileLike)) {
      value.forEach(file => fd.append(key, file));
      return;
    }

    fd.append(key, JSON.stringify(value));
    return;
  }

  if (isFileLike(value)) {
    fd.append(key, value);
    return;
  }

  if (value instanceof Date) {
    fd.append(key, value.toISOString());
    return;
  }

  if (typeof value === 'object') {
    fd.append(key, JSON.stringify(value));
    return;
  }

  fd.append(key, String(value));
};

export const toFormData = (obj = {}) => {
  const fd = new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    appendValue(fd, key, value);
  });

  return fd;
};
