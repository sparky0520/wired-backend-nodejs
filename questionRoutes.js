import express from "express";
import { db } from "./firebaseConfig.js";
import { authenticateUser } from "./authMiddleware.js";

const router = express.Router();

// Get paginated questions
router.get("/", authenticateUser, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;
    const snapshot = await db
      .collection("questions")
      .orderBy("createdAt", "desc")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a new question
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const questionData = req.body.question;

    // Validate question data
    if (
      !questionData.content ||
      !questionData.options ||
      !questionData.correct
    ) {
      return res.status(400).json({ error: "Invalid question data" });
    }

    // Add timestamp and initial stats
    const newQuestion = {
      ...questionData,
      likes: 0,
      saves: 0,
      createdAt: new Date(),
      createdBy: user.uid,
    };

    // Add question to questions collection
    const questionRef = await db.collection("questions").add(newQuestion);

    // Update user's posted questions
    await db
      .collection("profiles")
      .doc(user.uid)
      .update({
        postedQuestions: db.FieldValue.arrayUnion(questionRef.id),
      });

    res.status(201).json({ id: questionRef.id, ...newQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a question
router.delete("/:questionId", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { questionId } = req.params;

    // Verify question ownership
    const questionDoc = await db.collection("questions").doc(questionId).get();
    if (questionDoc.data().createdBy !== user.uid) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this question" });
    }

    // Delete question
    await db.collection("questions").doc(questionId).delete();

    // Remove from user's posted questions
    await db
      .collection("profiles")
      .doc(user.uid)
      .update({
        postedQuestions: db.FieldValue.arrayRemove(questionId),
      });

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a question
router.post("/like/:questionId", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { questionId } = req.params;

    // Atomic transaction to update likes and user profile
    await db.runTransaction(async (transaction) => {
      const questionRef = db.collection("questions").doc(questionId);
      const profileRef = db.collection("profiles").doc(user.uid);

      transaction.update(questionRef, { likes: db.FieldValue.increment(1) });
      transaction.update(profileRef, {
        likedQuestions: db.FieldValue.arrayUnion(questionId),
      });
    });

    res.status(200).json({ message: "Question liked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlike a question
router.post("/unlike/:questionId", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { questionId } = req.params;

    // Atomic transaction to update likes and user profile
    await db.runTransaction(async (transaction) => {
      const questionRef = db.collection("questions").doc(questionId);
      const profileRef = db.collection("profiles").doc(user.uid);

      // Ensure the question was previously liked
      const profileDoc = await transaction.get(profileRef);
      const likedQuestions = profileDoc.data().likedQuestions || [];

      if (!likedQuestions.includes(questionId)) {
        throw new Error("Question was not previously liked");
      }

      transaction.update(questionRef, { likes: db.FieldValue.increment(-1) });
      transaction.update(profileRef, {
        likedQuestions: db.FieldValue.arrayRemove(questionId),
      });
    });

    res.status(200).json({ message: "Question unliked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a question
router.post("/save/:questionId", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { questionId } = req.params;

    // Atomic transaction to update saves and user profile
    await db.runTransaction(async (transaction) => {
      const questionRef = db.collection("questions").doc(questionId);
      const profileRef = db.collection("profiles").doc(user.uid);

      transaction.update(questionRef, { saves: db.FieldValue.increment(1) });
      transaction.update(profileRef, {
        savedQuestions: db.FieldValue.arrayUnion(questionId),
      });
    });

    res.status(200).json({ message: "Question saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsave a question
router.post("/unsave/:questionId", authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { questionId } = req.params;

    // Atomic transaction to update saves and user profile
    await db.runTransaction(async (transaction) => {
      const questionRef = db.collection("questions").doc(questionId);
      const profileRef = db.collection("profiles").doc(user.uid);

      // Ensure the question was previously saved
      const profileDoc = await transaction.get(profileRef);
      const savedQuestions = profileDoc.data().savedQuestions || [];

      if (!savedQuestions.includes(questionId)) {
        throw new Error("Question was not previously saved");
      }

      transaction.update(questionRef, { saves: db.FieldValue.increment(-1) });
      transaction.update(profileRef, {
        savedQuestions: db.FieldValue.arrayRemove(questionId),
      });
    });

    res.status(200).json({ message: "Question unsaved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
