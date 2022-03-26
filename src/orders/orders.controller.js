const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Handlers for list, read, create, update, destroy

//list
function list (req, res, next) {
    res.json({ data: orders })
}

//read
function orderExists (req, res, next) {
    const { orderId } = req.params;
    const foundorder = orders.find((order) => order.id === orderId);
    if (foundorder) {
        res.locals.order = foundorder;
        return next()
    } else {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}.`
        })
    }
}

function read (req, res) {
    const order = res.locals.order;
    res.json({ data: order });
}

//create
function validateNewOrder (req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes }} = req.body
    if (deliverTo && mobileNumber && dishes) {
        if (Array.isArray(dishes)) {
            if (dishes.length == 0) {
                return next({
                    status: 400,
                    message: "Order must include at least one dish"
                })
            }
            for (let i = 0; i < dishes.length; i++) {
                if (!dishes[i].quantity || dishes[i].quantity <= 0 || typeof(dishes[i].quantity) != 'number'){
                    return next({
                        status: 400,
                        message: `Dish ${i} must have a quantity that is an integer greater than 0`
                    })
                }
            }
            return next();
        }
        return next({
            status: 400,
            message: "Order must include at least one dish"
        })
    } else {
        let message = "";
        if (!deliverTo) message = "Order must include a deliverTo";
        if (!mobileNumber) message = "Order must include a mobileNumber";
        if (!dishes) message = "Order must include a dish";
        next({
            status: 400,
            message: `${message}`
        })
    }

}

function create (req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes }} = req.body
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//update
function validateUpdate (req, res, next) {
    const { orderId } = req.params;
    let { data: { id, deliverTo, mobileNumber, status, dishes }} = req.body;
    const foundorder = orders.find((order) => order.id === orderId);
    if (!foundorder) return next({status: 404, message: "no matching order found"})
    if (id) {
        if (orderId !== id) return next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
    }
    if (status == "pending" || status == "preparing" || status == "out-for-delivery") return next();
    if (status == "delivered") return next({
        status: 400,
        message: "A delivered order cannot be changed"
    })
    return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

function update (req, res, next) {
    const { orderId } = req.params;
    let { data: { id, deliverTo, mobileNumber, status, dishes }} = req.body;
    let foundOrder = res.locals.order;
    foundOrder = {
        id: orderId,
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    res.status(200).json({ data: foundOrder });
}

//destroy
function destroy (req, res, next) {
    const { orderId } = req.params;
    const indexToDelete = orders.findIndex((order) => orderId === order.id);
    if (orders[indexToDelete].status === "pending") {
        const deleted = orders.splice(indexToDelete, 1);
        res.sendStatus(204);
    } else {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    }
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [validateNewOrder, create],
    update: [validateNewOrder, validateUpdate, update],
    delete: [orderExists, destroy]
}