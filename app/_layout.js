import { Slot } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { TasksProvider } from '../contexts/TasksContext';

export default function Layout() {
  return (
    <AuthProvider>
      <TasksProvider>
        <Slot />
      </TasksProvider>
    </AuthProvider>
  );
}
