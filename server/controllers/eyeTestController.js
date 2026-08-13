import pool from "../config/db.js";

// =====================================================
// HELPER
// Convert empty values to NULL
// =====================================================

const nullable = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return value;
};

// =====================================================
// GET EYE TEST FORM DATA
// GET /api/eye-tests/form-data
//
// Returns:
// 1. Customers
// 2. Latest eye test for each customer
//
// IMPORTANT:
// customers table uses Phone, NOT MobileNumber.
// We return Phone AS MobileNumber so frontend
// can continue using MobileNumber.
// =====================================================

export const getEyeTestFormData = async (req, res) => {
  try {
    // =================================================
    // GET CUSTOMERS
    // =================================================

    const [customers] = await pool.query(`
      SELECT
        CustomerID,
        CustomerCode,
        FullName AS CustomerName,
        Phone AS MobileNumber,
        Email,
        Gender
      FROM customers
      ORDER BY FullName ASC
    `);

    // =================================================
    // GET LATEST EYE TEST FOR EACH CUSTOMER
    //
    // Used for auto-filling previous prescription
    // values such as ADD.
    // =================================================

    const [previousTests] = await pool.query(`
      SELECT
        e.EyeTestID,
        e.CustomerID,
        e.TestDate,

        e.RightSPH,
        e.RightCYL,
        e.RightAXIS,
        e.RightADD,

        e.LeftSPH,
        e.LeftCYL,
        e.LeftAXIS,
        e.LeftADD,

        e.PD,

        e.VisualAcuityRight,
        e.VisualAcuityLeft,

        e.DoctorName,
        e.TestedBy,
        e.Complaint,
        e.Notes,
        e.NextCheckupDate

      FROM eye_tests e

      INNER JOIN (
        SELECT
          CustomerID,
          MAX(EyeTestID) AS LatestEyeTestID
        FROM eye_tests
        GROUP BY CustomerID
      ) latest

        ON e.EyeTestID = latest.LatestEyeTestID

      ORDER BY e.CustomerID
    `);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      customers,
      previousTests
    });

  } catch (error) {

    console.error(
      "Get Eye Test Form Data Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load eye test form data.",
      error: error.message
    });
  }
};


// =====================================================
// GET ALL EYE TESTS
// GET /api/eye-tests
// =====================================================

export const getEyeTests = async (req, res) => {
  try {

    const search = String(
      req.query.search || ""
    ).trim();

    // =================================================
    // GET ALL TESTS
    // =================================================

    const [tests] = await pool.query(
      `
      SELECT

        e.EyeTestID,
        e.CustomerID,
        e.TestDate,

        e.RightSPH,
        e.RightCYL,
        e.RightAXIS,
        e.RightADD,

        e.LeftSPH,
        e.LeftCYL,
        e.LeftAXIS,
        e.LeftADD,

        e.PD,

        e.VisualAcuityRight,
        e.VisualAcuityLeft,

        e.DoctorName,
        e.TestedBy,
        e.Complaint,
        e.Notes,
        e.NextCheckupDate,

        c.CustomerCode,
        c.FullName AS CustomerName,

        c.Phone AS MobileNumber

      FROM eye_tests e

      LEFT JOIN customers c
        ON e.CustomerID = c.CustomerID

      WHERE
        c.FullName LIKE ?
        OR c.Phone LIKE ?
        OR c.CustomerCode LIKE ?
        OR e.DoctorName LIKE ?

      ORDER BY e.EyeTestID DESC
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      ]
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      count: tests.length,
      tests
    });

  } catch (error) {

    console.error(
      "Get Eye Tests Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load eye tests.",
      error: error.message
    });
  }
};


// =====================================================
// GET SINGLE EYE TEST
// GET /api/eye-tests/:id
// =====================================================

export const getEyeTestById = async (req, res) => {
  try {

    const { id } = req.params;

    // =================================================
    // GET SINGLE TEST
    // =================================================

    const [tests] = await pool.query(
      `
      SELECT

        e.EyeTestID,
        e.CustomerID,
        e.TestDate,

        e.RightSPH,
        e.RightCYL,
        e.RightAXIS,
        e.RightADD,

        e.LeftSPH,
        e.LeftCYL,
        e.LeftAXIS,
        e.LeftADD,

        e.PD,

        e.VisualAcuityRight,
        e.VisualAcuityLeft,

        e.DoctorName,
        e.TestedBy,
        e.Complaint,
        e.Notes,
        e.NextCheckupDate,

        c.CustomerCode,
        c.FullName AS CustomerName,

        c.Phone AS MobileNumber

      FROM eye_tests e

      LEFT JOIN customers c
        ON e.CustomerID = c.CustomerID

      WHERE e.EyeTestID = ?

      LIMIT 1
      `,
      [id]
    );

    // =================================================
    // NOT FOUND
    // =================================================

    if (tests.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Eye test not found."
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      test: tests[0]
    });

  } catch (error) {

    console.error(
      "Get Eye Test Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load eye test.",
      error: error.message
    });
  }
};


// =====================================================
// GET PREVIOUS EYE TEST FOR CUSTOMER
//
// GET /api/eye-tests/customer/:customerId/previous
//
// Returns latest prescription for selected customer.
// Used for automatic ADD / SPH / CYL / AXIS etc.
// =====================================================

export const getPreviousEyeTest = async (req, res) => {
  try {

    const { customerId } = req.params;

    // =================================================
    // VALIDATE CUSTOMER ID
    // =================================================

    if (
      !customerId ||
      Number.isNaN(Number(customerId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid customer ID is required."
      });
    }

    // =================================================
    // GET LATEST TEST
    // =================================================

    const [tests] = await pool.query(
      `
      SELECT

        e.EyeTestID,
        e.CustomerID,
        e.TestDate,

        e.RightSPH,
        e.RightCYL,
        e.RightAXIS,
        e.RightADD,

        e.LeftSPH,
        e.LeftCYL,
        e.LeftAXIS,
        e.LeftADD,

        e.PD,

        e.VisualAcuityRight,
        e.VisualAcuityLeft,

        e.DoctorName,
        e.TestedBy,
        e.Complaint,
        e.Notes,
        e.NextCheckupDate,

        c.CustomerCode,
        c.FullName AS CustomerName,

        c.Phone AS MobileNumber

      FROM eye_tests e

      LEFT JOIN customers c
        ON e.CustomerID = c.CustomerID

      WHERE e.CustomerID = ?

      ORDER BY e.EyeTestID DESC

      LIMIT 1
      `,
      [customerId]
    );

    // =================================================
    // NO PREVIOUS TEST
    // =================================================

    if (tests.length === 0) {

      return res.status(200).json({
        success: true,
        hasPreviousTest: false,
        previousTest: null
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      hasPreviousTest: true,
      previousTest: tests[0]
    });

  } catch (error) {

    console.error(
      "Get Previous Eye Test Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load previous eye test.",
      error: error.message
    });
  }
};


// =====================================================
// CREATE EYE TEST
// POST /api/eye-tests
// =====================================================

export const createEyeTest = async (req, res) => {

  const connection =
    await pool.getConnection();

  try {

    const {

      CustomerID,

      RightSPH,
      RightCYL,
      RightAXIS,
      RightADD,

      LeftSPH,
      LeftCYL,
      LeftAXIS,
      LeftADD,

      PD,

      VisualAcuityRight,
      VisualAcuityLeft,

      DoctorName,
      TestedBy,
      Complaint,
      Notes,
      NextCheckupDate

    } = req.body;

    // =================================================
    // VALIDATE CUSTOMER
    // =================================================

    if (
      CustomerID === undefined ||
      CustomerID === null ||
      CustomerID === ""
    ) {

      return res.status(400).json({
        success: false,
        message: "Customer is required."
      });
    }

    // =================================================
    // CHECK CUSTOMER EXISTS
    //
    // IMPORTANT:
    // customers table uses Phone.
    // =================================================

    const [customer] =
      await connection.query(
        `
        SELECT
          CustomerID,
          CustomerCode,
          FullName,
          Phone
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [CustomerID]
      );

    if (customer.length === 0) {

      return res.status(400).json({
        success: false,
        message: "Selected customer does not exist."
      });
    }

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // INSERT EYE TEST
    // =================================================

    const [result] =
      await connection.query(
        `
        INSERT INTO eye_tests (

          CustomerID,

          RightSPH,
          RightCYL,
          RightAXIS,
          RightADD,

          LeftSPH,
          LeftCYL,
          LeftAXIS,
          LeftADD,

          PD,

          VisualAcuityRight,
          VisualAcuityLeft,

          DoctorName,
          TestedBy,
          Complaint,
          Notes,
          NextCheckupDate

        )

        VALUES (

          ?,

          ?, ?, ?, ?,

          ?, ?, ?, ?,

          ?,

          ?, ?,

          ?, ?, ?, ?, ?

        )
        `,
        [

          CustomerID,

          nullable(RightSPH),
          nullable(RightCYL),
          nullable(RightAXIS),
          nullable(RightADD),

          nullable(LeftSPH),
          nullable(LeftCYL),
          nullable(LeftAXIS),
          nullable(LeftADD),

          nullable(PD),

          nullable(VisualAcuityRight),
          nullable(VisualAcuityLeft),

          nullable(DoctorName),

          // TestedBy is INT in database
          nullable(TestedBy) === null
            ? null
            : Number(TestedBy),

          nullable(Complaint),
          nullable(Notes),
          nullable(NextCheckupDate)

        ]
      );

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Eye test saved successfully.",
      eyeTestID: result.insertId
    });

  } catch (error) {

    // =================================================
    // ROLLBACK
    // =================================================

    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Eye Test Rollback Error:",
        rollbackError.message
      );
    }

    console.error(
      "Create Eye Test Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to save eye test.",
      error: error.message
    });

  } finally {

    connection.release();
  }
};


// =====================================================
// UPDATE EYE TEST
// PUT /api/eye-tests/:id
// =====================================================

export const updateEyeTest = async (req, res) => {

  try {

    const { id } = req.params;

    const {

      CustomerID,

      RightSPH,
      RightCYL,
      RightAXIS,
      RightADD,

      LeftSPH,
      LeftCYL,
      LeftAXIS,
      LeftADD,

      PD,

      VisualAcuityRight,
      VisualAcuityLeft,

      DoctorName,
      TestedBy,
      Complaint,
      Notes,
      NextCheckupDate

    } = req.body;

    // =================================================
    // VALIDATE CUSTOMER
    // =================================================

    if (
      CustomerID === undefined ||
      CustomerID === null ||
      CustomerID === ""
    ) {

      return res.status(400).json({
        success: false,
        message: "Customer is required."
      });
    }

    // =================================================
    // CHECK CUSTOMER
    // =================================================

    const [customer] =
      await pool.query(
        `
        SELECT
          CustomerID
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [CustomerID]
      );

    if (customer.length === 0) {

      return res.status(400).json({
        success: false,
        message: "Selected customer does not exist."
      });
    }

    // =================================================
    // UPDATE
    // =================================================

    const [result] =
      await pool.query(
        `
        UPDATE eye_tests

        SET

          CustomerID = ?,

          RightSPH = ?,
          RightCYL = ?,
          RightAXIS = ?,
          RightADD = ?,

          LeftSPH = ?,
          LeftCYL = ?,
          LeftAXIS = ?,
          LeftADD = ?,

          PD = ?,

          VisualAcuityRight = ?,
          VisualAcuityLeft = ?,

          DoctorName = ?,
          TestedBy = ?,
          Complaint = ?,
          Notes = ?,
          NextCheckupDate = ?

        WHERE EyeTestID = ?
        `,
        [

          CustomerID,

          nullable(RightSPH),
          nullable(RightCYL),
          nullable(RightAXIS),
          nullable(RightADD),

          nullable(LeftSPH),
          nullable(LeftCYL),
          nullable(LeftAXIS),
          nullable(LeftADD),

          nullable(PD),

          nullable(VisualAcuityRight),
          nullable(VisualAcuityLeft),

          nullable(DoctorName),

          nullable(TestedBy) === null
            ? null
            : Number(TestedBy),

          nullable(Complaint),
          nullable(Notes),
          nullable(NextCheckupDate),

          id
        ]
      );

    // =================================================
    // NOT FOUND
    // =================================================

    if (result.affectedRows === 0) {

      const [existing] =
        await pool.query(
          `
          SELECT
            EyeTestID
          FROM eye_tests
          WHERE EyeTestID = ?
          LIMIT 1
          `,
          [id]
        );

      if (existing.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Eye test not found."
        });
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Eye test updated successfully."
    });

  } catch (error) {

    console.error(
      "Update Eye Test Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update eye test.",
      error: error.message
    });
  }
};


// =====================================================
// DELETE EYE TEST
// DELETE /api/eye-tests/:id
// =====================================================

export const deleteEyeTest = async (req, res) => {

  try {

    const { id } = req.params;

    // =================================================
    // DELETE
    // =================================================

    const [result] =
      await pool.query(
        `
        DELETE FROM eye_tests
        WHERE EyeTestID = ?
        `,
        [id]
      );

    // =================================================
    // NOT FOUND
    // =================================================

    if (result.affectedRows === 0) {

      return res.status(404).json({
        success: false,
        message: "Eye test not found."
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Eye test deleted successfully."
    });

  } catch (error) {

    console.error(
      "Delete Eye Test Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete eye test.",
      error: error.message
    });
  }
};


// =====================================================
// EYE TEST SUMMARY
// GET /api/eye-tests/summary
// =====================================================

export const getEyeTestSummary = async (req, res) => {

  try {

    // =================================================
    // SUMMARY
    // =================================================

    const [summary] =
      await pool.query(
        `
        SELECT

          COUNT(*) AS totalTests,

          COUNT(
            DISTINCT CustomerID
          ) AS testedCustomers,

          COUNT(
            CASE
              WHEN DATE(TestDate) = CURDATE()
              THEN 1
            END
          ) AS todayTests

        FROM eye_tests
        `
      );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      summary: {

        totalTests: Number(
          summary[0]?.totalTests || 0
        ),

        testedCustomers: Number(
          summary[0]?.testedCustomers || 0
        ),

        todayTests: Number(
          summary[0]?.todayTests || 0
        )

      }

    });

  } catch (error) {

    console.error(
      "Eye Test Summary Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load eye test summary.",
      error: error.message
    });
  }
};