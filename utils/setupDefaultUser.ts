import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  termsAccepted: boolean;
  createdAt: string;
}

export const setupDefaultUser = async (): Promise<void> => {
  try {
    // Check if default user already exists
    const existingUsers = await AsyncStorage.getItem('registeredUsers');
    const users: User[] = existingUsers ? JSON.parse(existingUsers) : [];
    
    const defaultUserExists = users.some(user => user.username === 'GBC@123');
    
    if (!defaultUserExists) {
      const defaultUser: User = {
        id: 'default-user-001',
        username: 'GBC@123',
        email: 'gbc@123.com',
        password: 'GBC@123',
        phone: '+44 1234 567890',
        address: '123 High Street',
        city: 'Sawbridgeworth',
        postcode: 'CM21 9AX',
        country: 'United Kingdom',
        termsAccepted: true,
        createdAt: new Date().toISOString(),
      };
      
      users.push(defaultUser);
      await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
      
      console.log('✅ Default test user created successfully');
      console.log('Username: GBC@123');
      console.log('Password: GBC@123');
    } else {
      console.log('✅ Default test user already exists');
    }
  } catch (error) {
    console.error('❌ Error setting up default user:', error);
  }
};

export const clearAllUsers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('registeredUsers');
    await AsyncStorage.removeItem('currentUser');
    console.log('✅ All users cleared');
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const existingUsers = await AsyncStorage.getItem('registeredUsers');
    return existingUsers ? JSON.parse(existingUsers) : [];
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return [];
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUser = await AsyncStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};
