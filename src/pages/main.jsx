import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import './index.css'
import HomePage from "./homepage";
import CreateListing from "./createlisting";
import Dbtest from "./dbtest";
import ViewListing from "./viewlisting";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<HomePage />} />
        <Route path="/createlisting"  element={<CreateListing />} />
        <Route path="/dbtest"         element={<Dbtest />} />
        <Route path="/product/:id"    element={<ViewListing />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
