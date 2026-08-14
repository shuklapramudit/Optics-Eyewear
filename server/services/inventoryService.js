import pool from "../config/db.js";

export const getAllInventory = async () => {
  const [rows] = await pool.query(`
    SELECT
      i.InventoryID,
      i.ProductID,
      p.ProductCode,
      p.ProductName,
      p.ImageURL,
      COALESCE(i.Quantity, 0) AS Quantity,
      COALESCE(i.ReservedQuantity, 0) AS ReservedQuantity,
      (COALESCE(i.Quantity, 0) - COALESCE(i.ReservedQuantity, 0)) AS AvailableQuantity,
      COALESCE(i.LastPurchasePrice, 0) AS LastPurchasePrice,
      (COALESCE(i.Quantity, 0) * COALESCE(i.LastPurchasePrice, 0)) AS InventoryValue
    FROM inventory i
    INNER JOIN products p ON p.ProductID = i.ProductID
    ORDER BY p.ProductName ASC
  `);
  return rows;
};

export const getInventorySummary = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS TotalProducts,
      COALESCE(SUM(i.Quantity), 0) AS TotalStock,
      COALESCE(SUM(i.ReservedQuantity), 0) AS ReservedStock,
      COALESCE(SUM(i.Quantity - i.ReservedQuantity), 0) AS AvailableStock,
      COALESCE(SUM(i.Quantity * i.LastPurchasePrice), 0) AS InventoryValue,
      COALESCE(SUM(CASE WHEN i.Quantity > 0 AND i.Quantity <= 10 THEN 1 ELSE 0 END), 0) AS LowStock,
      COALESCE(SUM(CASE WHEN i.Quantity <= 0 THEN 1 ELSE 0 END), 0) AS OutOfStock
    FROM inventory i
  `);

  return rows[0] || {
    TotalProducts: 0,
    TotalStock: 0,
    ReservedStock: 0,
    AvailableStock: 0,
    InventoryValue: 0,
    LowStock: 0,
    OutOfStock: 0,
  };
};

export const getInventoryByProductId = async (productId) => {
  const [rows] = await pool.query(
    `
      SELECT
        i.InventoryID,
        i.ProductID,
        p.ProductCode,
        p.ProductName,
        p.ImageURL,
        COALESCE(i.Quantity, 0) AS Quantity,
        COALESCE(i.ReservedQuantity, 0) AS ReservedQuantity,
        (COALESCE(i.Quantity, 0) - COALESCE(i.ReservedQuantity, 0)) AS AvailableQuantity,
        COALESCE(i.LastPurchasePrice, 0) AS LastPurchasePrice
      FROM inventory i
      INNER JOIN products p ON p.ProductID = i.ProductID
      WHERE i.ProductID = ?
      LIMIT 1
    `,
    [productId]
  );
  return rows[0] || null;
};

export const updateStock = async ({ productId, quantity, operation, notes = null }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [inventoryRows] = await connection.query(
      `SELECT InventoryID, Quantity FROM inventory WHERE ProductID = ? FOR UPDATE`,
      [productId]
    );

    if (inventoryRows.length === 0) {
      throw new Error("Inventory record not found for this product.");
    }

    const currentQuantity = Number(inventoryRows[0].Quantity) || 0;
    const changeQuantity = Number(quantity);

    if (!Number.isFinite(changeQuantity) || changeQuantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    let newQuantity = currentQuantity;
    if (operation === "IN") {
      newQuantity = currentQuantity + changeQuantity;
    } else if (operation === "OUT") {
      newQuantity = currentQuantity - changeQuantity;
      if (newQuantity < 0) {
        throw new Error("Stock cannot become negative.");
      }
    } else {
      throw new Error("Invalid stock operation.");
    }

    await connection.query(
      `UPDATE inventory SET Quantity = ? WHERE ProductID = ?`,
      [newQuantity, productId]
    );

    try {
      await connection.query(
        `INSERT INTO inventory_transactions (ProductID, TransactionType, Quantity, Notes) VALUES (?, ?, ?, ?)`,
        [productId, operation === "IN" ? "STOCK_IN" : "STOCK_OUT", changeQuantity, notes]
      );
    } catch (transactionError) {
      console.warn("Inventory transaction history was not saved:", transactionError.message);
    }

    await connection.commit();

    return {
      ProductID: Number(productId),
      PreviousQuantity: currentQuantity,
      ChangedQuantity: changeQuantity,
      NewQuantity: newQuantity,
      Operation: operation,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};