import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Model from "./model";

function App() {
  return (
    <main className="container">
      <Model />
    </main>
  );
}

export default App;
