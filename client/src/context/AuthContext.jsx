import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  loginUser as loginAPI,
  getCurrentUser
} from "../services/authService";


const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("chashma_token")
  );

  const [loading, setLoading] = useState(true);


  /* =========================================
     LOAD USER
  ========================================= */

  useEffect(() => {

    const loadUser = async () => {

      if (!token) {

        setLoading(false);

        return;

      }


      try {

        const data =
          await getCurrentUser(token);

        setUser(data.user);

      } catch (error) {

        console.error(
          "Session Error:",
          error.message
        );

        localStorage.removeItem(
          "chashma_token"
        );

        setToken(null);

        setUser(null);

      } finally {

        setLoading(false);

      }

    };


    loadUser();

  }, [token]);


  /* =========================================
     LOGIN
  ========================================= */

  const login = async (
    email,
    password
  ) => {

    const data =
      await loginAPI(
        email,
        password
      );


    localStorage.setItem(
      "chashma_token",
      data.token
    );


    setToken(data.token);

    setUser(data.user);


    return data;

  };


  /* =========================================
     LOGOUT
  ========================================= */

  const logout = () => {

    localStorage.removeItem(
      "chashma_token"
    );

    setToken(null);

    setUser(null);

  };


  /* =========================================
     CONTEXT VALUE
  ========================================= */

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};


export const useAuthContext = () => {

  return useContext(AuthContext);

};


export default AuthContext;