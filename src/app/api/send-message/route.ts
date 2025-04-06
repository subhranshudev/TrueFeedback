import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { Message } from "@/models/User";

export async function POST(request: Request) {
  await dbConnect();

  const { username, content } = await request.json();

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // is user accepting message
    if (!user.isAcceptingMessage) {
        return Response.json(
          { success: false, message: "User is not accepting the message" },
          { status: 403 }
        );
    }

    const newMesasage = {content, createdAt: new Date()}
    user.messages.push(newMesasage as Message)

    await user.save()

    return Response.json(
      { success: true, message: "Message sent successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.log("Error in sending the message",error);
    
    return Response.json(
      {
        success: false,
        message: "Something went wrong while sending the message",
      },
      { status: 500 }
    );
  }
}
