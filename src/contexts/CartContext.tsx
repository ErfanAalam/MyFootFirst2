import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useUser } from './UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define cart item type
export interface CartItem {
  id: string;
  title: string;
  price: number;
  selectedImage: string;
  quantity: number;
  newPrice: string;
  priceValue: number;
  image?: string;
  size?: string;
  color?: string,
  customerId: string;
  markupAtTimeOfSale?: {
    Sport: string;
    Active: string;
    Comfort: string;
    timestamp: number;
  };
}

// Define context type
interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string, customer: any) => void;
  updateQuantity: (productId: string, quantity: number, customer: any) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  RetailerId: string;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => { },
  removeFromCart: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  getCartTotal: () => 0,
  getItemCount: () => 0,
  RetailerId: '',
});

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { userData } = useUser();
  const [customerData, setCustomerData] = useState<any>(null);
  const [RetailerId, setRetailerId] = useState<string>('');

  useEffect(() => {
    if (userData?.RetailerId) {
      setRetailerId(userData.RetailerId.toString());
    } else {
      const loadRetailerId = async () => {
        const storedId = await AsyncStorage.getItem('RetailerId');
        if (storedId) {
          setRetailerId(storedId);
        }
      };
      loadRetailerId();
    }
  }, [userData?.RetailerId]);

  // Load customer data from AsyncStorage
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customerStr = await AsyncStorage.getItem('customer');
        if (customerStr) {
          setCustomerData(JSON.parse(customerStr));
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
    };
    loadCustomerData();
  }, []);

  // Setup real-time listener for cart changes
  useEffect(() => {
    if (!userData?.id || !RetailerId) {
      setItems([]);
      return;
    }

    const userDoc = firestore().collection('Retailers').doc(RetailerId);

    // Create a real-time listener
    const unsubscribe = userDoc.onSnapshot((snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data();
        const cartItems = Array.isArray(data?.cart) ? data.cart : [];
        setItems(cartItems);
      } else {
        setItems([]);
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
      setItems([]);
    });

    return () => unsubscribe();
  }, [RetailerId, userData?.id]);

  // Add product to cart
  const addToCart = async (product: any, quantity: number = 1) => {
    if (!userData?.id || !customerData) return;

    try {
      const userDoc = firestore().collection('Retailers').doc(RetailerId);
      const retailerDoc = await userDoc.get();
      const retailerData = retailerDoc.data();

      // Get current markup
      const currentMarkup = retailerData?.currentMarkup || {
        Sport: '0',
        Active: '0',
        Comfort: '0',
        timestamp: Date.now()
      };

      // Check if product already exists in cart
      const existingItemIndex = items.findIndex(item => item.id === product.id);

      if (existingItemIndex >= 0) {
        // If product exists, update its quantity
        const existingItem = items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        await updateQuantity(product.id, newQuantity, customerData);
      } else {
        // Otherwise add as new item with markup at time of sale
        const cartItem: CartItem = {
          customerId: customerData.id,
          id: product.id,
          title: product.title,
          price: product.price,
          newPrice: product.newPrice,
          image: product.image || product.selectedImage,
          size: product.selectedSize || '',
          quantity: quantity,
          color: product.selectedColor || '',
          priceValue: product.priceValue,
          markupAtTimeOfSale: currentMarkup
        };

        // Get current cart data first
        const doc = await userDoc.get();
        const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

        // Create new cart array with added item
        const newCart = [...currentCart, cartItem];

        // Update the cart
        await userDoc.set({
          cart: newCart
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId: string, customer: any) => {
    if (!userData?.id || !customerData) return;

    try {
      const userDoc = firestore().collection('Retailers').doc(RetailerId);

      // Find the exact item to remove
      const itemToRemove = items.find(item => item.id === productId && customer.id === customerData.id);
      if (!itemToRemove) return;

      // Get current cart
      const doc = await userDoc.get();
      // Ensure we have a valid array
      const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

      // Create new cart without the item
      const newCart = currentCart.filter((item: CartItem) => item.id !== productId);

      // Update Firestore with new cart
      await userDoc.update({
        cart: newCart
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Update product quantity
  const updateQuantity = async (productId: string, newQuantity: number, customer: any) => {
    if (!userData?.id || !customerData || newQuantity < 1) return;

    console.log(customer)

    try {
      const userDoc = firestore().collection('Retailers').doc(RetailerId);

      // Get current cart
      const doc = await userDoc.get();
      // Ensure we have a valid array
      const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

      // Create new cart with updated quantity
      const newCart = currentCart.map((item: CartItem) =>
        item.id === productId && customerData.id === customer.id ? { ...item, quantity: newQuantity } : item
      );

      // Update Firestore with new cart
      await userDoc.update({
        cart: newCart,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!userData?.id) return;

    try {
      const userDoc = firestore().collection('Retailers').doc(RetailerId);
      await userDoc.update({
        cart: []
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Calculate total price
  const getCartTotal = () => {
    // Ensure we're working with a valid array
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  // Calculate total items
  const getItemCount = () => {
    // Ensure we're working with a valid array
    if (!Array.isArray(items)) return 0;
    return items.reduce((count, item) => count + (item.quantity || 0), 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getItemCount,
      RetailerId
    }}>
      {children}
    </CartContext.Provider>
  );
};
