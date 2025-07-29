// The base URL for your backend API
const API_BASE_URL = 'http://localhost:4000/api';

/**
 * A centralized request function to handle all API calls.
 * It automatically adds the JWT Authorization header if a token exists.
 * @param {string} endpoint - The API endpoint to call (e.g., '/login').
 * @param {object} options - Configuration for the fetch request (method, body, etc.).
 * @returns {Promise<any>} The JSON response from the server.
 * @throws {Error} Throws an error if the network request fails or the server returns an error.
 */
const request = async (endpoint, options = {}) => {
  // Retrieve the token from local storage on each request
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // If a token exists, add it to the Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    // Handle cases where the server might not return JSON (e.g., server down)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // Attempt to get text for better error logging
        const errorText = await response.text();
        console.error("Server returned a non-JSON response:", errorText);
        throw new Error('Server response was not in the expected JSON format.');
    }

    const responseData = await response.json();

    if (!response.ok) {
        // Use the server's error message if available, otherwise a generic one
        throw new Error(responseData.message || 'An unknown API error occurred.');
    }

    return responseData;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    // Re-throw the error so it can be caught by the calling component (e.g., in a try/catch block)
    throw error;
  }
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
export const loginUser = (email, password) => {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

/**
 * **FIXED**: This function is for the public-facing registration page.
 * It assumes the page provides separate firstName and lastName fields.
 * @param {object} userData - Raw user data, expected to include { firstName, lastName, email, password }.
 */
export const registerUser = (userData) => {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * **NEW**: This function is for the company registration page.
 * It sends all form data to the new company registration endpoint.
 * @param {object} companyData - Raw form data from the RegistrationPage.
 */
export const registerCompany = (companyData) => {
    return request('/registerCompany', {
        method: 'POST',
        body: JSON.stringify(companyData),
    });
};


/**
 * This function is for the Admin Dashboard to create hosts from a single 'name' field.
 * It correctly structures the name into firstName and lastName for the backend.
 * Now requires authentication as only admins can create users under their company.
 * @param {object} userData - Must contain name, email, and password.
 */
export const createUser = (userData) => {
  const [firstName, ...lastNameParts] = userData.name.split(' ');
  const lastName = lastNameParts.join(' ');

  const registrationData = {
    firstName,
    lastName,
    email: userData.email,
    password: userData.password,
  };

  return request('/register', {
    method: 'POST',
    body: JSON.stringify(registrationData),
  });
};

/**
 * Fetches all users (admin only).
 */
export const getUsers = () => {
  return request('/users');
};

/**
 * Fetches all hosts from the current user's company.
 * This is used for the host dropdown in visitor check-in forms.
 */
export const getHosts = () => {
  return request('/hosts');
};

/**
 * Fetches visits based on the user's role.
 * - 'admin' role fetches from /visits and can use all filters.
 * - 'host' role fetches from /host-visits.
 * @param {string} role - The role of the logged-in user ('admin' or 'host').
 * @param {object} filters - Optional filters for the query (e.g., { hostName: 'John' }).
 */
export const getVisits = (role, filters = {}) => {
  const params = new URLSearchParams(filters);
  
  // Choose the correct endpoint based on the user's role
  const endpoint = role === 'admin' ? '/visits' : '/host-visits';

  return request(`${endpoint}?${params.toString()}`);
};

/**
 * Creates a new visit record (check-in).
 * @param {object} checkInData - The data for the new visit.
 */
export const checkInVisitor = (checkInData) => {
  return request('/visits', {
    method: 'POST',
    body: JSON.stringify(checkInData),
  });
};

/**
 * Checks out a visit.
 * @param {number|string} visitId - The ID of the visit to check out.
 */
export const checkOutVisit = (visitId) => {
  return request(`/visits/${visitId}/checkout`, {
    method: 'PUT',
  });
};
