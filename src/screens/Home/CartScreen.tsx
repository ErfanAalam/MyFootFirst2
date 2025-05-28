import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../contexts/CartContext';
import { useUser } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';

const CartScreen = () => {
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { userData } = useUser();
  const navigation = useNavigation();
  const [customerData, setCustomerData] = useState<any>(null);


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

  // State declarations
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);
  const orderProcessedRef = useRef(false);

  const showAlert = (title: string, message: string, _type: 'success' | 'error' | 'info') => {
    Alert.alert(title, message);
  };

  const handlePay = async () => {
    if (!customerData) {
      showAlert('Error', 'Please log in to continue', 'error');
      return;
    }

    let totalPrice = 0;
    items.forEach(item => {
      totalPrice += item.priceValue * item.quantity;
    });

    setLoading(true);
    try {
      const response = await axios.post('https://myfootfirstserver.onrender.com/create-checkout-session', {
        name: items[0].title,
        price: totalPrice,
      });

      orderProcessedRef.current = false;
      setCheckoutUrl(response.request.responseURL);
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      showAlert('Error', 'Failed to initiate checkout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const storeOrderData = useCallback(async () => {
    if (!userData?.id || !customerData || isOrderProcessing) return false;

    setIsOrderProcessing(true);
    try {
      const uniqueKey = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
      const orderId = uniqueKey.split('').sort(() => Math.random() - 0.5).join('').slice(0, 8);

      // Separate insole products from other products
      const insoleProducts = items.filter(item =>
        ['insole-active', 'insole-comfort', 'insole-sport'].includes(item.id)
      );

      // Store insole products in RetailersOrders collection
      if (insoleProducts.length > 0) {
        const insoleOrderData = {
          orderId,
          customerName: customerData.firstName || 'Anonymous',
          customerId: customerData.id,
          dateOfOrder: Date.now(),
          products: insoleProducts.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            priceWithSymbol: item.newPrice,
            quantity: item.quantity,
            image: item.image,
            totalPrice: item.price * item.quantity,
          })),
          totalAmount: insoleProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          orderStatus: 'pending',
        };

        // Create the document structure: RetailersOrders/retailerid/{customerId}/orders/{orderId}
        await firestore()
          .collection('RetailersOrders')
          .doc(userData.RetailerId)
          .collection('customers')
          .doc(customerData.id)
          .collection('orders')
          .doc(orderId)
          .set(insoleOrderData);
      }

      // Clear the cart after successful order
      clearCart();
      return true;
    } catch (error) {
      console.error('Error storing order:', error);
      return false;
    } finally {
      setIsOrderProcessing(false);
    }
  }, [userData, customerData, items, clearCart, isOrderProcessing]);

  const handleNavigationStateChange = useCallback(async (navState: { url: string }) => {
    if ((navState.url.includes('/success') || navState.url.includes('?success=true')) && !orderProcessedRef.current) {
      orderProcessedRef.current = true;

      const orderStored = await storeOrderData();

      if (orderStored) {
        setCheckoutUrl('');
        showAlert('Success', 'Payment successful and order placed!', 'success');
      } else {
        showAlert('Error', 'Payment successful but failed to store order. Please contact support.', 'error');
        setCheckoutUrl('');
      }
    } else if (navState.url.includes('/cancel') || navState.url.includes('?canceled=true')) {
      showAlert('Payment Canceled', 'Your payment was canceled.', 'info');
      setCheckoutUrl('');
    }
  }, [storeOrderData]);

  const handleIncreaseQuantity = (productId: string, currentQuantity: number) => {
    if (!customerData) {
      showAlert('Error', 'Please log in to continue', 'error');
      return;
    }
    updateQuantity(productId, currentQuantity + 1, customerData);
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    if (!customerData) {
      showAlert('Error', 'Please log in to continue', 'error');
      return;
    }
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1, customerData);
    } else {
      removeFromCart(productId, customerData);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.cartItemContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productPrice}>{(item.newPrice).slice(0,1)}{(item.price * item.quantity).toFixed(2)}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleDecreaseQuantity(item.id, item.quantity)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncreaseQuantity(item.id, item.quantity)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            if (!customerData) {
              showAlert('Error', 'Please log in to continue', 'error');
              return;
            }
            removeFromCart(item.id, customerData);
          }}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (checkoutUrl) {
    return (
      <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight }}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.placeholderView} />
      </View>

      {items.length > 0 ? (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
          />

          <View style={styles.cartFooter}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{items[0].newPrice.slice(0,1)}{getCartTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handlePay}
              disabled={loading}
            >
              <Text style={styles.checkoutButtonText}>
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('MainTabs' as never)}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  placeholderView: {
    width: 32,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 16,
  },
  cartItemContainer: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    color: '#333',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#999',
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#666',
  },
  shopNowButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen; 