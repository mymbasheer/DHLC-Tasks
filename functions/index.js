const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Sends a push notification to a specific user using their FCM token stored in Firestore
async function notifyUser(userId, payload) {
  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: payload.notification,
          data: payload.data || {},
          android: {
            priority: "high",
            notification: {
              sound: "default",
              clickAction: "FLUTTER_NOTIFICATION_CLICK", // Can customize later if needed
            },
          },
        });
        console.log(`Successfully sent notification to user: ${userId}`);
      } else {
        console.log(`User ${userId} does not have an FCM token.`);
      }
    }
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

// 1. Trigger when a NEW task is assigned
exports.onTaskCreated = functions.region('asia-southeast1').firestore
  .document("tasks/{taskId}")
  .onCreate(async (snap, context) => {
    const task = snap.data();
    
    // Don't notify if the creator assigned it to themselves
    if (task.assignedTo === task.createdBy) return null;

    const payload = {
      notification: {
        title: `New Task: ${task.taskTitle}`,
        body: `You have been assigned a new ${task.taskType || "Normal"} task.`,
      },
      data: {
        taskId: context.params.taskId,
        type: "new_task",
      },
    };

    return notifyUser(task.assignedTo, payload);
  });

// 2. Trigger when an EXISTING task is updated (e.g. comments added, status changed)
exports.onTaskUpdated = functions.region('asia-southeast1').firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if comments changed (new follow-up message)
    const beforeComments = before.comments || [];
    const afterComments = after.comments || [];
    
    if (afterComments.length > beforeComments.length) {
      const newComment = afterComments[afterComments.length - 1];
      
      // Notify the person who DIDN'T write the comment
      const notifyUserId = newComment.authorId === after.createdBy ? after.assignedTo : after.createdBy;
      
      // Prevent self-notification if assigner == assignee
      if (notifyUserId !== newComment.authorId) {
        const payload = {
          notification: {
            title: `New Message on: ${after.taskTitle}`,
            body: `${newComment.authorName}: ${newComment.text ? newComment.text : "Sent an attachment"}`,
          },
          data: {
            taskId: context.params.taskId,
            type: "new_message",
          },
        };
        return notifyUser(notifyUserId, payload);
      }
    }

    // Check if status changed
    if (before.status !== after.status) {
      // If assignee changed the status, notify the assigner
      if (after.createdBy !== after.assignedTo) {
        const payload = {
          notification: {
            title: `Task Update: ${after.taskTitle}`,
            body: `Task status changed to ${after.status}`,
          },
          data: {
            taskId: context.params.taskId,
            type: "status_update",
          },
        };
        // We notify the assigner (createdBy) that the task status was updated
        return notifyUser(after.createdBy, payload);
      }
    }
    
    return null;
  });

// 3. Trigger when a NEW broadcast is sent
exports.onBroadcastCreated = functions.region('asia-southeast1').firestore
  .document("broadcasts/{broadcastId}")
  .onCreate(async (snap, context) => {
    const broadcast = snap.data();
    
    // Broadcasts should notify EVERYONE except the creator
    const payload = {
      notification: {
        title: `🚨 Broadcast from ${broadcast.createdByName || "Admin"}`,
        body: broadcast.message || "New broadcast alert received.",
      },
      data: {
        type: "broadcast",
      },
    };

    try {
      const usersSnap = await admin.firestore().collection("users").get();
      const sendPromises = [];
      
      usersSnap.forEach((doc) => {
        const user = doc.data();
        if (user.uid !== broadcast.createdBy && user.fcmToken) {
          const message = {
            token: user.fcmToken,
            notification: payload.notification,
            data: payload.data,
            android: {
              priority: "high",
              notification: { sound: "default" },
            },
          };
          sendPromises.push(admin.messaging().send(message).catch(e => console.error("Broadcast send error:", e)));
        }
      });
      
      await Promise.all(sendPromises);
      console.log(`Broadcast sent to ${sendPromises.length} devices.`);
    } catch (error) {
      console.error("Error sending broadcast:", error);
    }
    return null;
  });
