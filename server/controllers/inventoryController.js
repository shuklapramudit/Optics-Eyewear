import {
  getAllInventory,
  getInventorySummary,
  getInventoryByProductId,
  updateStock,
} from "../services/inventoryService.js";

// =====================================================
// GET ALL INVENTORY
// GET /api/inventory
// =====================================================

export const getInventory = async (
  req,
  res
) => {
  try {
    const inventory =
      await getAllInventory();

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });

  } catch (error) {
    console.error(
      "Get Inventory Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load inventory.",
      error:
        error.message,
    });
  }
};

// =====================================================
// GET INVENTORY SUMMARY
// GET /api/inventory/summary
// =====================================================

export const getInventorySummaryData =
  async (req, res) => {
    try {
      const summary =
        await getInventorySummary();

      res.status(200).json({
        success: true,
        summary,
      });

    } catch (error) {
      console.error(
        "Inventory Summary Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load inventory summary.",
        error:
          error.message,
      });
    }
  };

// =====================================================
// GET INVENTORY BY PRODUCT
// GET /api/inventory/product/:productId
// =====================================================

export const getInventoryProduct =
  async (req, res) => {
    try {
      const {
        productId,
      } = req.params;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required.",
        });
      }

      const inventory =
        await getInventoryByProductId(
          productId
        );

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message:
            "Inventory record not found.",
        });
      }

      res.status(200).json({
        success: true,
        inventory,
      });

    } catch (error) {
      console.error(
        "Get Inventory Product Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load inventory.",
        error:
          error.message,
      });
    }
  };

// =====================================================
// STOCK IN / STOCK OUT
// POST /api/inventory/stock
// =====================================================

export const changeStock =
  async (req, res) => {
    try {
      const {
        ProductID,
        productId,
        Quantity,
        quantity,
        operation,
        notes,
      } = req.body;

      const finalProductId =
        ProductID || productId;

      const finalQuantity =
        Quantity ?? quantity;

      if (!finalProductId) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID is required.",
        });
      }

      if (
        finalQuantity === undefined ||
        finalQuantity === null ||
        Number(finalQuantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid quantity is required.",
        });
      }

      const normalizedOperation =
        String(
          operation || ""
        ).toUpperCase();

      if (
        normalizedOperation !== "IN" &&
        normalizedOperation !== "OUT"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Operation must be IN or OUT.",
        });
      }

      const result =
        await updateStock({
          productId:
            finalProductId,
          quantity:
            finalQuantity,
          operation:
            normalizedOperation,
          notes:
            notes || null,
        });

      res.status(200).json({
        success: true,
        message:
          normalizedOperation === "IN"
            ? "Stock added successfully."
            : "Stock removed successfully.",
        result,
      });

    } catch (error) {
      console.error(
        "Change Stock Error:",
        error
      );

      res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to update stock.",
      });
    }
  };