# 📝 Tasker — Twoja Lista Zadań

**Mobilna aplikacja React Native** do zarządzania zadaniami — z przyjemnym interfejsem, filtrowaniem, widokiem szczegółów, motywacyjnymi cytatami i nutką personalizacji. 🚀

---

## ✨ Funkcje

- 📅 Dodawanie zadań z datą i lokalizacją  
- 🔎 Filtrowanie zadań:
  - według daty (z date pickerem + opcja czyszczenia)
  - według miejsca (radio buttony + czyszczenie filtra)
- ✅ Oznaczanie zadań jako wykonane / niewykonane
- ➕ Dodawanie i usuwanie zadań z bazy danych Supabase
- 💬 Motywacyjne cytaty podczas dodawania zadań
- 📋 Widok szczegółów każdego zadania

---

## 🚧 Technologia

- React Native + Expo  
- Supabase jako backend (Auth + Database)  
- AsyncStorage (obsługa offline)  
- NetInfo (status połączenia)  
- Ikonki: FontAwesome, MaterialIcons  
- Stylizacja własna (StyleSheet)

---

## 📦 Instalacja

```bash
git clone https://github.com/twoj-login/tasker.git
cd tasker
npm install
npx expo start
