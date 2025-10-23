# Jak zaktualizować ikonę aplikacji BizOps.app

## Metoda 1: Automatyczna (zalecana)

Użyj narzędzia `iconutil` (wbudowane w macOS):

```bash
# 1. Stwórz folder dla ikon w różnych rozmiarach
mkdir icon.iconset

# 2. Wygeneruj PNG w różnych rozmiarach z favicon.svg
# Możesz użyć narzędzia online lub ImageMagick:
# brew install imagemagick

# 3. Stwórz wszystkie wymagane rozmiary:
for size in 16 32 64 128 256 512; do
  # Standard resolution
  convert -background none -resize ${size}x${size} public/favicon.svg "icon.iconset/icon_${size}x${size}.png"
  
  # Retina resolution (2x)
  size2=$((size * 2))
  convert -background none -resize ${size2}x${size2} public/favicon.svg "icon.iconset/icon_${size}x${size}@2x.png"
done

# 4. Wygeneruj plik .icns
iconutil -c icns icon.iconset -o AppIcon.icns

# 5. Zastąp starą ikonę
cp AppIcon.icns BizOps.app/Contents/Resources/AppIcon.icns

# 6. Wyczyść cache
rm -rf ~/Library/Caches/com.apple.iconservices.store
killall Finder
killall Dock

# 7. Posprzątaj
rm -rf icon.iconset
```

## Metoda 2: Ręczna

1. Otwórz `public/favicon.svg` w edytorze graficznym (np. Inkscape, Affinity Designer)
2. Wyeksportuj jako PNG w rozmiarze 1024x1024px
3. Użyj online converter (np. https://cloudconvert.com/png-to-icns)
4. Zastąp `BizOps.app/Contents/Resources/AppIcon.icns`
5. Wyczyść cache:
   ```bash
   rm -rf ~/Library/Caches/com.apple.iconservices.store
   killall Finder
   killall Dock
   ```

## Metoda 3: Użyj Image2icon (aplikacja macOS)

1. Pobierz Image2icon z Mac App Store (darmowa)
2. Przeciągnij `public/favicon.svg` do aplikacji
3. Wybierz format ICNS
4. Zapisz jako AppIcon.icns
5. Zastąp w BizOps.app/Contents/Resources/

---

Po zaktualizowaniu ikony:
- Finder może potrzebować chwili na odświeżenie
- Możesz musić wylogować się i zalogować ponownie
- Sprawdź w Dock czy ikona się zmieniła


