const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export const escapeRegExp = value => {
  if (typeof value !== 'string') return '';
  return value.replace(REGEXP_SPECIAL_CHARS, '\\$&');
};
