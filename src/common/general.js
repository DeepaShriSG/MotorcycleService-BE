import userModel from "../models/user.js";
import engineerModel from "../models/engineer.js";
import adminModel from "../models/admin.js";
import Auth from "../common/auth.js";
import emailService from "../common/emailService.js";
import crypto from "crypto";


// Function to get user data by ID
const getuser = async (req, res) => {
  try {
   
    let id = await req.params.id;

    // Find the user based on the id
    let user = await userModel.findOne({ _id: id });
    

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

// Function to get all users
const AllUsers = async (req, res) => {
  try {
    // Retrieve all users from the database
    let user = await userModel.find({});

    if (user) {
      // Send a success response with user data
      res.status(200).send({
        message: "All user data fetched successfully",
        user: user,
      });
    } else {
      // Send a 404 response if no users are found
      res.status(404).send({
        message: "No user's found",
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


const signup = async (req, res) => {
  try {
    const info = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phonenumber: req.body.phonenumber,
      role: req.body.role || "user",
    };

    let model;

    // Determine the appropriate model based on the role
    switch (info.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${info.role}`,
        });
    }

    // Check if user with the given email already exists
    const existingUser = await model.findOne({ email: info.email });

    if (!existingUser) {
      // Hash the password before storing it in the database
      info.password = await Auth.hashPassword(info.password);

      await model.create(info);
      

      // Respond with a success message indicating successful creation
      res.status(201).send({
        message: `${info.role} created successfully`,
      });
    } else {
      // Send a 400 response if the user already exists
      res.status(400).send({
        message: `${info.role} with ${info.email} already exists`,
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

const login = async (req, res) => {
  try {
    const loginInfo = {
      email: req.body.email,
      password: req.body.password,
      phonenumber: req.body.phonenumber,
      role: req.body.role,
    };

    let model;

    switch (loginInfo.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${loginInfo.role}`,
        });
    }

    // Find the user based on email or phone number
    let userData = await model.findOne({ email: loginInfo.email });

    if (!userData) {
      // User, engineer, or admin not found
      return res.status(404).send({
        message: `${loginInfo.role} not found`,
      });
    }

    // Compare hashed password with the provided password
    const hashCompare = await Auth.hashCompare(
      loginInfo.password,
      userData.password
    );

    if (!hashCompare) {
      // Incorrect password
      return res.status(400).send({
        message: "Incorrect password",
      });
    }

    // Create a token for the user and respond with success
    const token = await Auth.createToken({
      name: userData.name,
      email: userData.email,
      phonenumber: userData.phonenumber,
      role: userData.role,
    });

    let user = await model.findOne({email:loginInfo.email},{password:0,code:0})

    // Send response with token
    res.status(200).send({
      message: `${userData.role} Logged in successfully`,
      token,
      user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const info = {
      email: req.body.email,
      phonenumber: req.body.phonenumber,
      role: req.body.role,
    };

    let model;

    // Determine the appropriate model based on the role
    switch (info.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${info.role}`,
        });
    }

    // Find the user based on email or phone number
    let user = await model.findOne({
      $or: [{ email: info.email }, { phonenumber: info.phonenumber }],
    });

    if (user) {
     
       // Create a token for the user and respond with success
       const token = await Auth.createToken({
        name: user.name,
        email: user.email,
        phonenumber: user.phonenumber,
        role: user.role,
        });

        const url = `${process.env.RESETLINK}?token=${token}`;

      // Send the verification url via email
      await emailService.VerifyService({
        name: user.name, url,
        email: user.email,
      });

      // Respond with a success message and the verification url
      res.status(200).send({
        message: `Email verification code sent to ${user.email}. Please check your email and confirm.`
      });
    } else {
      return res.status(400).send({
        message: `Account with ${info.email} does not exist`,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const sendCode = async (req, res) => {
  try {
    // Decode the token from the request headers
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    let model;

    switch (data.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${data.role}`,
        });
    }

    // Find the user based on the decoded email
    let user = await model.findOne({ email: data.email });

    if (user) {
      // Generate a unique verification code
      let code;
      let isCodeUnique = false;

      // Keep generating a new code until it is unique
      do {
        code = crypto.randomBytes(20).toString("hex");
        // Check if the code is unique
        isCodeUnique = !(await userModel.exists({ code: code }));
      } while (!isCodeUnique);

      user.code = code;
      await user.save();

      // Send the verification code via email
      await emailService.VerifyService({
        name: user.name,
        code,
        email: user.email,
      });

      // Respond with a success message and the verification code
      res.status(200).send({
        message: `Email verification code sent to ${user.email}. Please check your email and confirm.`,
        code,
      });
    } else {
      // Send an error response if the user does not exist
      res.status(400).send({
        message: `Account with ${user.email} does not exist`,
      });
    }
  } catch (error) {
    // Handle internal server error
    console.error(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const verifyCode = async (req, res) => {
  try {
    let code = await req.body.code;

    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
    

    let model;

    switch (data.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${data.role}`,
        });
    }

    // Find the user based on the decoded email
    let user = await model.findOne({ email: data.email });

    if (user) {
      if (code === user.code) {
        // Respond with a success message and the verification code
        res.status(200).send({
          message: "Verification Success",
          user,
        });
      }
    } else {
      // Send an error response if the user does not exist
      res.status(400).send({
        message: `Account with ${data.email} does not exist`,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    let model;

    // Determine the appropriate model based on the role
    switch (data.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${data.role}`,
        });
    }

    if (req.body.newpassword === req.body.confirmpassword) {

      let user = await model.findOne({ email: data.email });

      user.password = await Auth.hashPassword(req.body.newpassword);

      await user.save();

      res.status(200).send({
        message: "Password Updated Successfully",
        role: user.role
      });
    } else {
      res.status(400).send({
        message: "Password Does Not match",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
    if (data) {
      res.status(200).send({
        message: "Data fetched Success",
        data,
      });
    } else {
      res.status(400).send({
        message: "Invalid Token",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const editProfile = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);

    let model;

    switch (data.role) {
      case "user":
        model = userModel;
        break;
      case "engineer":
        model = engineerModel;
        break;
      case "admin":
        model = adminModel;
        break;
      default:
        return res.status(400).send({
          message: `Invalid role: ${data.role}`,
        });
    }

    let id = await model.findOne({ id: data._id });

    const user = await model.findById(id);

    if (user) {
      const { name, email, phonenumber } = req.body;

      if (name) user.name = name;
      if (email) user.email = email;
      if (phonenumber) user.phonenumber = phonenumber;

      // Save the updated admin
      await user.save();

      res.status(200).send({
        message: `${data.role} Data Saved`,
        user,
      });
    } else {
      res.status(400).send({ message: `Invalid ${data.role} data` });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
   
    // Finding the user by id
    let user = await userModel.findById({_id:req.params.id});

    let token = req.headers.authorization?.split(" ")[1];
    let data = await Auth.decodeToken(token);
   

    // Check if user is found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const { update } = req.body;

    // Check if update is defined and has a valid value
    if (update !== undefined) {

      if(data.role === "admin"){
         // Check the value of update and update the status accordingly
         user.action = update === "false" ? false : true;
      }else{
        // Check the value of update and update the status accordingly
        user.status = update === "false" ? false : true;
      }
      
    } else {
      return res.status(400).send({ message: "Update value is missing" });
    }

    // Save the updated status
    await user.save();

    res.status(200).send({
      message: "User Data Saved",
      user,
    });
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Function to get service details of a user
const service = async (req, res) => {
  try {
   
    let id = req.params.id
    
    // Find the user based on the id
    let user = await userModel.find({ _id: id});
    
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


export default {
  AllUsers,
  getuser,
  service,
  signup,
  login,
  forgetPassword,
  update,
  sendCode,
  verifyCode,
  resetPassword,
  getProfile,
  editProfile,
};
