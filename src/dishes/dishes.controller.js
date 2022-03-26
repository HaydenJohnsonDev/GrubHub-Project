const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Handlers for list, read, create and update

//list
function list (req, res, next) {
    res.json({ data: dishes })
}

//read
function dishExists (req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next()
    } 
    return next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

function read (req, res) {
    const dish = res.locals.dish;
    res.json({ data: dish });
}

//create
function validateNewDish (req, res, next) {
    const { data: { name, description, price, image_url }} = req.body
    if (name && description && price && image_url) {
        if (Number(price) <= 0 || typeof(price) != 'number') {
            return next({
                status: 400,
                message: "Dish must have a price that is an integer greater than 0"
            })
        }
        return next();
    } else {
        if (!name) {
            return next({
                status: 400,
                message: `name`
            })
        }
        if (!description) {
            return next({
                status: 400,
                message: `description`
            })
        }
        if (!price) {
            return next({
                status: 400,
                message: `price`
            })
        }
        if (!image_url) {
            return next({
                status: 400,
                message: `image_url`
            })
        }
        
    }
}

function create (req, res, next) {
    const { data: { name, description, price, image_url }} = req.body
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

//update
function idMatch (req, res, next) {
    const { dishId } = req.params;
    const dish = res.locals.dish;
    const { data: { id }} = req.body
    if (id) {
        if (dish.id === id) return next();
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    } 
    return next();
}

function update (req, res, next) {
    const { dishId } = req.params;
    let { data: { id = dishId, name, description, price, image_url }} = req.body
    let dish = res.locals.dish;
    dish = {
        id: dishId,
        name,
        description,
        price,
        image_url
    }
    res.status(200).json({ data: dish });
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [validateNewDish, create],
    update: [dishExists, validateNewDish, idMatch, update]
}