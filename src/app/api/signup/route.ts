import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";

import { sendVerificationEmail } from "@/helper/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    // for unique username
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserVerifiedByUsername) {
      return Response.json(
        { success: false, message: "Username is already taken" },
        { status: 400 }
      );
    }

    // Here I checked the uniqueness of username using two fields(username and isVerified). So if the document exists
    // with the same username but isVerified is false then it returns that username is unique. BUT during creating mongoose schema and
    // model I have mentioned "unique: true" property,  thats why mongoose or mongodb is giving error that---> 
        //  [MongoServerError: E11000 duplicate key error collection: TrueFeedback.users index: username_1 dup key: { username: "dj" }] {
        //   errorLabelSet: Set(0) {},
        //   errorResponse: [Object],
        //   index: 0,
        //   code: 11000,
        //   keyPattern: [Object],
        //   keyValue: [Object]
        // }
    // because mongoose do not check any other field, as I am checking in my code. It sees another document with same field value(ex: username)
    // which is mentioned as unique: true, it gives error , that you can't do like this because as it is duplicate.
    // If I just remove the unique: true property then also error is not removed because it already saved in mongodb database.

    const existingUserByEmail = await UserModel.findOne({ email });

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          { success: false, message: "User already exists with this email" },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.username = username; // added by me
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessage: true,
        messages: [],
      });

      await newUser.save();
    }

    // send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        { success: false, message: emailResponse.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "User registered successfully. Please verify your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error registering user", error);
    return Response.json(
      { success: false, message: "Error Registering user" },
      { status: 500 }
    );
  }
}
