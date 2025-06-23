# 📝 Tasker — Twoja Lista Zadań

**Mobilna aplikacja React Native** do zarządzania zadaniami — z przyjemnym interfejsem, filtrowaniem, widokiem szczegółów i nutką motywacji. Do dzieła! 🚀

---

## ✨ Funkcje

- 📅 Dodawanie zadań z datą i lokalizacją  
- 🔍 Filtrowanie zadań:
  - 📆 według daty (z date pickerem + opcja czyszczenia filtra)
  - 🏠 według miejsca (radio buttony + opcja czyszczenia filtra)
- ✅ Oznaczanie zadań jako wykonane / niewykonane
- ➕ Dodawanie i usuwanie zadań z bazy danych Supabase
- 📌 Geolokalizacja zadań i podsuwanie użytkownikowi najbliższego z nich, aby pobudzić aktywne planowanie, które znacznie zwiększa szanse na pomyślne ukończenie zadania
- 💬 Motywacyjne cytaty podczas dodawania zadań
- 📋 Widok szczegółów każdego zadania

---

## 🚧 Technologia

- React Native + Expo  
- Supabase jako backend (Auth + Database)  
- AsyncStorage (obsługa odznaczania zadań offline)  
- NetInfo (status połączenia)  
- Ikonki: FontAwesome, MaterialIcons  
- Stylizacja własna (StyleSheet)
- Tooltip: react-native-walkthrough-tooltip

---

## 📦 Instalacja

```bash
git clone https://github.com/marekwietecki/supabaseApp
cd ./supabaseApp
npm install
npx expo start
