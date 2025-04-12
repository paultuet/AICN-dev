import axios from 'axios';
import qs from 'qs';

// Configure axios to use qs for URL encoding
axios.defaults.paramsSerializer = {
  serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' })
};

// Create a helper for form data handling
export const formUrlencoded = (data: Record<string, any>) => {
  return qs.stringify(data);
};