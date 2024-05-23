import Auth from "../common/auth.js";
import crypto from 'crypto';
import emailService from "../common/emailService.js";
import adminModel from "../models/admin.js";
import userModel from "../models/user.js";
import engineerModel from "../models/engineer.js" 
import serviceModel from "../models/service.js";
import CompletedService from "../common/CompletedService.js";



//Function to get the active engineerId
const ActiveEngineers = async (req, res) => {
  try {
    
    let engineers = await engineerModel.find({
      assignedusers: []
    });
    
    // Retrieve engineers with assigned users array empty or count less than 2
    let assignedengineers = await engineerModel.countDocuments({assignedusers:{ $size: 2 }})
    return res.status(200).send({
      message: "Data Fetched Successfully",
      engineers,
      assignedengineers
    });
  } catch (error) {
    
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to assign an engineer to a user
const assignEngineer = async (req, res) => {
  try {
    // Find the user by their ID
    const user = await userModel.findById(req.params.id);
    

    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    // Check if the user is already assigned to an engineer
    if (user.serviceEngineer) {
      return res.status(400).send({
        message: "User is already assigned to an engineer",
      });
    }

    // Find the engineer by their id
    const engineer = await engineerModel.findById(  req.body.id );
    
    

    if (!engineer) {
      return res.status(404).send({
        message: "Engineer not found",
      });
    }

    // Update user's service engineer
    user.serviceEngineer = engineer._id;

   // Add user to engineer's assigned users
   engineer.assignedusers.push(user._id);


    // Save changes to the database
    await user.save();
    await engineer.save();

    // Send a success response with details
    return res.status(201).send({
      message: `User ${user.name} assigned to Engineer ${engineer.name} successfully`,
      user: user,
    });
  } catch (error) {
    // Handle server error
    console.error("Error assigning engineer:", error);
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to get the count of documents (engineer, user, service)
const getReports = async (req, res) => {
  try {
    // Count documents in different models
    const userCount = await userModel.countDocuments({ createdAt: { $exists: true } });
    const engineerCount = await engineerModel.countDocuments({ createdAt: { $exists: true } });
    const service = await serviceModel.countDocuments({ Date: { $exists: true } })

    // Count pending and completed users
    const pendingusers = await userModel.countDocuments({status:true})
    const completedusers = await userModel.countDocuments({action:false})

    // Send the counts in the response
    res.status(200).json({ userCount, engineerCount, service, pendingusers, completedusers });
  } catch (error) {
    // Handle server error
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const serviceReports = async (req, res) => {
  try {
    const currentDate = new Date();
   
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const userCountsByDate = await userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert the result to a more readable format if needed
    const userCountsByDateFormatted = {};
    userCountsByDate.forEach((result) => {
      const {  day } = result._id;
      const formattedDate = `${day < 10 ? '0' + day : day}`;
      userCountsByDateFormatted[formattedDate] = result.count;
    });

    res.status(200).json(userCountsByDateFormatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Function to get completed users
const completedUsers = async (req, res) => {
  try {
    // Decode the token to get admin information
    let token = req.headers.authorization?.split(" ")[1]
    let data = await Auth.decodeToken(token)

    // Find users with action: false
    const users = await userModel.find({ action: false });
    let admin = await adminModel.findOne({email:data.email})

    // Check if any users were found
    if (!users || users.length === 0) {
      return res.status(404).send({
        message: "No users with pending action found",
      });
    }

    // Add found users to adminModel's completedReq array
    admin.completedReq.push(...users);

    // Save changes to the database
    await admin.save();

    // Send a success response with details
    res.status(200).send({
      message: "Completed Requests",
      completedUsers: users,
    });
  } catch (error) {
    // Handle server error
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to create a new admin
const createAdmin = async (req, res) => {
  try {
    // Check if user with the given email already exists
    const existingUser = await adminModel.findOne({ email: req.body.email });

    if (!existingUser) {
      // Hash the password before storing it in the database
      req.body.password = await Auth.hashPassword(req.body.password);

      // Create a new user
      await adminModel.create(req.body);

      // Respond with a 201 status indicating successful creation
      res.status(201).send({
        message: "Admin created successfully",
      });
    } else {
      // User with the email already exists
      res.status(400).send({
        message: `Admin with ${req.body.email} already exists`,
      });
    }
  } catch (error) {
    // Handle internal server error
    console.error("Error creating user:", error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to get admin details
const getadmin = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
   
    const admin = await adminModel.findOne({email:data.email});
    
    
    if (admin) {
      res.send({
        message: "Data is fetched successfully",
        admin: admin,
      });
    } else {
      res.status(404).send({
        message: "Admin not found. Invalid ID.",
      });
    }
  } catch (error) {
    console.error("Error:", error);

    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};




 export default {
  ActiveEngineers,
  assignEngineer,
  
  completedUsers,
  getReports,
  serviceReports,
  
  createAdmin,
  getadmin
 
};
