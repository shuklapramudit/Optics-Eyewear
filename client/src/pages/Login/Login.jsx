import {
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import getInitials from "../../utils/getInitials";

import "./Login.css";


const Login = () => {

  const navigate = useNavigate();

  const {
    login
  } = useAuth();


  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });


  const [showPassword, setShowPassword] =
    useState(false);


  const [error, setError] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  /* =========================================
     INPUT CHANGE
  ========================================= */

  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));


    setError("");

  };


  /* =========================================
     LOGIN SUBMIT
  ========================================= */

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (
      !formData.email ||
      !formData.password
    ) {

      setError(
        "Please enter email and password."
      );

      return;

    }


    try {

      setLoading(true);

      setError("");


      const data = await login(
        formData.email,
        formData.password
      );


      console.log(
        "Logged in user:",
        data.user
      );


      navigate("/", {
        replace: true
      });

    } catch (error) {

      setError(
        error.message ||
        "Unable to login."
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <div className="login-page">

      <div className="login-container">

        {/* =====================================
            LEFT SIDE
        ===================================== */}

        <div className="login-brand">

          <div className="brand-icon">
            <i className="fa-solid fa-glasses"></i>
          </div>


          <h1>
            CHASHMA PLUS
          </h1>


          <p>
            Inventory Management System
          </p>


          <div className="brand-info">

            <div>
              <i className="fa-solid fa-boxes-stacked"></i>

              <span>
                Manage your inventory
              </span>
            </div>


            <div>
              <i className="fa-solid fa-file-invoice"></i>

              <span>
                GST billing and invoices
              </span>
            </div>


            <div>
              <i className="fa-solid fa-chart-line"></i>

              <span>
                Track sales and reports
              </span>
            </div>

          </div>

        </div>


        {/* =====================================
            LOGIN FORM
        ===================================== */}

        <div className="login-card">

          <div className="login-header">

            <div className="mobile-brand-icon">
              <i className="fa-solid fa-glasses"></i>
            </div>


            <h2>
              Welcome Back
            </h2>


            <p>
              Login to your account
            </p>

          </div>


          {error && (

            <div className="login-error">

              <i className="fa-solid fa-circle-exclamation"></i>

              <span>
                {error}
              </span>

            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>


              <div className="input-wrapper">

                <i className="fa-regular fa-envelope"></i>


                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>


              <div className="input-wrapper">

                <i className="fa-solid fa-lock"></i>


                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  <i
                    className={
                      showPassword
                        ? "fa-regular fa-eye-slash"
                        : "fa-regular fa-eye"
                    }
                  ></i>

                </button>

              </div>

            </div>


            {/* REMEMBER */}

            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                />

                <span>
                  Remember me
                </span>

              </label>


              <button
                type="button"
                className="forgot-password"
              >
                Forgot password?
              </button>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (

                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>

                  Signing in...
                </>

              ) : (

                <>
                  <span>
                    Sign In
                  </span>

                  <i className="fa-solid fa-arrow-right"></i>
                </>

              )}

            </button>

          </form>


          <div className="login-footer">

            <i className="fa-solid fa-shield-halved"></i>

            <span>
              Secure inventory management
            </span>

          </div>

        </div>

      </div>

    </div>
  );

};


export default Login;