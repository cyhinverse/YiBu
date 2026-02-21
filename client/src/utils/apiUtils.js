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
  if (!responseData) return responseData;

  if (responseData.success !== undefined) {
    return responseData.data !== undefined ? responseData.data : responseData;
  }

  return responseData?.data !== undefined ? responseData.data : responseData;
};
