import API_BASE_URL from "../../services/api.js";

const API =
  `${API_BASE_URL}/inventory`;

// =====================================================
// GET INVENTORY
// =====================================================

export const fetchInventory = async () => {
  const response =
    await fetch(API);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load inventory."
    );
  }

  return data;
};

// =====================================================
// GET SUMMARY
// =====================================================

export const fetchInventorySummary =
  async () => {
    const response =
      await fetch(
        `${API}/summary`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load inventory summary."
      );
    }

    return data;
  };

// =====================================================
// GET SINGLE PRODUCT INVENTORY
// =====================================================

export const fetchProductInventory =
  async (productId) => {
    const response =
      await fetch(
        `${API}/product/${productId}`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load inventory."
      );
    }

    return data;
  };

// =====================================================
// CHANGE STOCK
// =====================================================

export const changeInventoryStock =
  async ({
    ProductID,
    Quantity,
    operation,
    notes,
  }) => {
    const response =
      await fetch(
        `${API}/stock`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ProductID,
            Quantity,
            operation,
            notes,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to update stock."
      );
    }

    return data;
  };
