import { getServerSession } from "next-auth";
import { User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not Authenticated",
      },
      { status: 401 }
    );
  }
  //console.log("user-object", user);
  
  const userId = new mongoose.Types.ObjectId(user._id);
 // console.log("get-messages-userId", userId);

  try {
     //const dbUser = await UserModel.findById(user._id)
    
     // console.log("dbUser:", dbUser);
    // console.log("dbUser", dbUser?._id);
   
    
    const aggregateUser = await UserModel.aggregate([
      { $match: { _id: userId } },
      { $unwind: '$messages' },
      {$sort: {'messages.createdAt': -1} },
      {$group:{ _id:'$_id', messages: {$push: '$messages'}}}
    ]).exec(); 

    

    //console.log("get-messages-user", aggregateUser);

    if (!aggregateUser || aggregateUser.length === 0) {
      return Response.json(
        {
          success: false,
          message: "No messages to show",
        },
        { status: 402 }
      );
    }

   // console.log("Aggregation pipeline output user: ", aggregateUser);

    return Response.json(
      {
        success: true,
        messages: aggregateUser[0].messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Unexpected error occured: ", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while getting the messages",
      },
      { status: 500 }
    );
  }
}
