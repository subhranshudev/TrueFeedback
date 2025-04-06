import "next-auth";
import { DefaultSession } from "next-auth";

// next auth kahuchi je mu jou user daechi sei user ru jetiki data achi setiki use kara, But ame ta custom user model banaeche
// jouthire ahuri bahut jinisa achi, sethipain taku use kariaku hele se next-auth ra jou user achi taku modify kari sethire ama 
// extra properties add kariba. Aeta kariba pain ame se pura next-auth module ku access kariba au ta vitare User ku modify kariba

declare module "next-auth" {
    interface User{
        _id?: string,
        isVerified?: boolean,
        isAcceptingMessages?: boolean,
        username?: string
    }
    interface Session {
      user: {
        _id?: string;
        isVerified?: boolean;
        isAcceptingMessages?: boolean;
        username?: string;
      } & DefaultSession['user']
    }
}

declare module 'next-auth/jwt'{
    interface JWT {
      _id?: string;
      isVerified?: boolean;
      isAcceptingMessages?: boolean;
      username?: string;
    }
}