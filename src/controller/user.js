import userModel from "../models/user.js";
import engineerModel from "../models/engineer.js";
import serviceModel from "../models/service.js";
import emailService from "../common/emailService.js";
import Auth from "../common/auth.js";
import crypto from "crypto";

// Function to get active users
const getActiveUsers = async (req, res) => {
  try {
    // Retrieve users unassigned users
    let activeuser = await userModel.find({serviceEngineer:{$exists:false}});
    return res.status(200).send({
      message: "User Data Fetched Successfully",
      activeuser,
    });
  } catch (error) {
    // Handle internal server error
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to book a service for a user
const BookService = async (req, res) => {
  try {
    // Ensure the token exists before attempting to decode
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      // Send an unauthorized response if the token is missing
      return res.status(401).send({
        message: "Unauthorized: Token is missing",
      });
    }

    // Decode the token to get user information
    const data = await Auth.decodeToken(token);
    
    // Find the user based on the decoded email
    const user = await userModel.findOne({ email: data.email });
    
    if (!user) {
      // Send an error response if the user does not exist
      return res.status(404).send({
        message: `User with email ${data.email} does not exist`,
      });
    }

    if (user.service.length > 0) {
       // Send a response indicating that a service has already been booked
       return res.status(400).send({
        message: "Service already booked",
      });
    }
      // Create a new service object from the request body
      const newService = await serviceModel.create(req.body);

      // Save the new service to the database
      await newService.save();
  
      // Push the new service into the user's service array
      user.service.push(newService);
  
      // Save the updated user to the database
      await user.save();
  
      // Respond with a success message and user data
      res.status(201).send({
        message: "Service created successfully",
        user,
      });

  } catch (error) {
    // Handle internal server error
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const EditService = async (req, res) => {
  try {
    // Decode the token from the request headers
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    // Find the user based on the decoded email
    const user = await userModel.findOne({ email: data.email });
    // Send a 404 response if the user is not found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Destructure properties from the request body
    const {
      brand,
      model,
      manufactureyear,
      servicetype,
    } = req.body;

    // Update service properties if provided in the request
    if (user.service) {
      const service = user.service[0]; 
      if (brand) service.brand = brand;
      if (model) service.model = model;
      if (manufactureyear) service.manufactureyear = manufactureyear;
      if (servicetype) service.servicetype = servicetype;

      // Update user's service reference
      user.service = [service];
    }

    // Save the updated user
    await user.save();

    // Respond with a success message and user data
    res.status(200).send({
      message: "User Data Saved",
      user: user,
    });
  } catch (error) {
    // Handle internal server error
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to get service details for a user
const servicedetails = async (req, res) => {
  try {
    // Decode the token from the request headers
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
    
    // Find the user based on the decoded email
    let user = await userModel.find({ email: data.email });
    
    // Respond with service details if the user exists
    if (user) {
      res.status(200).send({
        message: "User's Service are fetched successfully",
        user,
      });
    }
  } catch (error) {
    // Handle internal server error
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to get user data by ID
const getUserByid = async (req, res) => {
  try {
    // Decode the token from the request headers
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    // Find the user based on the decoded email
    let user = await userModel.findOne({ email: data.email });
   

    // Respond with user data if the user exists
    if (user) {
      res.send({
        message: "Data is fetched successfully",
        user: user,
      });
    } else {
      // Send a 404 response if the user is not found
      res.status(404).send({
        message: "User not found. Invalid ID.",
      });
    }
  } catch (error) {
    // Handle internal server error
    console.error("Error:", error);

    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};





export default {
 
  BookService,
  servicedetails,
  EditService,

  getActiveUsers,
  getUserByid,
  
};
