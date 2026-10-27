import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(data);

      const savedId = localStorage.getItem('peertutor_user_id');
      const found = data.find(u => String(u.id) === String(savedId));

      if (found) {
        setCurrentUser(found);
      } else if (data.length > 0) {
        // Default to first student for nice student-first demo onboarding
        const firstStudent = data.find(u => u.role === 'STUDENT') || data[0];
        setCurrentUser(firstStudent);
        localStorage.setItem('peertutor_user_id', String(firstStudent.id));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchUser = (userId) => {
    const user = users.find(u => String(u.id) === String(userId));
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('peertutor_user_id', String(user.id));
    }
  };

  const isStudent = currentUser?.role === 'STUDENT' || currentUser?.role === 'BOTH';
  const isTutor = currentUser?.role === 'TUTOR' || currentUser?.role === 'BOTH';

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser,
        switchUser,
        loadingUsers,
        error,
        isStudent,
        isTutor,
        refreshUsers: fetchUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
