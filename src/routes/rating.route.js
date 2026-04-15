// ==>external import<==
const express = require("express");
const ratingRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const RatingController = require("../controllers/rating.controller");
const RatingDTO = require("../validation/rating.dto");
const dtoValidate = require("../middlewares/validate.middleware");

ratingRouter
  .route("/create")
  .post(
    authCheck,
    dtoValidate(RatingDTO.createRatingSchema),
    RatingController.createProductRating
  );

ratingRouter
  .route("/all")
  .get(authCheck, roleCheck("admin"), RatingController.getAllProductRating);

ratingRouter
  .route("/:id")
  .get(RatingController.getSingleProductRating)
  .put(
    authCheck,
    dtoValidate(RatingDTO.activeInactiveRatingSchema),
    roleCheck("admin"),
    RatingController.activeInactiveRating
  )
  .delete(
    dtoValidate(RatingDTO.deleteRatingSchema),
    authCheck,
    roleCheck("admin"),
    RatingController.deleteRating
  );

module.exports = ratingRouter;
