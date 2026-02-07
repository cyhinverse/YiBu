// Small helper to build FormData from a plain object.
// Used for endpoints that accept multipart/form-data (e.g. profile update with avatar/cover).

const isFileLike = value => {
  if (!value) return false;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  return false;
};

export const toFormData = (obj = {}) => {
  const fd = new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Support FileList/array wrappers
    if (Array.isArray(value) && value.length === 1 && isFileLike(value[0])) {
      fd.append(key, value[0]);
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

    // Everything else: send as string
    fd.append(key, String(value));
  });

  return fd;
};

