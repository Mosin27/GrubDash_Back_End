const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// functions for CRUD ops: create, read, update, delete
// middleware needed: orderHasDeliverToProp, orderHasMobileNumber, orderHasDishProp, dishesArrayValid, dishQuantityIsValid, orderIdMatches, orderHasStatus, statusIsValid, orderExists, 

function orderHasDeliverToProp(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    
    if(deliverTo) {
        res.locals.deliverTo = deliverTo;
        next();
    }
    next({
        status: 400,
        message: "Order must include a deliverTo",
    })
};

function orderHasMobileNumber(req, res, next) {
    const { data: { mobileNumber } = {} } = req.body;

    if(mobileNumber) {
        res.locals.mobileNumber = mobileNumber;
        next();
    }
    next({
        status: 400,
        message: "Order must include a mobileNumber" 
    })
};

function orderHasDishProp(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    if(dishes) {
        res.locals.dishes = dishes;
        next();
    }
    next({
        status: 400,
        message: "Order must include a dish" 
    })
};

function dishesArrayValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    if(!Array.isArray(res.locals.dishes) || res.locals.dishes.length == 0) {
        next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    next();
};

function dishQuantityIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    dishes.forEach((dish) => {
        const quantity = dish.quantity
        if(!quantity || quantity <= 0 || typeof quantity !== "number") {
            return next({
                status: 400,
                message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`
            })
        }
    })
    next();
};

function orderIdMatches(req, res, next) {
    const { data: { id } = {} } = req.body;
    const orderId = req.params.orderId;

    if(id !== "" && id !== orderId && id !== null && id !== undefined) {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        })
    }
    next()
};

function orderHasStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    
    if(status) {
        res.locals.status = status;
        return next()
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
};

function statusIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    
    if(status.includes("pending") || status.includes("preparing") || status.includes("out-for-delivery") || status.includes("delivered")) {
        res.locals.status = status
        return next();
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
};

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    })
};

function list(req, res) {
    res.json({ data: orders });
};

function read(req, res) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    res.json({ data: foundOrder });
};

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status: "out-for-delivery",
        dishes,
    }
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
};

function update(req, res) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    
    foundOrder.deliverTo = deliverTo
    foundOrder.mobileNumber = mobileNumber
    foundOrder.status = status
    foundOrder.dishes = dishes
    res.json({ data: foundOrder })
};

function destroy(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if(foundOrder.status === "pending") {
        const index = orders.findIndex((order) => order.id === Number(orderId))
        orders.splice(index, 1)
        res.sendStatus(204)
    }
    return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
    })
};

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        orderHasDeliverToProp,
        orderHasMobileNumber,
        orderHasDishProp,
        dishesArrayValid,
        dishQuantityIsValid,
        create,
    ],
    update: [
        orderExists,
        orderIdMatches,
        orderHasDeliverToProp,
        orderHasMobileNumber,
        orderHasDishProp,
        orderHasStatus,
        statusIsValid,
        dishesArrayValid,
        dishQuantityIsValid,
        update,
    ],
    delete: [orderExists, destroy],
}