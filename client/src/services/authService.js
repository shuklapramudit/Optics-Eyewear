import API_BASE_URL from "./api";


/* =========================================
   LOGIN
========================================= */

export const loginUser = async (email, password) => {

  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );


  const data = await response.json();


  if (!response.ok) {

    throw new Error(
      data.message || "Login failed."
    );

  }


  return data;
};


/* =========================================
   GET CURRENT USER
========================================= */

export const getCurrentUser = async (token) => {

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );


  const data = await response.json();


  if (!response.ok) {

    throw new Error(
      data.message || "Unable to get user."
    );

  }


  return data;
};