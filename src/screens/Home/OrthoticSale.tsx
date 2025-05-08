import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Make sure to install: npm install react-native-vector-icons
import { useNavigation } from '@react-navigation/native';

const OrthoticSale = () => {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState('6-month');
  
  const plans = [
    {
      id: '1-month',
      name: '1 Month',
      price: '€50',
      discount: null,
      popular: false,
      bestValue: false
    },
    {
      id: '6-month',
      name: '6 Months',
      price: '€255',
      discount: '15% off',
      popular: true,
      bestValue: false
    },
    {
      id: '12-month',
      name: '12 Months',
      price: '€420',
      discount: '30% off',
      popular: false,
      bestValue: true
    }
  ];
  
  const renderPlanBadge = (plan) => {
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

  return (
    <SafeAreaView style={styles.container}>
        <View style={{flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: '#00843D', alignItems: 'center', marginBottom: 16}}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', left: 16}}>
                <Icon name="arrow-left" size={24} color="#fff"  />
            </TouchableOpacity>
            <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>Unlock Your Business Potential</Text>
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
                      selectedPlan === plan.id ? styles.radioButtonSelected : null
                    ]}>
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
          
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.buttonText}>Pay Now</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate("FootScanScreen")}>
            <Text style={styles.buttonText}>Scan Foot</Text>
          </TouchableOpacity> */}
          
          <Text style={styles.disclaimerText}>Auto-renews. Cancel anytime.</Text>
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
  payButton: {
    backgroundColor: '#00843D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#00843D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
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