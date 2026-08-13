import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";


/* =========================================
   LOGIN USER
========================================= */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* -------------------------------------
       VALIDATION
    ------------------------------------- */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }


    /* -------------------------------------
       FIND USER
    ------------------------------------- */

    const [users] = await pool.query(
      `
      SELECT
        UserID,
        FullName,
        Email,
        Phone,
        PasswordHash,
        Role,
        IsActive
      FROM users
      WHERE Email = ?
      LIMIT 1
      `,
      [email.trim().toLowerCase()]
    );


    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }


    const user = users[0];


    /* -------------------------------------
       CHECK ACTIVE STATUS
    ------------------------------------- */

    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive."
      });
    }


    /* -------------------------------------
       CHECK PASSWORD
    ------------------------------------- */

    const passwordMatch = await bcrypt.compare(
      password,
      user.PasswordHash
    );


    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }


    /* -------------------------------------
       CREATE JWT
    ------------------------------------- */

    const token = jwt.sign(
      {
        userId: user.UserID,
        email: user.Email,
        role: user.Role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );


    /* -------------------------------------
       RESPONSE
    ------------------------------------- */

    res.status(200).json({
      success: true,
      message: "Login successful.",

      token,

      user: {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Phone: user.Phone,
        Role: user.Role
      }
    });

  } catch (error) {

    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login."
    });

  }
};


/* =========================================
   GET CURRENT USER
========================================= */

export const getCurrentUser = async (req, res) => {
  try {

    const [users] = await pool.query(
      `
      SELECT
        UserID,
        FullName,
        Email,
        Phone,
        Role,
        IsActive
      FROM users
      WHERE UserID = ?
      LIMIT 1
      `,
      [req.user.userId]
    );


    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }


    res.status(200).json({
      success: true,
      user: users[0]
    });

  } catch (error) {

    console.error("Get Current User Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get current user."
    });

  }
};