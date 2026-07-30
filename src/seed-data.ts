import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function seedInitialData() {
  try {
    console.log('Checking database seeding status...');

    // 1. Settings
    const settingsRef = doc(db, 'settings', 'expense_config');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      console.log('Seeding settings/expense_config...');
      await setDoc(settingsRef, { maxExpenseLimit: 5000 });
    }

    // 5. Owner bootstrap user
    const ownerRef = doc(db, 'users', 'owner_123');
    const ownerSnap = await getDoc(ownerRef);
    if (!ownerSnap.exists()) {
      console.log('Seeding bootstrap owner account...');
      await setDoc(ownerRef, {
        uid: 'owner_123',
        name: 'Admin',
        email: 'mymbasheer@gmail.com',
        role: 'Owner',
        permissions: { canCreateTasks: true, canManageUsers: true },
        status: 'Active'
      });
    }

    console.log('Seeding check completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}
