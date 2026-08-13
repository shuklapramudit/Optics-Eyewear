import {
  useInventoryContext,
} from "./InventoryContext.jsx";

const useInventory = () => {
  return useInventoryContext();
};

export default useInventory;