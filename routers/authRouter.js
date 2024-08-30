 const express=require("express");
 const router=express();
 const auth=require('../middlewares/authMiddleware')
 const upload=require('../middlewares/uploadFile')

const {registerUser,login,profile,updateProfile,getProducts,addTocart,getCart,checkout}=require('../controllers/authController')


router.post('/register',registerUser)
router.post('/login',login)

router.get('/profile',auth,profile)
router.post('/updateProfile',auth,upload.single('photo'),updateProfile)
router.get('/products',auth,getProducts)
router.post('/addcart',auth,addTocart)
router.get('/cart',auth,getCart)
router.post('/checkout',auth,checkout)


module.exports=router;