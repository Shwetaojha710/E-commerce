const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/address.controller');

router.use(protect);

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;
