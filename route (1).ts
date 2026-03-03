name: Build Windows EXE

on:
  workflow_dispatch:
  push:
    branches: [ "main" ]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build EXE
        run: npm run electron:dist

      - name: Upload installer
        uses: actions/upload-artifact@v4
        with:
          name: PoseRuntime-Installer
          path: dist-electron/*.exe
