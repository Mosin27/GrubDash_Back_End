const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// validations: nameIsValid, descriptionIsValid, priceIsValid, imageIsValid, priceIsNumber, dishIdMatches, dishExists
// request functions: list, read, update, create

function nameIsValid(req, res, next) {
    const { data: { name } = {} } = req.body;

    if(name) {
        res.locals.name = name
        return next();
    }

    next({
        status: 400,
        message: "Dish must include a name",
    })
};

function descriptionIsValid(req, res, next) {
    const { data: { description } = {} } = req.body;

    if(description) {
        res.locals.description = description;
        return next();
    }
    
    next({
        status: 400,
        message: "Dish must include a description",
    })
};

function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;

    if(price) {
        res.locals.price = price;
        return next();
    }

    next({
        status: 400,
        message: "Dish must include a price",
    })
};

function imageIsValid(req, res, next) {
    const { data: { image_url } = {} } = req.body;

    if(image_url) {
        res.locals.image_url = image_url;
        next();
    }

    next({
        status: 400,
        message: "Dish must include a image_url",
    })
};

function priceIsGreaterThanZero(req, res, next) {
    const { data: { price } = {} } = req.body

    if(price > 0) {
        res.locals.price = price;
        return next()
    }
    next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
    })
}

function priceIsNumber(req, res, next) {
    const { data: { price } = {} } = req.body;
    
    if(typeof res.locals.price !== "number" || res.locals.price <= 0) {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
        })
    }
    return next();
};

function dishIdMatches(req, res, next) {
    const { data: { id } = {} } = req.body;
    const dishId = req.params.dishId;

    if(id !== "" && id !== dishId && id !== null && id !== undefined) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    }
    next();
};

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    })
};

function list(req, res) {
    res.json({ data: dishes });
};

function read(req, res) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find(dish => dish.id === dishId);
    res.json({ data: foundDish })
};

function create(req, res) {
    const { data: { name, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        price,
        image_url,
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish });
};

function update(req, res) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    const { data: { name, description, price, image_url } = {} } = req.body

    foundDish.name = name
    foundDish.description = description
    foundDish.price = price
    foundDish.image_url = image_url
    res.json({ data: foundDish })
};

module.exports ={
    list,
    read: [dishExists, read],
    create: [nameIsValid, descriptionIsValid, priceIsValid, imageIsValid, priceIsGreaterThanZero, create],
    update: [dishExists, dishIdMatches, nameIsValid, descriptionIsValid, priceIsValid, imageIsValid, priceIsNumber, update],
}