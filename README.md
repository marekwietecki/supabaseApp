# 📝 Tasker — Twoja Lista Zadań  
Mobilna aplikacja React Native do zarządzania zadaniami — z przyjemnym interfejsem, filtrowaniem, geolokalizacją, szczegółowym widokiem i nutką motywacji. Do dzieła! 🚀

---

## ✨ Funkcje

- 📅 Dodawanie zadań z datą i lokalizacją
- ✅ Oznaczanie zadań jako wykonane / niewykonane
- 📌 Geolokalizacja zadań i wyznaczanie najbliższego względem Twojej pozycji
- 💬 Motywacyjne cytaty przy każdym dodaniu zadania
- 🔍 Filtrowanie zadań:
  - 📆 według daty (z date pickerem + opcja czyszczenia filtra)
  - 🏠 według miejsca (radio buttony + opcja czyszczenia filtra)
- 📋 Widok szczegółów każdego zadania (z opcją otwarcia lokalizacji w mapach)
- 👤 Uwierzytelnianie użytkownika (logowanie, rejestracja, zmiana hasła)
- 🔄 Subskrypcja zmian danych przez Supabase Channels w czasie rzeczywistym
- 🔌 Obsługa offline: cache zadań w `AsyncStorage`, fallback działania bez internetu

---

## 🧠 Architektura aplikacji

- **Context API**  
  - `AuthContext`: zarządza sesją, użytkownikiem i stanem zalogowania  
  - `TasksContext`: centralna logika zadań (CRUD, subskrypcje, offline, filtrowanie)
- **Rozdzielenie logiki od widoków**: komponenty są czyste, a cała logika zamknięta w contextach
- **Responsywny layout**: layouty dopasowują się do szerokości ekranu

---

## 🧰 Technologie

- 📱 React Native + Expo
- 💽 Supabase jako backend (Auth + Database)
- 💾 AsyncStorage (cache offline)
- 🌍 Expo Location + Geocoding (adresy, lokalizacja)
- 🌐 NetInfo (status połączenia)
- 🎨 StyleSheet (własna stylizacja)
- 🔤 Ikony: FontAwesome, MaterialIcons
- 🧭 Nawigacja: Expo Router

---

## 📦 Instalacja

```bash
git clone https://github.com/marekwietecki/supabaseApp
cd ./supabaseApp
npm install
npx expo start
