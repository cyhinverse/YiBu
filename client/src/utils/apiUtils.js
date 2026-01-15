/**
 * Extract data from API response
 * Handles nested data structure from API responses
 * @param {Object} response - Axios response object
 * @returns {*} Extracted data from response
 * @example
 * // Response: { data: { data: { user: {...} } } }
 * extractData(response) // returns { user: {...} }
 *
 * // Response: { data: { user: {...} } }
 * extractData(response) // returns { user: {...} }
 */
export const extractData = response => {
  const responseData = response?.data;
  return responseData?.data !== undefined ? responseData.data : responseData;
};
