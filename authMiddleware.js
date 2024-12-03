import { auth, db } from "./firebaseConfig";

export async function authenticateUser(req, res, next) {
  const idToken = req.cookies.token; // Assuming JWT token is stored in cookies

  if (!idToken) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid authentication token" });
  }
}

// League calculation based on points
export function calculateLeague(points) {
  if (points < 100) return "Bronze";
  if (points < 250) return "Silver";
  if (points < 500) return "Gold";
  if (points < 1000) return "Platinum";
  return "Legendary";
}

export async function createUserProfile(uid, email, username) {
  const defaultProfile = {
    displayName: username,
    username,
    points: 0,
    league: "Bronze",
    postedQuestions: [],
    likedQuestions: [],
    savedQuestions: [],
  };

  await db.collection("profiles").doc(uid).set(defaultProfile);
  return defaultProfile;
}

// // Profile model interface
// export interface UserProfile {
//   displayName: string;
//   username: string;
//   points: number;
//   league: string;
//   postedQuestions: string[];
//   likedQuestions: string[];
//   savedQuestions: string[];
// }
