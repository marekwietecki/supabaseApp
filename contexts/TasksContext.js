// contexts/TasksContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import supabase from '../lib/supabase-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const TasksContext = createContext();

export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Funkcja pobierająca zadania dla danego użytkownika
  const fetchTasks = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', userId);
      if (error) {
        console.error('Błąd pobierania zadań:', error.message);
        return;
      }
      setTasks(data);
      await AsyncStorage.setItem('local-tasks', JSON.stringify(data));
    } catch (e) {
      console.error('Wyjątek w fetchTasks:', e);
    }
  };

  const fetchTaskById = async (id) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Błąd pobierania zadania po ID:', error.message);
        return null;
      }

      // Możesz opcjonalnie dodać zadanie do globalnego state:
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === data.id);
        if (!exists) return [...prev, data];
        return prev;
      });

      return data;
    } catch (e) {
      console.error('Wyjątek w fetchTaskById:', e);
      return null;
    }
  };

  const toggleDoneHandler = async (id, isDone) => {
    try {
      const netState = await NetInfo.fetch();

      if (!netState.isConnected) {
        // 🔌 Offline — aktualizuj stan lokalnie i dodaj do kolejki offline
        setTasks((prev) => {
          const updated = prev.map((task) =>
            task.id === id ? { ...task, is_done: !isDone } : task
          );
          AsyncStorage.setItem('local-tasks', JSON.stringify(updated));
          return updated;
        });

        await addToOfflineQueue({ id, newValue: !isDone });
        console.log('Zapisano zmianę w kolejce offline.');
        return;
      }

      // 🌐 Online — wykonaj aktualizację w bazie
      const { error } = await supabase
        .from('tasks')
        .update({ is_done: !isDone })
        .eq('id', id);

      if (error) {
        console.error('Błąd aktualizacji:', error.message);
        return;
      }

      setTasks((prev) => {
        const updated = prev.map((task) =>
          task.id === id ? { ...task, is_done: !isDone } : task
        );
        AsyncStorage.setItem('local-tasks', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('toggleDoneHandler - wyjątek:', e);
    }
  };

  // Funkcja do usuwania zadania
  const removeTaskHandler = async (id) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Błąd usuwania:', error.message);
        return;
      }
      setTasks((prev) => {
        const updated = prev.filter((task) => task.id !== id);
        AsyncStorage.setItem('local-tasks', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Wyjątek w removeTaskHandler:', e);
    }
  };

  // Funkcja do dodawania zadania
  const addTask = async (newTask) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .single();
      if (error) {
        console.error('Błąd dodawania zadania:', error.message);
        return false;
      }
      setTasks((prev) => [...prev, data]);
      await AsyncStorage.setItem('local-tasks', JSON.stringify([...tasks, data]));
      return true;
    } catch (e) {
      console.error('Wyjątek w addTask:', e);
      return false;
    }
  };

   // Funkcja dodająca wpis do kolejki offline
  const addToOfflineQueue = async (update) => {
    try {
      const storedQueue = await AsyncStorage.getItem('offline-queue');
      let currentQueue = storedQueue ? JSON.parse(storedQueue) : [];
      const newQueue = [...currentQueue, update];
      setOfflineQueue(newQueue);
      await AsyncStorage.setItem('offline-queue', JSON.stringify(newQueue));
    } catch (e) {
      console.error('Błąd przy dodawaniu do offlineQueue:', e);
    }
  };

  const loadOfflineTasks = async () => {
    try {
      const json = await AsyncStorage.getItem('local-tasks');
      if (json !== null) {
        const localData = JSON.parse(json);
        setTasks(localData);
        console.log('📦 Zadania załadowane lokalnie (offline)');
      }
    } catch (e) {
      console.log('❌ Błąd ładowania z AsyncStorage', e);
    }
  };

    // Możesz wywołać loadOfflineTasks() w useEffect, jeśli nie ma połączenia lub inna logika inicjalizacji
  useEffect(() => {
    // Jeśli nie masz połączenia lub sesji, spróbuj załadować dane offline
    const init = async () => {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        await loadOfflineTasks();
      }
    };
    init();
  }, []);

  // Funkcja synchronizująca offlineQueue
  const syncOfflineQueue = async () => {
    try {
      const storedQueue = await AsyncStorage.getItem('offline-queue');
      let updates = storedQueue ? JSON.parse(storedQueue) : offlineQueue;

      if (!updates || updates.length === 0) return;

      for (const update of updates) {
        const { id, newValue } = update;
        const { error } = await supabase
          .from('tasks')
          .update({ is_done: newValue })
          .eq('id', id);
        if (error) {
          console.error(`Błąd synchronizacji dla tasku ${id}:`, error.message);
        }
      }
      setOfflineQueue([]);
      await AsyncStorage.removeItem('offline-queue');
      // Opcjonalnie: odśwież zadania, jeśli masz informacje o użytkowniku
    } catch (e) {
      console.error('Błąd w syncOfflineQueue:', e);
    }
  };

    // Monitorowanie połączenia – automatycznie synchronizuj, gdy urządzenie jest online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, [offlineQueue]);

  const getTaskById = (id) => {
    return tasks.find((task) => task.id === parseInt(id));
  };



  return (
    <TasksContext.Provider
      value={{
        tasks,
        fetchTasks,
        fetchTaskById,
        addTask,
        toggleDoneHandler,
        removeTaskHandler,
        offlineQueue,
        setOfflineQueue,
        loadOfflineTasks,
        addToOfflineQueue,
        syncOfflineQueue,
        getTaskById,
        setTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext);

