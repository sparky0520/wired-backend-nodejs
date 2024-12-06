import express from "express";
import { db } from "./firebaseConfig.js";
import { authenticateUser, calculateLeague } from "./authMiddleware.js";

const router = express.Router();

// Get profile by username
router.get("/:username", authenticateUser, async (req, res) => {
  try {
    const { username } = req.params;
    const profileSnapshot = await db
      .collection("profiles")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (profileSnapshot.empty) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = profileSnapshot.docs[0].data();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit display name
router.patch("/edit/:displayName", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { displayName } = req.params;

    // Update display name
    await db.collection("profiles").doc(user.uid).update({ displayName });

    res.status(200).json({ message: "Display name updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Answer a question
router.post(
  "/attempt/:questionId/:optionSelected",
  authenticateUser,
  async (req, res) => {
    try {
      const { user } = req;
      const { questionId, optionSelected } = req.params;

      // Verify the answer
      const questionDoc = await db
        .collection("questions")
        .doc(questionId)
        .get();
      const questionData = questionDoc.data();

      const isCorrect = questionData.correct === optionSelected;

      // If correct, update points and potentially league
      if (isCorrect) {
        const profileRef = db.collection("profiles").doc(user.uid);

        // Transaction to safely update points
        await db.runTransaction(async (transaction) => {
          const profileDoc = await transaction.get(profileRef);
          const currentPoints = profileDoc.data().points || 0;
          const newPoints = currentPoints + 10; // Award 10 points for correct answer
          const newLeague = calculateLeague(newPoints);

          transaction.update(profileRef, {
            points: newPoints,
            league: newLeague,
          });
        });
      }

      res.status(200).json({
        correct: isCorrect,
        message: isCorrect ? "Correct answer!" : "Incorrect answer.",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
