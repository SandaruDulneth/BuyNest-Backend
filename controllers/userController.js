import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function createUser(req,res){


    if(req.body.role == "admin"){
        if(req.user!= null){
            if(req.user.role != "admin"){
                res.status(403).json({
                    message : "You are not authorized to create an admin accounts"
                })
                return
            }
        }else{
            res.status(403).json({
                message : "You are not authorized to create an admin accounts. Please login first"
            })
            return
        }
    }


  const lastUser = await User.findOne().sort({ userId: -1 }); 
        let generatedUserId = "BYN00001"; 

        if (lastUser && lastUser.userId) {
            const lastUserId = lastUser.userId;
            const lastNumber = parseInt(lastUserId.replace("BYN", ""));
            const newNumber = lastNumber + 1;
            generatedUserId = "BYN" + String(newNumber).padStart(5, "0"); 
        }
        
    const hashedPassword = bcrypt.hashSync(req.body.password, 10)

    const user = new User({
        userId : generatedUserId,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        email : req.body.email,
        password : hashedPassword,
        role : req.body.role,
    })
    user.save().then(
        ()=>{
            res.json({
                message : "User created successfully"
            })
        }
    ).catch(
        ()=>{
            res.json({
                message : "Failed to create user"
            })
        }
    )
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

