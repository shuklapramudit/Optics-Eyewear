import pool from "../config/db.js";

// =====================================================
// GENERATE REPAIR NUMBER
// =====================================================

const generateRepairNumber =
  async (connection) => {
    const [rows] =
      await connection.query(`
        SELECT RepairID
        FROM repairs
        ORDER BY RepairID DESC
        LIMIT 1
      `);

    const lastId =
      rows.length > 0
        ? Number(
            rows[0].RepairID
          )
        : 0;

    return `REP-${String(
      lastId + 1
    ).padStart(5, "0")}`;
  };

// =====================================================
// GET ALL REPAIRS
// GET /api/repairs
// =====================================================

export const getRepairs =
  async (req, res) => {
    try {
      const search =
        String(
          req.query.search || ""
        ).trim();

      let query = `
        SELECT
          r.*,
          c.FullName AS CustomerName,
          c.Phone AS CustomerPhone
        FROM repairs r
        LEFT JOIN customers c
          ON c.CustomerID = r.CustomerID
      `;

      const params = [];

      if (search) {
        query += `
          WHERE
            r.RepairNumber LIKE ?
            OR c.FullName LIKE ?
            OR c.Phone LIKE ?
            OR r.Status LIKE ?
            OR r.ProblemDescription LIKE ?
        `;

        const value =
          `%${search}%`;

        params.push(
          value,
          value,
          value,
          value,
          value
        );
      }

      query += `
        ORDER BY
          r.RepairID DESC
      `;

      const [repairs] =
        await pool.query(
          query,
          params
        );

      res.json({
        success: true,
        repairs,
      });
    } catch (error) {
      console.error(
        "Get Repairs Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load repairs.",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SINGLE REPAIR
// GET /api/repairs/:id
// =====================================================

export const getRepairById =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const [rows] =
        await pool.query(
          `
          SELECT
            r.*,
            c.FullName AS CustomerName,
            c.Phone AS CustomerPhone,
            c.Email AS CustomerEmail
          FROM repairs r
          LEFT JOIN customers c
            ON c.CustomerID = r.CustomerID
          WHERE r.RepairID = ?
          LIMIT 1
          `,
          [id]
        );

      if (
        rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Repair not found.",
        });
      }

      res.json({
        success: true,
        repair: rows[0],
      });
    } catch (error) {
      console.error(
        "Get Repair Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load repair.",
        error: error.message,
      });
    }
  };

// =====================================================
// CREATE REPAIR
// POST /api/repairs
// =====================================================

export const createRepair =
  async (req, res) => {
    let connection;

    try {
      const {
        CustomerID,
        ItemType,
        ItemDescription,
        ProblemDescription,
        EstimatedCost,
        AdvanceAmount,
        Status,
        ExpectedDate,
        DeliveryDate,
        Notes,
      } = req.body;

      const customerId =
        Number(CustomerID);

      const estimated =
        Number(
          EstimatedCost || 0
        );

      const advance =
        Number(
          AdvanceAmount || 0
        );

      if (
        !Number.isInteger(
          customerId
        ) ||
        customerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid customer.",
        });
      }

      if (
        estimated < 0 ||
        advance < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid repair amount.",
        });
      }

      if (
        advance > estimated
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Advance cannot be greater than estimated cost.",
        });
      }

      const [
        customer,
      ] = await pool.query(
        `
        SELECT CustomerID
        FROM customers
        WHERE CustomerID = ?
        LIMIT 1
        `,
        [customerId]
      );

      if (
        customer.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      connection =
        await pool.getConnection();

      await connection.beginTransaction();

      const repairNumber =
        await generateRepairNumber(
          connection
        );

      const balance =
        Number(
          (
            estimated -
            advance
          ).toFixed(2)
        );

      const [
        result,
      ] = await connection.query(
        `
        INSERT INTO repairs
        (
          RepairNumber,
          CustomerID,
          RepairDate,
          ItemType,
          ItemDescription,
          ProblemDescription,
          EstimatedCost,
          AdvanceAmount,
          BalanceAmount,
          Status,
          ExpectedDate,
          DeliveryDate,
          Notes
        )
        VALUES
        (
          ?,
          ?,
          NOW(),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          repairNumber,

          customerId,

          ItemType ||
            "Frame",

          ItemDescription ||
            null,

          ProblemDescription ||
            null,

          estimated,

          advance,

          balance,

          Status ||
            "Pending",

          ExpectedDate ||
            null,

          DeliveryDate ||
            null,

          Notes ||
            null,
        ]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message:
          "Repair created successfully.",
        repairId:
          result.insertId,
        repairNumber,
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      console.error(
        "Create Repair Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to create repair.",
        error: error.message,
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };

// =====================================================
// UPDATE REPAIR
// PUT /api/repairs/:id
// =====================================================

export const updateRepair =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const {
        CustomerID,
        ItemType,
        ItemDescription,
        ProblemDescription,
        EstimatedCost,
        AdvanceAmount,
        Status,
        ExpectedDate,
        DeliveryDate,
        Notes,
      } = req.body;

      const estimated =
        Number(
          EstimatedCost || 0
        );

      const advance =
        Number(
          AdvanceAmount || 0
        );

      if (
        advance > estimated
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Advance cannot be greater than estimated cost.",
        });
      }

      const balance =
        Number(
          (
            estimated -
            advance
          ).toFixed(2)
        );

      const [
        result,
      ] = await pool.query(
        `
        UPDATE repairs
        SET
          CustomerID = ?,
          ItemType = ?,
          ItemDescription = ?,
          ProblemDescription = ?,
          EstimatedCost = ?,
          AdvanceAmount = ?,
          BalanceAmount = ?,
          Status = ?,
          ExpectedDate = ?,
          DeliveryDate = ?,
          Notes = ?
        WHERE RepairID = ?
        `,
        [
          Number(
            CustomerID
          ),

          ItemType ||
            "Frame",

          ItemDescription ||
            null,

          ProblemDescription ||
            null,

          estimated,

          advance,

          balance,

          Status ||
            "Pending",

          ExpectedDate ||
            null,

          DeliveryDate ||
            null,

          Notes ||
            null,

          id,
        ]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Repair not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Repair updated successfully.",
      });
    } catch (error) {
      console.error(
        "Update Repair Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to update repair.",
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE REPAIR
// DELETE /api/repairs/:id
// =====================================================

export const deleteRepair =
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const [
        result,
      ] = await pool.query(
        `
        DELETE FROM repairs
        WHERE RepairID = ?
        `,
        [id]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Repair not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Repair deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Repair Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete repair.",
        error: error.message,
      });
    }
  };