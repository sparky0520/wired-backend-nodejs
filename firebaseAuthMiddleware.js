import { auth } from "./firebaseConfig";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Extract token from 'Bearer TOKEN' format
  const token = authHeader.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "Malformed token" });
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Attach user information to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      authenticated: true,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(403).json({ error: "Invalid token" });
  }
}

// Optional: Method to refresh tokens
export async function refreshToken(idToken) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const user = await auth.getUser(decodedToken.uid);

    // Generate a new ID token
    const newToken = await auth.createCustomToken(user.uid);

    return newToken;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}
