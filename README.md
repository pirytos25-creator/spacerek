# Archiwum Cienia: Żywa Ulica (2.5D Cinematic Walk)

Prototyp (Proof of Concept) interaktywnego spaceru w 2.5D po wirtualnym Toruniu. Projekt pozwala na płynne, filmowe przemieszczanie się w stronę docelowego budynku ("Archiwum"), używając pojedynczej zmiennej postępu sterowanej kółkiem myszy, klawiaturą lub dotykiem (scroll/swipe).

## Technologia
Projekt został napisany z użyciem czystych technologii webowych (Pure HTML, CSS, Vanilla JS), bez wykorzystania zewnętrznych bibliotek (np. Three.js czy React).

Cały silnik renderowania opiera się na innowacyjnym systemie segmentowym, tzw. "Optical Flow":
- 8 wysokiej jakości (HD) prerenderowanych obrazów.
- 7 segmentów przestrzennych.
- Płynny "Dolly Push": odpowiednie sterowanie własnością `transform-origin` (celującą w vanishing point danej klatki) oraz precyzyjna skala obrazu sprawiają wrażenie ciągłego lotu kamery w 3D.
- Synchroniczny Crossfade: w momencie przejścia pomiędzy dwiema klatkami ich pozycja, zoom oraz wektory ruchu są synchronizowane, by zniwelować poczucie pokazu slajdów na rzecz płynnego ruchu "Steadicam".

## Uruchomienie
Projekt nie wymaga żadnego systemu kompilacji czy serwera Node.js do zbudowania.

1. Sklonuj repozytorium.
2. Odpal dowolny lokalny serwer HTTP (np. przez rozszerzenie "Live Server" w VS Code lub `python -m http.server`).
3. Otwórz stronę w przeglądarce (najlepiej na Chromium ze względu na zoptymalizowane renderowanie akcelerowane sprzętowo).
*(Z uwagi na blokady CORS dla zewnętrznych assetów audio/zdjęć, otwieranie bezpośrednio `file://index.html` z dysku może nie załadować wszystkich elementów poprawine).*

## Sterowanie
* **Desktop:** Kółko myszy (Scroll), Klawisze W/S, Strzałki Góra/Dół.
* **Mobile / Tablet:** Swipe palcem po ekranie w górę i w dół.

## Główne pliki silnika
- `app.js` - Silnik obsługujący fizykę pędu (velocity), wyliczanie aktualnego segmentu trasy oraz modyfikacje klatek w oparciu o obiekt konfiguracyjny `segments`.
- `styles.css` - Minimalistyczny design zoptymalizowany pod sprzętową akcelerację `will-change`. Zastosowano jedynie lekki color grading CSS.
- `index.html` - Struktura trasy i minimalistyczny interfejs HUD przypominający kinowy ekran.

## Status projektu
Ten etap jest zamrożonym eksperymentem architektonicznym (V4 HD), który udowodnił, że wysokiej jakości grafiki 2D potrafią – za sprawą sprytnego 7-segmentowego silnika transformacji – zastąpić skomplikowane i zasobożerne silniki WebGL dla wybranych narracyjnych sekwencji "szynowych".
