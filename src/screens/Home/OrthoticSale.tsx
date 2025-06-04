import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Make sure to install: npm install react-native-vector-icons
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import axios from 'axios';
import WebView from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';

type RootStackParamList = {
  OrthoticSale: {
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      country: string;
      phoneNumber: string;
    };
    RetailerId: string;
  };
};

type OrthoticSaleRouteProp = RouteProp<RootStackParamList, 'OrthoticSale'>;

type Plan = {
  id: string;
  name: string;
  price: string;
  discount: string | null;
  popular: boolean;
  bestValue: boolean;
};

const OrthoticSale = () => {
  const navigation = useNavigation();
  const route = useRoute<OrthoticSaleRouteProp>();
  const { customer, RetailerId } = route.params;
  const [selectedPlan, setSelectedPlan] = useState('6-month');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [_loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [_discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const querySnapshot = await firestore()
          .collection('membershipPlans')
          .get();

        const plansData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];

        // Sort plans based on their duration
        const sortedPlans = plansData.sort((a, b) => {
          const getDuration = (name: string) => {
            if (name.toLowerCase().includes('1 month')) return 1;
            if (name.toLowerCase().includes('6 month')) return 2;
            if (name.toLowerCase().includes('12 month')) return 3;
            return 4; // Any other plans will be placed at the end
          };
          return getDuration(a.name) - getDuration(b.name);
        });

        setPlans(sortedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        Alert.alert('Error', 'Failed to load subscription plans');
      }
    };

    fetchPlans();
  }, []);

  const renderPlanBadge = (plan: Plan) => {
    if (plan.popular) {
      return (
        <View style={styles.popularBadge}>
          <Text style={styles.badgeText}>⭐ Most Popular</Text>
        </View>
      );
    }
    if (plan.bestValue) {
      return (
        <View style={styles.bestValueBadge}>
          <Text style={styles.badgeText}>🥇 Best Value</Text>
        </View>
      );
    }
    return null;
  };

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setCouponError('');
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const userPlan = plans.find(plan => plan.id === selectedPlan);

      // Simplified query with just codeName and isActive
      const couponsSnapshot = await firestore()
        .collection('coupons')
        .where('codeName', '==', couponCode.trim())
        .where('isActive', '==', true)
        .get();

      if (couponsSnapshot.empty) {
        setCouponError('Invalid or expired coupon code');
        setDiscountedPrice(null);
        setAppliedCoupon(null);
        return;
      }

      // Filter valid coupons in memory
      const validCoupon = couponsSnapshot.docs.find(doc => {
        const coupon = doc.data();
        const isValidDate =
          coupon.validFrom <= currentDate &&
          coupon.validThrough >= currentDate;
        const isValidPlan =
          coupon.membershipPlan.toLowerCase() === userPlan?.name.toLowerCase();

        return isValidDate && isValidPlan;
      });

      if (!validCoupon) {
        setCouponError('Coupon not valid for selected plan or has expired');
        setDiscountedPrice(null);
        setAppliedCoupon(null);
        return;
      }

      const couponData = validCoupon.data();
      setDiscountedPrice(couponData.discountedPrice);
      setAppliedCoupon(couponData);
      setCouponError('');
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Error validating coupon');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    const userPlan = plans.filter((plan) => plan.id.includes(selectedPlan));
    const Price = appliedCoupon ? appliedCoupon.discountedPrice.toString() : userPlan[0].price.replace('€', '');
    setLoading(true);
    try {
      const response = await axios.post('https://myfootfirstserver.onrender.com/create-checkout-session', {
        name: userPlan[0].name,
        price: Price,
        couponCode: appliedCoupon ? couponCode : undefined,
      });

      setCheckoutUrl(response.request.responseURL);
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      Alert.alert('Error', 'Failed to initiate checkout', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = useCallback(async (navState: { url: string }) => {
    const userPlan = plans.filter((plan) => plan.id.includes(selectedPlan));
    if ((navState.url.includes('/success') || navState.url.includes('?success=true'))) {
      try {
        // return;

        await firestore()
          .collection('Retailers')
          .doc(RetailerId)
          .set({
            subscription: {
              plan: userPlan[0].name,
              paid: true,
              timestamp: firestore.FieldValue.serverTimestamp(),
            },
          }, { merge: true });


        navigation.navigate('FootScanScreen', { customer, RetailerId });
      } catch (error) {
        console.error('Error saving order:', error);
        Alert.alert('Error', 'Failed to save order details', [{ text: 'OK' }]);
      }
    } else if (navState.url.includes('/cancel') || navState.url.includes('?canceled=true')) {
      Alert.alert('Payment Canceled', 'Your payment was canceled.', [{ text: 'OK' }]);
      setCheckoutUrl('');
    }
  }, [RetailerId, selectedPlan, navigation]);

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
      <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: '#00843D', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', left: 16 }}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Unlock Your Business Potential</Text>
      </View>
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Icon name="briefcase" size={24} color="#00843D" />
            <Text style={styles.header}>Go Premium – Grow Your Business with Smart Scanning</Text>
          </View>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Icon name="lock-open" size={18} color="#00843D" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Unlock New Revenue with Orthotic Sales</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="brain" size={18} color="#00843D" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>AI Foot Analysis – Accurate & Professional</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="box-open" size={18} color="#00843D" style={styles.benefitIcon} />
              <Text style={styles.benefitText}>Fast Order Fulfilment, Seamless Commission</Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planOption,
                  selectedPlan === plan.id ? styles.planSelected : null
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planRow}>
                  <View style={styles.planLeftSection}>
                    <View style={[
                      styles.radioButton,
                      selectedPlan === plan.id ? styles.radioButtonSelected : null,
                      ,]}>
                      {selectedPlan === plan.id && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>
                  <View style={styles.planPriceSection}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    {plan.discount && (
                      <Text style={styles.discountText}>({plan.discount})</Text>
                    )}
                  </View>
                </View>
                {renderPlanBadge(plan)}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.investmentNote}>💡 Get your investment back with just 2 orthotic orders/month.</Text>

          <View style={styles.couponContainer}>
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!appliedCoupon}
                placeholderTextColor="#000000"
              />
              <TouchableOpacity
                style={[styles.applyButton, appliedCoupon && styles.applyButtonDisabled]}
                onPress={validateAndApplyCoupon}
                disabled={!!appliedCoupon}
              >
                <Text style={styles.applyButtonText}>{appliedCoupon ? 'Applied' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
            {couponError ? (
              <Text style={styles.couponError}>{couponError}</Text>
            ) : appliedCoupon ? (
              <View style={styles.discountContainer}>
                <Text style={styles.appliedDiscountText}>
                  Discount applied for this month! 
                </Text>
                <Text>
                New price: €{appliedCoupon.discountedPrice}
                </Text>
                <Text>
                  Subscription plan will renew for standard price unless cancelled.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setCouponCode('');
                    setDiscountedPrice(null);
                    setAppliedCoupon(null);
                    setCouponError('');
                  }}
                >
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.payButton, _loading && styles.payButtonDisabled]}
            onPress={handlePayNow}
            disabled={_loading}
          >
            <Text style={styles.buttonText}>
              {_loading ? 'Processing...' : 'Pay Now'}
            </Text>
          </TouchableOpacity>
          {/* <Text style={styles.disclaimerText}>Auto-renews. Cancel anytime.</Text> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  benefitIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    color: '#4B5563',
    flex: 1,
  },
  plansContainer: {
    marginBottom: 16,
  },
  planOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    position: 'relative',
  },
  planSelected: {
    borderColor: '#00843D',
    backgroundColor: '#EFF6FF',
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00843D',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#00843D',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00843D',
  },
  planName: {
    fontWeight: '500',
    color: '#1F2937',
  },
  planPriceSection: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1F2937',
  },
  discountText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#00843D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  investmentNote: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  couponContainer: {
    marginBottom: 16,
  },
  couponInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#00843D',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  couponError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  discountContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
  },
  appliedDiscountText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  removeCouponText: {
    color: '#00843D',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  payButton: {
    backgroundColor: '#00843D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  disclaimerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default OrthoticSale;