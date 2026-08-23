const functions = require("firebase-functions/v1");
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
              clickAction: "FLUTTER_NOTIFICATION_CLICK",
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

// Helper to notify all members of a department
async function notifyDepartment(departmentId, excludeUserId, payload) {
  try {
    const usersSnap = await admin.firestore().collection("users").get();
    const tokens = [];

    usersSnap.forEach((doc) => {
      const u = doc.data();
      if (u.uid === excludeUserId) return;
      const uDepts = u.departmentIds && Array.isArray(u.departmentIds) ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
      if (uDepts.includes(departmentId) && u.fcmToken) {
        tokens.push(u.fcmToken);
      }
    });

    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length; i += 500) {
        const batchTokens = tokens.slice(i, i + 500);
        await admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          notification: payload.notification,
          data: payload.data || {},
        });
      }
      console.log(`Successfully notified ${tokens.length} department members for dept: ${departmentId}`);
    }
  } catch (error) {
    console.error(`Error notifying department ${departmentId}:`, error);
  }
}

// 1. Trigger when a NEW task is assigned
exports.onTaskCreated = functions.firestore
  .document("tasks/{taskId}")
  .onCreate(async (snap, context) => {
    const task = snap.data();
    const taskId = context.params.taskId;

    const payload = {
      notification: {
        title: `New Task: ${task.taskTitle || "Work Order"}`,
        body: `You have been assigned a new ${task.taskType || "Normal"} task.`,
      },
      data: {
        taskId,
        type: "new_task",
      },
    };

    if (task.assignedTo && task.assignedTo !== task.createdBy) {
      await notifyUser(task.assignedTo, payload);
    } else if (task.assignedDepartmentId) {
      payload.notification.body = `New department task assigned: ${task.taskTitle || "Work Order"}`;
      await notifyDepartment(task.assignedDepartmentId, task.createdBy, payload);
    }

    return null;
  });

// 2. Trigger when an EXISTING task is updated (e.g. comments added, status changed)
exports.onTaskUpdated = functions.firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const taskId = context.params.taskId;

    // Check if comments changed (new follow-up message)
    const beforeComments = before.comments || [];
    const afterComments = after.comments || [];
    
    if (afterComments.length > beforeComments.length) {
      const newComment = afterComments[afterComments.length - 1];
      
      const payload = {
        notification: {
          title: `New Message on: ${after.taskTitle || "Task"}`,
          body: `${newComment.authorName || "Staff"}: ${newComment.text ? newComment.text : "Sent an attachment"}`,
        },
        data: {
          taskId,
          type: "new_message",
        },
      };

      if (newComment.authorId === after.createdBy) {
        // Creator replied: notify assigned user or entire assigned department
        if (after.assignedTo) {
          await notifyUser(after.assignedTo, payload);
        } else if (after.assignedDepartmentId) {
          await notifyDepartment(after.assignedDepartmentId, newComment.authorId, payload);
        }
      } else {
        // Assignee or department staff replied: notify creator
        if (after.createdBy && after.createdBy !== newComment.authorId) {
          await notifyUser(after.createdBy, payload);
        }
      }
    }

    // Check if status changed
    if (before.status !== after.status) {
      if (after.createdBy && after.createdBy !== after.assignedTo) {
        const payload = {
          notification: {
            title: `Task Update: ${after.taskTitle || "Task"}`,
            body: `Task status changed to ${after.status}`,
          },
          data: {
            taskId,
            type: "status_update",
          },
        };
        await notifyUser(after.createdBy, payload);
      }
    }
    
    return null;
  });

// 3. Trigger when a NEW broadcast is sent
exports.onBroadcastCreated = functions.firestore
  .document("broadcasts/{broadcastId}")
  .onCreate(async (snap, context) => {
    const broadcast = snap.data();
    
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
      const tokens = [];
      
      usersSnap.forEach((doc) => {
        const user = doc.data();
        if (user.uid !== broadcast.createdBy && user.fcmToken) {
          tokens.push(user.fcmToken);
        }
      });
      
      if (tokens.length > 0) {
        for (let i = 0; i < tokens.length; i += 500) {
          const batch = tokens.slice(i, i + 500);
          await admin.messaging().sendEachForMulticast({
            tokens: batch,
            notification: payload.notification,
            data: payload.data,
            android: {
              priority: "high",
              notification: { sound: "default" },
            },
          });
        }
        console.log(`Broadcast multicast sent to ${tokens.length} devices.`);
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
    }
    return null;
  });
