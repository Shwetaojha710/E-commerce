const Address = require('../models/Address.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort('-isDefault -createdAt');
  return res.json(new ApiResponse(200, { addresses }));
});

const createAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= 5) throw new ApiError(400, 'Maximum 5 addresses allowed');

  const isDefault = count === 0 ? true : req.body.isDefault || false;
  const address = await Address.create({ ...req.body, user: req.user._id, isDefault });

  return res.status(201).json(new ApiResponse(201, { address }, 'Address added'));
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!address) throw new ApiError(404, 'Address not found');
  return res.json(new ApiResponse(200, { address }, 'Address updated'));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  return res.json(new ApiResponse(200, null, 'Address deleted'));
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');

  address.isDefault = true;
  await address.save();

  return res.json(new ApiResponse(200, { address }, 'Default address set'));
});

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress };
