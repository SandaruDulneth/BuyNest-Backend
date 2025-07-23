import express from 'express';
import mongoose from 'mongoose';


const app = express();
app.use(cors())
app.use(bodyParser.json())
app.use(
    (req,res,next)=>{
        const tokenString = req.header("Authorization")
        if(tokenString != null){
            const token = tokenString.replace("Bearer ", "")

            jwt.verify(token, "nimna", 
                (err,decoded)=>{
                    if(decoded != null){
                        req.user = decoded
                        next()
                    }else{
                        console.log("invalid token")
                        res.status(403).json({
                            message : "Invalid token"
                        })
                    }
                }
            )

        }else{
            next()
        }
    }
)

app.listen( 5000, 
    ()=>{
        console.log('Server is running on port 5000');
    }
)

mongoose.connect("mongodb+srv://sandaru:1234@clusterstorage.2vezela.mongodb.net/?retryWrites=true&w=majority&appName=ClusterStorage")
.then(()=>{
    console.log("Connected to the database")
}).catch(()=>{
    console.log("Database connection failed")
})




