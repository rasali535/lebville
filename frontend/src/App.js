import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ChatbotWidget from "./components/ChatbotWidget";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import PaymentReturn from "./pages/PaymentReturn";
import Orders from "./pages/Orders";
import Booking from "./pages/Booking";
import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="/payment/return" element={<PaymentReturn />} />
                
                {/* Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Orders />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="booking" element={<Booking />} />
                  <Route path="profile" element={<div className="font-serif text-3xl">Profile Coming Soon</div>} />
                  <Route path="settings" element={<div className="font-serif text-3xl">Settings Coming Soon</div>} />
                </Route>

                {/* Redirect legacy route */}
                <Route
                  path="/orders"
                  element={<Navigate to="/dashboard/orders" replace />}
                />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
            <ChatbotWidget />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
