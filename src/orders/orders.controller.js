const e = require("express");
const { stat } = require("fs");
const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: orders });
}

function hasProperty(property) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[property]) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Order must include a ${property}`,
      });
    }
  };
}

function dishesValidator(dishes) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (!Array.isArray(data[dishes]) || data[dishes].length <= 0) {
      return next({
        status: 400,
        message: `Order must include at least one dish`,
      });
    } else {
      return next();
    }
  };
}

function quantityValidator(dishes) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const dishesArray = data[dishes];
    for (let i = 0; i < dishesArray.length; i++) {
      let { quantity } = dishesArray[i];
      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
      }
    }
    return next();
  };
}

function create(req, res) {
  const { data: { deliverTo, modbileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    modbileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExist(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    next({
      status: 404,
      message: `Dish does not exist: ${orderId}`,
    });
  }
  
  if (id && id != undefined && id != orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } 
}

function statusValidator(status) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const acceptableStatuses = ["pending", "preparing", "out-for-delivery"];

    if (data[status] === "delivered") {
      next({
        status: 404,
        message: "A delivered order cannot be changed",
      });
    } else if (
      !data[status] ||
      data[status].length <= 0 ||
      !acceptableStatuses.includes(data[status])
    ) {
      next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    } else {
      next();
    }
  };
}

function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

//check if that status equals "pending" on the order that is to be deleted
function deletionStatus(req, res, next) {
  const { data = {} } = req.body;
  const order = res.locals.order;
  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  } else {
    next();
  }
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

module.exports = {
  create: [
    hasProperty("deliverTo"),
    hasProperty("mobileNumber"),
    hasProperty("dishes"),
    dishesValidator("dishes"),
    quantityValidator("dishes"),
    create,
  ],
  list,
  update: [
    hasProperty("deliverTo"),
    hasProperty("mobileNumber"),
    hasProperty("status"),
    hasProperty("dishes"),
    dishesValidator("dishes"),
    quantityValidator("dishes"),
    statusValidator("status"),
    orderExist,
    update,
  ],
  delete: [orderExist, deletionStatus, destroy],
  read: [orderExist, read],
};
