
import bcrypt from "bcrypt";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import OTP from "../models/otp.js";
import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();


export async function createUser(req, res) {
    if (req.body.role == "admin") {
        if (req.user != null) {
            if (req.user.role != "admin") {
                res.status(403).json({
                    message: "You are not authorized to create admin accounts"
                });
                return;
            }
        } else {
            res.status(403).json({
                message: "You are not authorized to create admin accounts. Please login first"
            });
            return;
        }
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(400).json({
            message: "Email is already taken, please use a different email."
        });
    }

    const lastUser = await User.findOne().sort({ userId: -1 }); 
    let generatedUserId = "BYN00001"; 

    if (lastUser && lastUser.userId) {
        const lastUserId = lastUser.userId;
        const lastNumber = parseInt(lastUserId.replace("BYN", ""));
        const newNumber = lastNumber + 1;
        generatedUserId = "BYN" + String(newNumber).padStart(5, "0"); 
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
        userId: generatedUserId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
    });

    user.save().then(
        () => {
            res.json({
                message: "User created successfully"
            });
        }
    ).catch(() => {
        res.status(500).json({
            message: "Failed to create user"
        });
    });
}


export function loginUser(req, res) {
  const { email, password } = req.body;

  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "You are Blocked :)" });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        img: user.img,
      },
      "buynest"
    );

    return res.json({
      token,
      message: "Login successful",
      role: user.role,
    });
  });
}

export async function getAllUsers(req, res) {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can view all users" });
        }


        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
}

export function getUser(req, res) {
  if (!req.user) {
    return res.status(403).json({
      message: "You are not authorized to view user details",
    });
  }
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name,  
  });
}


export function isAdmin(req){
    if(req.user == null){
        return false
    }
    if(req.user.role != "admin"){
        return false
    }
    return true
}



export async function editUser(req, res) {
  try {
    const { userId } = req.params; // /api/users/:userId

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;

    if (req.body.password) {
      user.password = bcrypt.hashSync(req.body.password, 10);
    }

    await user.save();

    res.json({
      message: "User updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update user",
      error: err.message,
    });
  }
}



// controllers/userController.js
export async function toggleBlockUser(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Only admins can block/unblock users" });
    }

    const rawId = String(req.params.userId || "").trim();
    const userId = rawId.toUpperCase();

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ message: "You cannot block/unblock an admin" });
    }
    if (req.user?.userId === userId) {
      return res.status(403).json({ message: "You cannot block/unblock yourself" });
    }

    // If client sent explicit isBlocked, use it; otherwise toggle
    const desired =
      typeof req.body?.isBlocked === "boolean" ? req.body.isBlocked : !user.isBlocked;

    // no-op / idempotent response
    if (user.isBlocked === desired) {
      const { password, ...sanitized } = user.toObject();
      return res.status(200).json({
        message: desired ? "User is already blocked" : "User is already unblocked",
        user: sanitized,
      });
    }

    user.isBlocked = desired;
    await user.save();

    const { password, ...sanitized } = user.toObject();
    return res.status(200).json({
      message: desired ? "User blocked" : "User unblocked",
      user: sanitized,
    });
  } catch (err) {
    console.error("toggleBlockUser error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update user block status", error: err.message });
  }
}


/////////////////////////////////////////
const transport = nodemailer.createTransport({
    service: 'gmail',
    host : 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
})

export async function sendOTP(req,res){

    const randomOTP = Math.floor(100000 + Math.random() * 900000);
    const email = req.body.email;
    if(email == null){
        res.status(400).json({
            message: "Email is required"
        });
        return;
    
    }
    const user = await User.findOne({
        email : email
    })
    if(user == null){
        res.status(404).json({
            message:"User not found"
        })
    }

    //delete all otps
    await OTP.deleteMany({
        email: email
    })

    
    const message = {
        from : process.env.MAIL_USER,
        to: email,
        subject : "Resetting password for Buynest.",
        text : "This your password reset OTP : " + randomOTP
    }

    const otp = new OTP({
        email : email,
        otp : randomOTP
    })
    await otp.save()
    transport.sendMail(message,(error,info)=>{
            if(error){
                res.status(500).json({
                    message: "Failed to send OTP",
                    error: error
                });
            }else{
                res.json({
                    message: "OTP sent successfully",
                    otp: randomOTP
                });
            }
        }
    )
}


export async function resetPassword(req,res){
    const otp  = req.body.otp
    const email = req.body.email
    const newPassword = req.body.newPassword
    console.log(otp)
    const response = await OTP.findOne({
        email : email
    })
    
    if(response==null){
        res.status(500).json({
            message : "No otp requests found please try again"
        })
        return
    }
    if(otp == response.otp){
        await OTP.deleteMany(
            {
                email: email
            }
        )
        console.log(newPassword)

        const hashedPassword = bcrypt.hashSync(newPassword, 10)
        const response2 = await User.updateOne(
            {email : email},
            {
                password : hashedPassword
            }
        )
        res.json({
            message : "password has been reset successfully"
        })
    }else{
        res.status(403).json({
            meassage : "OTPs are not matching!"
        })
    }
}





export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email,
        userId: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    // Generate new token with updated information
    const newToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        img: user.img,
      },
      "buynest"
    );

    res.json({
      message: "Profile updated successfully",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token: newToken
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      message: "Failed to update profile",
      error: err.message,
    });
  }
}



export async function loginWithGoogle(req,res){
    const token = req.body.accessToken;
    if(token == null){
        res.status(400).json({
            message: "Access token is required"
        });
        return;
    }
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    console.log(response.data);

    const user = await User.findOne({
        email: response.data.email
    })

    const lastUser = await User.findOne().sort({ userId: -1 }); 
    let generatedUserId = "BYN00001"; 

    if (lastUser && lastUser.userId) {
        const lastUserId = lastUser.userId;
        const lastNumber = parseInt(lastUserId.replace("BYN", ""));
        const newNumber = lastNumber + 1;
        generatedUserId = "BYN" + String(newNumber).padStart(5, "0"); 
    }
    
    if(user == null){
        const newUser = new User(
            {
                userId : generatedUserId,
                email: response.data.email,
                firstName: response.data.given_name,
                lastName: response.data.family_name,
                password: "googleUser",
                img: response.data.picture 
            }
        )
        await newUser.save();
        const token = jwt.sign(
            {
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                img: newUser.img
            },
             "buynest"
        )
        res.json({
            message: "Login successful",
            token: token,
            role: newUser.role
        })

    }else{

        const token = jwt.sign(
            {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                img: user.img
            },
            "buynest"
        )
        res.json({
            message: "Login successful",
            token: token,
            role: user.role
        })

    }

}