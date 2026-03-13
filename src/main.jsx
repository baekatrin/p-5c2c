import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import './index.css'
// import App from './dbtest.jsx'
import HomePage from "./homepage";
import CreateListing from "./create-listing";   

// JL addition for react routing import 
// { BrowserRouter, Routes, Route } from "react-router-dom";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<HomePage />} />
        <Route path="/create-listing"  element={<CreateListing />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
