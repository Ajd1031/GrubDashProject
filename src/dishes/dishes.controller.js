const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
}

function priceVaildator(price) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[price] <= 0 || !Number.isInteger(data[price])) {
      return next({
        status: 400,
        message: "Dish must have a price that is an integar greater than 0",
      });
    } else {
      next();
    }
  };
}

function hasProperty(property) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[property]) {
      return next();
    } else {
      next({
        status: 400,
        message: `Dish musts include a ${property}`,
      });
    }
  };
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExist(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (!foundDish) {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }

  if (id && id != dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.status(200).json({ data: dish });
}

module.exports = {
  update: [
    hasProperty("name"),
    hasProperty("description"),
    hasProperty("price"),
    dishExist,
    hasProperty("image_url"),
    priceVaildator("price"),
    update,
  ],
  read: [dishExist, read],
  create: [
    hasProperty("name"),
    hasProperty("description"),
    hasProperty("price"),
    hasProperty("image_url"),
    priceVaildator("price"),
    create,
  ],
  list,
};
