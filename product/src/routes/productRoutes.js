const express = require("express");
const authenticate = require("../middlewares/authMiddleware");

module.exports = (productController) => { 
    const router = express.Router();

    router.post("/", authenticate, productController.createProduct);
    router.get("/", authenticate, productController.getProducts);
    router.get("/:id", authenticate, productController.getProductById)
    router.post("/buy", authenticate, productController.createOrder);
    router.get("/orderStatus/:orderId", authenticate, productController.getOrderStatus);

    return router;
};
