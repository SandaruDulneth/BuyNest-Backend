import User from "../models/user.js"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

export function loginUser(req,res){
    const email = req.body.email
    const password = req.body.password

    User.findOne({email : email}).then(
        (user)=>{
            if(user == null){
                res.status(404).json({
                    message : "User not found"
                })
            }else{
                const isPasswordCorrect = bcrypt.compareSync(password , user.password)
                if(isPasswordCorrect){
                    const token = jwt.sign(
                        {   userId : user.userId,
                            email : user.email,
                            firstName : user.firstName,
                            lastName : user.lastName,
                            role : user.role,
                            img : user.img
                        },
                        "buynest"
                    )
                    res.json({
                        token : token,
                        message : "Login successful",
                        role : user.role,
                    })

                }else{
                    res.status(401).json({
                        message : "Invalid password",
                    })
                }
            }

        }
    )
    
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

export function isAdmin(req){
    if(req.user == null){
        return false
    }
    if(req.user.role != "admin"){
        return false
    }
    return true
}
