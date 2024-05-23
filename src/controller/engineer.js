// Importing required modules and models
import engineerModel from "../models/engineer.js";
import serviceModel from "../models/service.js";
import emailService from "../common/emailService.js";
import userModel from "../models/user.js";
import Auth from "../common/auth.js";
import crypto from "crypto";


// To get Assigned Users
const AssignedUsers = async (req, res) => {
  try {
    // Extracting and decoding the token
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    // Finding the engineer based on email
    let engineer = await engineerModel.findOne({ email: data.email });

    if (engineer) {
      let assignedUserIds = engineer.assignedusers;

      // Retrieve all assigned users based on their IDs
      let assignedUsers = await userModel.find({
        _id: { $in: assignedUserIds },
      });

      if (assignedUsers && assignedUsers.length > 0) {
        res.status(200).send({
          message: "Assigned users are fetched successfully",
          AssignedUsers: assignedUsers,
        });
      } else {
        res.status(400).send({
          message: "No assigned users",
        });
      }
    } else {
      res.status(400).send({
        message: "Engineer not found",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to update user action
const updateStatus = async (req, res) => {
  try {
   
    // Finding the user by id
    let user = await userModel.findById({_id:req.params.id});

    // Check if user is found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const { update } = req.body;

    // Check if update is defined and has a valid value
    if (update !== undefined) {
      // Check the value of update and update the status accordingly
      user.status = update === "false" ? false : true;
    } else {
      return res.status(400).send({ message: "Update value is missing" });
    }

    // Save the updated status
    await user.save();

    res.status(200).send({
      message: "User Data Saved",
      User: user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//To get Reports
const getReports = async (req, res) => {
  try {
    // Count documents in different models
    const assigned = await engineerModel.countDocuments({ assignedusers:[] });
    const userCount = await userModel.countDocuments({ createdAt: { $exists: true } });
   

    // Count pending and completed users
    const pending = await userModel.countDocuments({ status:true })
    const completed = await userModel.countDocuments({status:false})

    // Send the counts in the response
    res.status(200).json({ userCount, assigned, pending, completed });
  } catch (error) {
    // Handle server error
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//To get service Reports
const serviceReports = async (req, res) => {
  try {
    const currentDate = new Date();
   
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const serviceByDate = await serviceModel.aggregate([
      {
        $match: {
          Date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$Date" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert the result to a more readable format if needed
    const user = {};
    serviceByDate.forEach((result) => {
      const {  day } = result._id;
      const formattedDate = `${day < 10 ? '0' + day : day}`;
      user[formattedDate] = result.count;
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// To edit service
const EditService = async (req, res) => {
  try {
    // Finding the user by id
    let user = await userModel.findById({ id: params._id });

    if (user) {
      const { brand, model, manufactureyear, servicetype } = req.body;

      // Updating user details if provided
      if (brand) user.brand = brand;
      if (model) user.model = model;
      if (manufactureyear) user.manufactureyear = manufactureyear;
      if (servicetype) user.servicetype = servicetype;

      // Save the updated Engineer
      await user.save();

      res.status(200).send({
        message: "User Data Saved",
        User: Service,
      });
    } else {
      res.status(400).send({ message: "Invalid data" });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



// To get the list of completed users
const userslist = async (req, res) => {
  try {
    let user = await userModel.find({ status: false });
    if (user) {
      res.status(200).send({
        message: "Completed Users list are listed here",
        user: user,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal server Error",
      error: error.message,
    });
  }
};


// To get all engineers
const getEngineers = async (req, res) => {
  try {
    let engineer = await engineerModel.find({}, { password: 0 });
    return res.status(200).send({
      message: "User Data Fetched Successfully",
      engineer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// To edit engineer details
const EditEngineer = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
    let id = await engineerModel.findOne({ id: data._id });

    const engineer = await engineerModel.findById(id);

    if (engineer) {
      const { name, email, phonenumber } = req.body;

      // Updating engineer details if provided
      if (name) engineer.name = name;
      if (email) engineer.email = email;
      if (phonenumber) engineer.phonenumber = phonenumber;

      // Save the updated Engineer
      await engineer.save();

      res.status(200).send({
        message: "User Data Saved",
        Engineer: engineer,
      });
    } else {
      res.status(400).send({ message: "Invalid data" });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// API to get a specific Engineer
const getengineerById = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    const engineer = await engineerModel.findOne({ email: data.email });
  

    if (engineer) {
      res.send({
        message: "Data is fetched successfully",
        engineer: engineer,
      });
    } else {
      res.status(404).send({
        message: "Engineer not found. Invalid ID.",
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
 
  AssignedUsers,
  updateStatus,
  userslist,
  getReports,
  serviceReports,
  EditService,
 
  EditEngineer,
  getEngineers,
  getengineerById,
};
