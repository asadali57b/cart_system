const User= require('../models/user_model')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const Joi=require('joi');
const Products=require('../models/productModel')
const Cart=require('../models/cartModel')
const Order=require('../models/orderModel')

 const SignupSchema = Joi.object({
    userName: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
    mobile: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please type a valid phone number',
        }),
    dob: Joi.date().less('now').required().custom((value, helpers) => {
        if (new Date(value).getFullYear() > (new Date().getFullYear() - 18)) {
            return helpers.message('You must be at least 18 years old');
        }
        return value;
    }),
    gender: Joi.string().valid('male', 'female', 'other').required(),
});
 const signinSchema=Joi.object({
    email:Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required()
})
exports.registerUser= async(req,res)=>{
    
    const { userName, mobile, dob, gender, email, password } = req.body;

    try {
        const {error}=SignupSchema.validate(req.body);
        if(error) return res.status(400).send(error.details[0].message);

        let user= await User.findOne({email: req.body.email});
    if(user) return res.status(400).json({"message":"User Already resgistered"});
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            userName,
            mobile,
            dob,
            gender,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' , newUser});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
exports.login=async (req,res)=>{

}
exports.login = async (req, res, next) => {
    const { error } = signinSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password');

    const token = jwt.sign({
        _id: user._id,
        userName: user.userName,
        email: user.email,
        mobile:user.mobile,
            dob:user.dob,
            gender:user.gender,
    }, 'userData', { expiresIn: '24hr' });

    user.token = token; 
    await user.save(); 

    res.send({
        success: true,
        msg: "User Login Successfully",
        token: token,
        data: [{
            userName: user.userName,
            email: user.email,
            token: token,
            id: user._id,
            mobile:user.mobile,
            dob:user.dob,
            gender:user.gender,

            
        }]
    });

    console.log(`${token}`);
};

exports.profile= async(req,res)=>{
    try{
        const userId=req.user._id;
        userData=await User.findOne({_id:userId})

        res.status(200).json({
            success:true,
            msg:"Profile Data",
            Data:userData
        })
    }
    catch(err){
        res.status(400).json({
            success:false,
            msg:"No Authenticated"
        })
    }
}

 exports.updateProfile=async(req,res)=>{
    try{
        const {id,userName,mobile,email}= req.body;
        const photo = req.file ? req.file.filename : null; 

        let userId=await User.findOne({_id:id});
        if(!userId) return res.status(400).json({msg:"User Id not found"});

        let updateUsername=await User.findOne({_id:id,userName,mobile,email});
        if(updateUsername) return res.status(400).json({msg: "username already assigned"});

        let updatemobile=await User.findOne({_id:id,mobile});
        if(updatemobile) return res.status(400).json({msg: "mobile already assigned"});

        let updateemail=await User.findOne({_id:id,email});
        if(updateemail) return res.status(400).json({msg: "email already assigned"});
        

        var update={
            userName,
            mobile,
            email,
            ...(photo && { photo }) 

        }
        const  updateData= await User.findByIdAndUpdate({_id:id},{$set:update},{new:true})
        return res.status(200).json({
            success:true,
            msg:"Profile Updated Successfully ",
            data:updateData,
        })
        

    }
    catch(err){
        res.status(400).json({
            success:false,
            msg: err,
        })
    }
}
exports.getProducts = async (req, res) => {
    try {
        const products = await Products.find();
        res.json(products);
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}
exports.addTocart=async(req,res)=>{
    const { productId, quantity } = req.body;
    const userId = req.user._id;
try{
    let cart=await Cart.findOne({userId});
    if (!cart) {
        cart = new Cart({ userId, products: [] });
    }
          const existingProduct = cart.products.find(p => p.productId.toString() === productId);

          if (existingProduct) {
            return res.status(400).json({ message: 'Product already added to cart' });
        } else {
            cart.products.push({ productId, quantity: quantity || 1 });
        }

        await cart.save();
        res.json({ message: 'Product added to cart' });

}
catch(err){
    res.status(500).json({ error: 'Failed to add product to cart' });

}

    }
    exports.getCart = async (req, res) => {
        const userId = req.user._id;
    
        try {
            const cart = await Cart.findOne({ userId }).populate('products.productId');
            if (!cart) {
                return res.json({ products: [] });
            }
            res.json(cart.products);
        } catch (err) {
            console.error(err);  
            res.status(500).json({ error: 'Failed to fetch cart' });
        }
    }
    exports.checkout = async (req, res) => {
        const userId = req.user._id;
    
        try {
            // Retrieve the user's cart
            const cart = await Cart.findOne({ userId }).populate('products.productId');
            if (!cart || cart.products.length === 0) {
                return res.status(400).json({ message: 'Cart is empty' });
            }
    
            // Initialize totalPrice
            let totalPrice = 0;
    
            // Calculate the total price
            cart.products.forEach(item => {
                const price = item.productId.price || 0;  // Ensure price is a number
                const quantity = item.quantity || 0;  // Ensure quantity is a number
                totalPrice += price * quantity;
            });
    
            // Validate totalPrice to ensure it's a valid number
            // if (isNaN(totalPrice) || totalPrice <= 0) {
            //     return res.status(400).json({ error: 'Invalid total price' });
            // }
    
            // Create a new order
            const newOrder = new Order({
                userId,
                products: cart.products,
                // totalPrice,
                orderDate: new Date()
            });
            await newOrder.save();
    
            // Clear the cart after checkout
            cart.products = [];
            await cart.save();
    
            // Respond with the order confirmation
            res.json({ message: 'Order placed successfully', orderId: newOrder._id });
        } catch (err) {
            res.status(500).json({ error: 'Failed to process checkout' });
        }
    };
    